import React from 'react';

export const useMemoCustom = <TValue, TDeps>(
  valueGetter: () => TValue, isDepsEqual: (a: TDeps, b: TDeps) => boolean, deps: TDeps
): TValue => {
  const lastData = React.useRef<[TValue, TDeps] | null>(null);
  if (lastData.current === null) {
    const value = valueGetter();
    lastData.current = [value, deps];
    return value;
  }

  const [prevValue, prevDeps] = lastData.current;
  if (isDepsEqual(deps, prevDeps)) {
    return prevValue;
  }
  
  const value = valueGetter();
  lastData.current = [value, deps];
  return value;
};
