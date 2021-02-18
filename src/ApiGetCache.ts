import { SubscribersMap } from './SubscribersMap';
import { Observable } from 'rxjs';

// TODO delete old items!

type CacheItem<TResponse> = {
  lastSuccess?: { // if undefined => loading
    response: TResponse;
    timestamp: number;
  };
};

type RequestFunction = (...args: any) => Promise<{}>;
type CacheFunctionItem<TResponse> = {
  subscribers: SubscribersMap<string, undefined>;
  cache: Map<string, CacheItem<TResponse>>;
};

export type ApiGetCache = {
  getFreshestResult<TResult>(func: (...args: any) => Promise<TResult>, key: string, requiredTimestamp?: number): TResult | null;
  tryMakeRequest(func: RequestFunction, key: string, data: any, requiredTimestamp?: number): void;
  getCacheSubscription(func: RequestFunction, key: string): Observable<undefined>;
  subscribeNewValue<T1 extends [], T2>(func: (...params: T1) => Promise<T2>): Observable<{ params: T1, result: T2 }>;
}

type ErrorHandler = (error: any) => void;

export const ApiGetCache = (errorHandler: ErrorHandler): ApiGetCache => {
  const cahceItems = new Map<RequestFunction, CacheFunctionItem<any>>();
  const subscriptionsNewValue = SubscribersMap<RequestFunction, { params: any, result: any }>();

  const getFreshestResult = (func: RequestFunction, key: string, requiredTimestamp?: number) => {
    const funcCache = cahceItems.get(func);
    if (funcCache === undefined) {
      return null;
    }
    const cacheItem = funcCache.cache.get(key);
    if (cacheItem === undefined || cacheItem.lastSuccess === undefined) {
      return null;
    }
  
    if (requiredTimestamp === undefined || cacheItem.lastSuccess.timestamp >= requiredTimestamp) {
      return cacheItem.lastSuccess.response;
    }
  
    return null;
  };

  const getOrCreateFuncCache = <TResult>(func: () => Promise<TResult>): CacheFunctionItem<TResult> => {
    const funcCache = cahceItems.get(func);
    if (funcCache !== undefined) {
      return funcCache;
    }

    const newFuncCache = {
      subscribers: SubscribersMap<string, undefined>(),
      cache: new Map<string, CacheItem<TResult>>()
    };
    cahceItems.set(func, newFuncCache);
    return newFuncCache;
  };

  const makeRequest = (func: RequestFunction, key: string, data: any) => {
    const funcCache = getOrCreateFuncCache(func);

    funcCache.cache.set(key, { lastSuccess: undefined });
    const timestamp = Date.now();
    func(...data)
      .then(
        response => {
          const cacheItem = funcCache.cache.get(key);
          if (
            cacheItem === undefined ||
            cacheItem.lastSuccess === undefined ||
            cacheItem.lastSuccess.timestamp < timestamp
          ) {
            funcCache.cache.set(key, { lastSuccess: { response, timestamp } });
            funcCache.subscribers.next(key, undefined);
            subscriptionsNewValue.next(func, { params: data, result: response });
          }
        },
        error => {
          const item = funcCache.cache.get(key);
          if (item !== undefined && item.lastSuccess === undefined) {
            funcCache.cache.delete(key);
          }
          errorHandler(error);
        }
      );
  };

  const tryMakeRequest = (
    func: RequestFunction, key: string, data: any, requiredTimestamp?: number
  ) => {
    const funcCache = getOrCreateFuncCache(func);

    const item = funcCache.cache.get(key);
    if (item === undefined) {
      makeRequest(func, key, data);
      return;
    }
    if (item.lastSuccess === undefined || requiredTimestamp === undefined) {
      return;
    }
    if (item.lastSuccess.timestamp >= requiredTimestamp) {
      return;
    }
    makeRequest(func, key, data);
  };

  const getCacheSubscription = (func: RequestFunction, key: string) => {
    return getOrCreateFuncCache(func).subscribers.get(key);
  };

  const subscribeNewValue = <T1 extends [], T2>(func: (...params: T1) => Promise<T2>): Observable<{ params: T1, result: T2 }> => {
    return subscriptionsNewValue.get(func);
  };

  return {
    getFreshestResult,
    tryMakeRequest,
    getCacheSubscription,
    subscribeNewValue
  };
}
