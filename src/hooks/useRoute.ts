import { useEffect, useRef, useState } from 'react';

type NavigationGuard = (accept: () => void) => void;
let guard: NavigationGuard | null = null;
const navigationEvent = 'handball:navigation';
const routeNow = () => location.hash.slice(1) || '/';
const historyIndex = (): number | undefined => {
  const value = history.state?.handballRouteIndex;
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
};
function markEntry(index: number, route = routeNow()) {
  history.replaceState({ ...history.state, handballRouteIndex: index }, '', '#' + route);
}
function pushRoute(path: string) {
  if (path === routeNow()) return;
  history.pushState({ handballRouteIndex: (historyIndex() ?? 0) + 1 }, '', '#' + path);
  window.dispatchEvent(new Event(navigationEvent));
}

/** One foreground editor owns the guard; cleanup cannot unregister a newer editor. */
export function registerNavigationGuard(request: NavigationGuard) {
  guard = request;
  return () => {
    if (guard === request) guard = null;
  };
}
export const navigate = (path: string) => {
  if (guard) guard(() => pushRoute(path));
  else pushRoute(path);
};

export function useRoute() {
  const [route, setRoute] = useState(routeNow);
  const current = useRef({ route, index: historyIndex() ?? 0 });
  useEffect(() => {
    markEntry(current.current.index);
    let returning: { route: string; index: number; owner: NavigationGuard } | null = null;
    let approved: string | null = null;
    const commit = () => {
      const next = routeNow();
      const index = historyIndex() ?? current.current.index + 1;
      markEntry(index, next);
      current.current = { route: next, index };
      setRoute(next);
      window.scrollTo(0, 0);
    };
    const revisit = (target: { route: string; index: number }) => {
      approved = target.route;
      history.go(target.index - current.current.index);
    };
    const onHashChange = () => {
      const next = routeNow();
      const index = historyIndex();
      if (returning && next === current.current.route && index === current.current.index) {
        // Restore the original history entry before asking, so repeated Back/Cancel is safe.
        const request = returning;
        returning = null;
        if (guard === request.owner) request.owner(() => revisit(request));
        else revisit(request);
        return;
      }
      if (next === approved) {
        approved = null;
        commit();
        return;
      }
      if (next === current.current.route) return;
      if (guard) {
        if (index !== undefined && index !== current.current.index) {
          returning = { route: next, index, owner: guard };
          history.go(current.current.index - index);
        } else {
          // A typed hash or an older, unindexed history entry still must not discard a draft.
          markEntry(current.current.index, current.current.route);
          guard(() => pushRoute(next));
        }
        return;
      }
      if (index === undefined || index === current.current.index)
        markEntry(current.current.index + 1, next);
      commit();
    };
    window.addEventListener('hashchange', onHashChange);
    window.addEventListener(navigationEvent, commit);
    return () => {
      window.removeEventListener('hashchange', onHashChange);
      window.removeEventListener(navigationEvent, commit);
    };
  }, []);
  return route;
}
