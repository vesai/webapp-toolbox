import React from 'react';
import stringify from 'fast-json-stable-stringify';
import { startWith } from 'rxjs/operators';

import { ApiGetCache } from './ApiGetCache';
import { useMemoCustom } from './useMemoCustom';

const isEqualArrayOrNull = (a: unknown[] | null, b: unknown[] | null): boolean => {
  if (a === b) {
    return true;
  }
  if (a === null || b === null) {
    return false;
  }
  if (a.length !== b.length) {
    return false;
  }
  return a.every((item, index) => item === b[index]);
}

export const UseGet = () => {
  const apiGetCache = ApiGetCache();

  /**
   * 
   * @param getterFunction Function for making request
   * @param argsArray It can be null if you don't want to do this request now
   * @param timestamp 
   */
  return <TArgs extends any[], TResult>(
    getterFunction: (...args: TArgs) => Promise<TResult>,
    argsArray: TArgs | null,
    timestamp?: number
  ) => {
    const cacheKey = useMemoCustom(
      () => argsArray === null ? null : stringify(argsArray),
      isEqualArrayOrNull,
      argsArray
    );
  
    const [result, setResult] = React.useState<TResult | null>(() => {
      if (cacheKey === null) {
        return null;
      }
      return apiGetCache.getFreshestResult(getterFunction, cacheKey, timestamp);
    });
  
    React.useEffect(
      () => {
        if (cacheKey === null) {
          return;
        }
        const subscription = apiGetCache.getCacheSubscription(getterFunction, cacheKey)
          .pipe(startWith(undefined))
          .subscribe(() => {
            const currentResult = apiGetCache.getFreshestResult(getterFunction, cacheKey, timestamp);
            setResult(currentResult);
            if (currentResult === null) {
              apiGetCache.tryMakeRequest(getterFunction, cacheKey, argsArray, timestamp);
            }
          });
  
        return () => subscription.unsubscribe();
      },
      [getterFunction, cacheKey, timestamp]
    );
    return result;
  };
}
