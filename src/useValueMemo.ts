import React from 'react';

export const useValueMemo = <TValue>(value: TValue, isValuesEqual: (a: TValue, b: TValue) => boolean): TValue => {
  const lastData = React.useRef<TValue>(value);

  if (!isValuesEqual(value, lastData.current)) {
    lastData.current = value;
  }

  return lastData.current;
};
