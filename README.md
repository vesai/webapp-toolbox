# webapp-toolbox

## UseScreenWidth
### Initialize
For example in file *./useScreenWidth*
```ts
import { UseScreenWidth } from 'webapp-toolbox';
export const useScreenWidth = UseScreenWidth({
  maxMobileWidth: 1020,
  maxTabletWidth: 1270
});
```
### Usage
```tsx
import { useScreenWidth } from './useScreenWidth';

export const SomeComponent = () => {
  const screenWidth = useScreenWidth();
  return (
    <div>
      <div>isMobile =  {screenWidth.isMobile ? 'YES' : 'NO'}</div>
      <div>isTablet =  {screenWidth.isTablet ? 'YES' : 'NO'}</div>
      <div>isDesktop = {screenWidth.isDesktop ? 'YES' : 'NO'}</div>
      <div>isMobileOrTablet = {screenWidth.isMobileOrTablet ? 'YES' : 'NO'}</div>
      <div>isTabletOrDesktop = {screenWidth.isTabletOrDesktop ? 'YES' : 'NO'}</div>
    </div>
  );
}
```
