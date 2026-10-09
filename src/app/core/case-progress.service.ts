import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

const STORAGE_KEY = 'amberlink.arcade.collected-cases.v1';

/**
 * Progresso do Snake guardado só neste navegador: IDs únicos de cases reais já coletados.
 * No servidor (ou com o storage bloqueado) o progresso fica vazio e nada é gravado.
 */
@Injectable({ providedIn: 'root' })
export class CaseProgressService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly ids = signal<ReadonlySet<string>>(this.read());

  readonly collectedIds = this.ids.asReadonly();

  /** Conta apenas IDs que ainda existem no catálogo ativo, para cases despublicados não inflarem o total. */
  countIn(caseIds: readonly string[]): number {
    const collected = this.ids();
    return caseIds.filter((id) => collected.has(id)).length;
  }

  has(caseId: string): boolean {
    return this.ids().has(caseId);
  }

  collect(caseId: string): void {
    if (!caseId || this.ids().has(caseId)) return;
    const next = new Set(this.ids()).add(caseId);
    this.ids.set(next);
    this.write(next);
  }

  clear(): void {
    this.ids.set(new Set());
    this.write(new Set());
  }

  private read(): ReadonlySet<string> {
    if (!this.isBrowser) return new Set();
    try {
      const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
      return new Set(Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string' && id !== '') : []);
    } catch {
      return new Set();
    }
  }

  private write(ids: ReadonlySet<string>): void {
    if (!this.isBrowser) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
    } catch {
      // Storage cheio ou bloqueado (aba privada): o progresso vale só para esta visita.
    }
  }
}
