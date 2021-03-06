import { useMemo, useEffect } from 'react';
import stringify from 'fast-json-stable-stringify';
import { useSubscription, Subscription } from 'use-subscription';

import { ApiGetCache } from './ApiGetCache';
import { useValueMemo } from './useValueMemo';

const emptyFunction = () => {};

const isEqualArrayOrNull = (a: unknown[] | null, b: unknown[] | null): boolean => {
  if (a === b) {
    return true;
  }
  if (a === null || b === null || a.length !== b.length) {
    return false;
  }
  return a.every((item, index) => item === b[index]);
}

export const UseGet = (apiGetCache: ApiGetCache) => {
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
    const cachedArgsArray = useValueMemo(argsArray, isEqualArrayOrNull);
    const cacheKey = useMemo(
      () => cachedArgsArray === null ? null : stringify(cachedArgsArray),
      [cachedArgsArray]
    );

    const subscriptionParams = useMemo<Subscription<TResult | null>>(
      () => ({
        getCurrentValue: () => {
          if (cacheKey === null) {
            return null;
          }
          apiGetCache.tryMakeRequest(getterFunction, cacheKey, cachedArgsArray, timestamp);
          return apiGetCache.getFreshestResult(getterFunction, cacheKey, timestamp);
        },
        subscribe: callback => {
          if (cacheKey === null) {
            return emptyFunction;
          }

          const subscription = apiGetCache
            .getCacheSubscription(getterFunction, cacheKey)
            .subscribe(callback);
          return () => subscription.unsubscribe();
        }
      }),
      [getterFunction, cacheKey, timestamp]
    );

    useEffect(
      () => {
        if (cacheKey !== null) {
          apiGetCache.tryMakeRequest(getterFunction, cacheKey, cachedArgsArray, timestamp);
        }
      },
      [getterFunction, cacheKey, cachedArgsArray, timestamp]
    );

    return useSubscription(subscriptionParams);
  };
}
