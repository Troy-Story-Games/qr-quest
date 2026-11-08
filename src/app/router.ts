import { useSyncExternalStore } from 'react';

/**
 * Tiny hash router. Hash URLs work identically on GitHub Pages (sub-path),
 * in Electron (file://) and on any static host without server rewrites.
 */

export type Route =
  | { name: 'home' }
  | { name: 'make' }
  | { name: 'learn' }
  | { name: 'scratch' }
  | { name: 'decorate' }
  | { name: 'scan' }
  | { name: 'hunt' }
  | { name: 'quests' }
  | { name: 'quest'; id: string; daily: boolean }
  | { name: 'trophies' }
  | { name: 'credits' };

export function parseRoute(hash: string): Route {
  const [path, query = ''] = hash.replace(/^#\/?/, '').split('?');
  const [first, second] = path.split('/');
  switch (first) {
    case 'make':
    case 'learn':
    case 'scratch':
    case 'decorate':
    case 'scan':
    case 'hunt':
    case 'quests':
    case 'trophies':
    case 'credits':
      if (first === 'quests' && second) {
        return { name: 'quest', id: second, daily: new URLSearchParams(query).has('daily') };
      }
      return { name: first };
    default:
      return { name: 'home' };
  }
}

export function navigate(path: string): void {
  window.location.hash = `#/${path.replace(/^\//, '')}`;
}

function subscribe(callback: () => void): () => void {
  window.addEventListener('hashchange', callback);
  return () => window.removeEventListener('hashchange', callback);
}

export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash);
  return parseRoute(hash);
}
