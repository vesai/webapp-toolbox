import { useRef } from 'react';

export const useValueMemo = <TValue>(value: TValue, isValuesEqual: (a: TValue, b: TValue) => boolean): TValue => {
  const lastData = useRef<TValue>(value);

  if (!isValuesEqual(value, lastData.current)) {
    lastData.current = value;
  }

  return lastData.current;
};
