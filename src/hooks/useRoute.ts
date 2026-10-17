import { useEffect, useState } from 'react';

export const navigate = (path: string) => {
  location.hash = path;
};
export function useRoute() {
  const [route, setRoute] = useState(location.hash.slice(1) || '/');
  useEffect(() => {
    const onHashChange = () => {
      setRoute(location.hash.slice(1) || '/');
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);
  return route;
}
