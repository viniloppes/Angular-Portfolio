import {
  ACESFilmicToneMapping,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  CatmullRomCurve3,
  Color,
  DirectionalLight,
  DoubleSide,
  Group,
  IcosahedronGeometry,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  PointLight,
  Scene,
  SRGBColorSpace,
  Timer,
  Vector3,
  WebGLRenderer,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export type AmberVariant = 'stone' | 'ribbons';

export interface AmberSceneHandle {
  start(): void;
  stop(): void;
  resize(width: number, height: number): void;
  setPointer(x: number, y: number): void;
  dispose(): void;
}

// Índice de refração real do âmbar (~1.54). A cor vem da absorção (attenuation), não do albedo.
function amberMaterial(): MeshPhysicalMaterial {
  return new MeshPhysicalMaterial({
    color: new Color('#ffd27a'),
    roughness: 0.05,
    metalness: 0,
    transmission: 1,
    thickness: 1.5,
    ior: 1.54,
    attenuationColor: new Color('#f7a21b'),
    attenuationDistance: 1.4,
    // Brilho interno leve: âmbar real parece aceso por dentro.
    emissive: new Color('#ff8a00'),
    emissiveIntensity: 0.05,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
    specularIntensity: 0.8,
    specularColor: new Color('#ffe2b8'),
    envMapIntensity: 0.6,
    dispersion: 0.2,
    side: DoubleSide,
  });
}

// Fundo quente atrás do âmbar: a transmissão refrata o que está atrás, então ele precisa de luz para "acender".
function glowBackdrop(edge: string, core: string): Mesh {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, core);
  gradient.addColorStop(0.55, edge);
  gradient.addColorStop(1, edge);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  const mesh = new Mesh(
    new PlaneGeometry(1, 1),
    new MeshBasicMaterial({ map: texture, toneMapped: false }),
  );
  mesh.position.z = -3;
  return mesh;
}

// Ruído determinístico barato (sem dependência) para facetar a pedra de forma irregular.
function hashNoise(x: number, y: number, z: number): number {
  const s = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453;
  return s - Math.floor(s);
}

function buildStone(): Group {
  const group = new Group();
  const geometry = new IcosahedronGeometry(1.15, 1);
  const position = geometry.attributes['position'] as BufferAttribute;
  const v = new Vector3();
  for (let i = 0; i < position.count; i++) {
    v.fromBufferAttribute(position, i);
    const n = hashNoise(Math.round(v.x * 100), Math.round(v.y * 100), Math.round(v.z * 100));
    v.multiplyScalar(0.8 + n * 0.3);
    v.y *= 0.88;
    position.setXYZ(i, v.x, v.y, v.z);
  }
  geometry.computeVertexNormals();
  const material = amberMaterial();
  material.flatShading = true;
  group.add(new Mesh(geometry, material));

  return group;
}

interface Ribbon {
  mesh: Mesh<BufferGeometry, MeshPhysicalMaterial>;
  curve: CatmullRomCurve3;
  width: number;
  phase: number;
  twist: number;
}

const RIBBON_SEGMENTS = 220;

function buildRibbon(points: Vector3[], width: number, phase: number, twist: number): Ribbon {
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(new Float32Array((RIBBON_SEGMENTS + 1) * 2 * 3), 3));
  const index: number[] = [];
  for (let i = 0; i < RIBBON_SEGMENTS; i++) {
    const a = i * 2;
    index.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  geometry.setIndex(index);
  const material = amberMaterial();
  material.thickness = 0.5;
  material.attenuationColor.set('#e8820a');
  material.attenuationDistance = 1.2;
  material.color.set('#ffc070');
  material.envMapIntensity = 0.45;
  return { mesh: new Mesh(geometry, material), curve: new CatmullRomCurve3(points), width, phase, twist };
}

const tmpPoint = new Vector3();
const tmpTangent = new Vector3();
const tmpSide = new Vector3();
const up = new Vector3(0, 0, 1);

// Fita = curva + largura girando ao longo do caminho; recalculada por frame para ondular.
function updateRibbon(ribbon: Ribbon, time: number): void {
  const position = ribbon.mesh.geometry.attributes['position'] as BufferAttribute;
  for (let i = 0; i <= RIBBON_SEGMENTS; i++) {
    const t = i / RIBBON_SEGMENTS;
    ribbon.curve.getPointAt(t, tmpPoint);
    ribbon.curve.getTangentAt(t, tmpTangent);
    tmpPoint.y += Math.sin(t * 6 + time * 0.6 + ribbon.phase) * 0.18;
    const angle = t * ribbon.twist + Math.sin(time * 0.4 + ribbon.phase) * 0.6;
    tmpSide.crossVectors(tmpTangent, up).normalize().applyAxisAngle(tmpTangent, angle);
    const half = ribbon.width / 2;
    position.setXYZ(i * 2, tmpPoint.x + tmpSide.x * half, tmpPoint.y + tmpSide.y * half, tmpPoint.z + tmpSide.z * half);
    position.setXYZ(i * 2 + 1, tmpPoint.x - tmpSide.x * half, tmpPoint.y - tmpSide.y * half, tmpPoint.z - tmpSide.z * half);
  }
  position.needsUpdate = true;
  ribbon.mesh.geometry.computeVertexNormals();
}

export function createAmberScene(
  canvas: HTMLCanvasElement,
  variant: AmberVariant,
  onFirstFrame: () => void,
): AmberSceneHandle {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = SRGBColorSpace;

  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const envMap = pmrem.fromScene(room, 0.04).texture;
  scene.environment = envMap;
  room.dispose();
  pmrem.dispose();

  const key = new DirectionalLight('#fff1dd', 2.2);
  key.position.set(3, 4, 5);
  scene.add(key);

  const camera = new PerspectiveCamera(32, 1, 0.1, 50);
  camera.position.set(0, 0, 6);

  const root = new Group();
  scene.add(root);
  const ribbons: Ribbon[] = [];
  let backdrop: Mesh;

  if (variant === 'stone') {
    backdrop = glowBackdrop('#fdf6ee', '#ffe2a8');
    root.add(buildStone());
    // Luz quente atrás da pedra: acende o centro e deixa as bordas mais densas.
    const glow = new PointLight('#ffb347', 18, 6, 2);
    glow.position.set(0.4, 0.3, -1.4);
    scene.add(glow);
  } else {
    backdrop = glowBackdrop('#fff6ec', '#ffe0b3');
    const specs: [Vector3[], number, number, number][] = [
      [[new Vector3(-6, 1.2, -0.5), new Vector3(-3, -0.4, 0.4), new Vector3(0, 0.9, 0), new Vector3(3, -0.6, 0.5), new Vector3(6, 0.8, -0.3)], 0.9, 0, 5],
      [[new Vector3(-6, -0.8, 0.2), new Vector3(-2.5, 0.7, -0.4), new Vector3(0.5, -0.7, 0.6), new Vector3(3.5, 0.6, -0.2), new Vector3(6, -0.5, 0.3)], 0.6, 2.1, -4],
      [[new Vector3(-6, 0.2, -1), new Vector3(-2, -1.1, -0.6), new Vector3(1.5, 0.2, -0.8), new Vector3(6, -1, -0.9)], 0.45, 4.2, 7],
    ];
    for (const [points, width, phase, twist] of specs) {
      const ribbon = buildRibbon(points, width, phase, twist);
      ribbons.push(ribbon);
      root.add(ribbon.mesh);
    }
  }
  scene.add(backdrop);

  const timer = new Timer();
  const pointer = { x: 0, y: 0 };
  let frame = 0;
  let firstFrameSent = false;

  const render = (timestamp: number) => {
    timer.update(timestamp);
    const delta = Math.min(timer.getDelta(), 0.05);
    const time = timer.getElapsed();
    if (variant === 'stone') {
      root.rotation.y += delta * 0.18;
      root.rotation.x = MathUtils.lerp(root.rotation.x, 0.25 + pointer.y * 0.25, 0.05);
      root.position.x = MathUtils.lerp(root.position.x, pointer.x * 0.12, 0.05);
      root.position.y = Math.sin(time * 0.8) * 0.06;
    } else {
      for (const ribbon of ribbons) updateRibbon(ribbon, time);
      root.rotation.y = MathUtils.lerp(root.rotation.y, pointer.x * 0.12, 0.04);
    }
    renderer.render(scene, camera);
    if (!firstFrameSent) {
      firstFrameSent = true;
      onFirstFrame();
    }
    frame = requestAnimationFrame(render);
  };

  return {
    start() {
      if (frame) return;
      timer.reset();
      frame = requestAnimationFrame(render);
    },
    stop() {
      cancelAnimationFrame(frame);
      frame = 0;
    },
    resize(width, height) {
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      if (variant === 'ribbons') camera.position.z = Math.max(6, 9 / camera.aspect);
      camera.updateProjectionMatrix();
      // O fundo cobre todo o enquadramento na profundidade em que está.
      const distance = camera.position.z - backdrop.position.z;
      const viewHeight = 2 * Math.tan(MathUtils.degToRad(camera.fov / 2)) * distance;
      backdrop.scale.set(viewHeight * camera.aspect * 1.05, viewHeight * 1.05, 1);
    },
    setPointer(x, y) {
      pointer.x = x;
      pointer.y = y;
    },
    dispose() {
      cancelAnimationFrame(frame);
      timer.dispose();
      scene.traverse((object) => {
        if (object instanceof Mesh) {
          object.geometry.dispose();
          const material = object.material as MeshBasicMaterial;
          material.map?.dispose();
          material.dispose();
        }
      });
      envMap.dispose();
      renderer.dispose();
    },
  };
}
