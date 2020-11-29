import { useState, useEffect } from 'react';

type UseScreenWidthOptions = {
  maxMobileWidthPx: number;
  maxTabletWidthPx: number;
}

type ScreenWidth = {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isMobileOrTablet: boolean;
  isTabletOrDesktop: boolean;
};

type UseScreenWidthHook = () => ScreenWidth;

export const UseScreenWidth = (options: UseScreenWidthOptions): UseScreenWidthHook => {
  const mobileMedia = window.matchMedia(`(max-width: ${options.maxMobileWidthPx}px)`);
  const tabletMedia = window.matchMedia(`(max-width: ${options.maxTabletWidthPx}px)`);

  const changeSizeSubscribers = new Set<() => void>();
  const notiftSubscribers = () => changeSizeSubscribers.forEach(s => s());

  mobileMedia.addListener(notiftSubscribers);
  tabletMedia.addListener(notiftSubscribers);

  const createState = (isMobile: boolean, isTablet: boolean, isDesktop: boolean): ScreenWidth => ({
    isMobile,
    isTablet,
    isDesktop,
    isMobileOrTablet: isMobile || isTablet,
    isTabletOrDesktop: isTablet || isDesktop
  });

  const MOBILE = createState(true, false, false);
  const TABLET = createState(false, true, false);
  const DESKTOP = createState(false, false, true);

  const getCurrentState = () => {
    if (mobileMedia.matches) {
      return MOBILE;
    }
    if (tabletMedia.matches) {
      return TABLET;
    }
    return DESKTOP;
  };

  return () => {
    const [screenWidth, setScreenWidth] = useState<ScreenWidth>(getCurrentState);

    useEffect(
      () => {
        const handleChanges = () => setScreenWidth(getCurrentState());
        changeSizeSubscribers.add(handleChanges);
        return () => { changeSizeSubscribers.delete(handleChanges); };
      },
      []
    );

    return screenWidth;
  };
}
