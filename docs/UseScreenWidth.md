# UseScreenWidth
Tools for creating react hook for defining page width type (mobile, tablet, desktop)

## Api
### UseScreenWidth
The function for creating *useScreenWidth* react hook.

#### Arguments

##### options
- *maxMobileWidthPx*
- *maxTabletWidthPx*

#### Return value
It returns function useScreenWidth() that returns object with boolean values:
- *isMobile* = *pageWidth* &lt;= *maxMobileWidthPx*
- *isTablet* = *maxMobileWidthPx* &lt; *pageWidth* &lt;= *maxTabletWidthPx*
- *isDesktop* = *maxTabletWidthPx* &lt; *pageWidth*
- *isMobileOrTablet* = *pageWidth* &lt;= *maxTabletWidthPx*
- *isTabletOrDesktop* = *maxMobileWidthPx* &lt; *pageWidth*

## Example

### Initialize
For example in file *./useScreenWidth*
```ts
import { UseScreenWidth } from 'webapp-toolbox';

export const useScreenWidth = UseScreenWidth({
  maxMobileWidthPx: 1020,
  maxTabletWidthPx: 1270
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