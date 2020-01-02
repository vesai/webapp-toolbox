import React from 'react';
import { Subject } from 'rxjs';

type UseScreenWidthOptions = {
  maxMobileWidth: number;
  maxTabletWidth: number;
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
  const mobileMedia = window.matchMedia(`(max-width: ${options.maxMobileWidth}px)`);
  const tabletMedia = window.matchMedia(`(max-width: ${options.maxTabletWidth}px)`);

  const subject = new Subject();

  mobileMedia.addListener(() => subject.next());
  tabletMedia.addListener(() => subject.next());

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
    const [screenWidth, setScreenWidth] = React.useState<ScreenWidth>(getCurrentState);

    React.useEffect(
      () => {
        const subscription = subject.subscribe(() => setScreenWidth(getCurrentState()));
        return () => subscription.unsubscribe();
      },
      []
    );

    return screenWidth;
  };
}
