import { PortfolioCase } from './portfolio-case';

export function playableGameUrl(value?: string | null): string | null {
  if (!value) return null;

  try {
    const url = new URL(value.trim());
    if (
      url.protocol !== 'https:' ||
      !url.hostname ||
      url.username ||
      url.password ||
      (typeof window !== 'undefined' && url.origin === window.location.origin)
    ) {
      return null;
    }

    return url.href;
  } catch {
    return null;
  }
}

export function isPlayableCase(item: Pick<PortfolioCase, 'gameUrl'>): boolean {
  return playableGameUrl(item.gameUrl) !== null;
}
