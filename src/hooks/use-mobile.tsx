import * as React from 'react';

/** Tailwind's `md` breakpoint. */
export const MOBILE_BREAKPOINT = 768;

/**
 * Returns true when the viewport is narrower than `MOBILE_BREAKPOINT`.
 * Updates on resize. Returns `false` during SSR / before hydration.
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(false);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

    const update = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    update();

    mql.addEventListener('change', update);
    return () => mql.removeEventListener('change', update);
  }, []);

  return isMobile;
}