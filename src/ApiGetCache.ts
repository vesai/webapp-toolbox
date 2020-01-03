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
}

export const ApiGetCache = (): ApiGetCache => {
  const cahceItems = new Map<RequestFunction, CacheFunctionItem<any>>();

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
          }
        },
        () => {
          const item = funcCache.cache.get(key);
          if (item !== undefined && item.lastSuccess === undefined) {
            funcCache.cache.delete(key);
          }
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

  return {
    getFreshestResult,
    tryMakeRequest,
    getCacheSubscription
  };
}
