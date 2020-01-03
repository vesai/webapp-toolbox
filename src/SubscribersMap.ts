import { Subject, Observable } from 'rxjs';

export type SubscribersMap<TKey, TSubscriptionValue> = {
  get(key: TKey): Observable<TSubscriptionValue>;
  next(key: TKey, value: TSubscriptionValue): void;
}

// TODO try to find way without number, only with rx

export const SubscribersMap = <TKey, TSubscriptionValue>(): SubscribersMap<TKey, TSubscriptionValue> => {
  const subscribersMap = new Map<TKey, [Subject<TSubscriptionValue>, number]>();

  return {
    get(key: TKey): Observable<TSubscriptionValue> {

      return new Observable(subscriber => {
        const mapData = subscribersMap.get(key);
        let data: [Subject<TSubscriptionValue>, number];
        if (mapData === undefined) {
          data = [new Subject(), 1];
          subscribersMap.set(key, data);
        } else {
          data = mapData;
          data[1]++;
        }

        data[0].subscribe(subscriber);

        return () => {
          if (data[1] === 1) {
            subscribersMap.delete(key);
          } else {
            data[1]--;
          }
        };
      });
    },
    next(key: TKey, value: TSubscriptionValue): void {
      const subscriber = subscribersMap.get(key);
      if (subscriber !== undefined) {
        subscriber[0].next(value);
      }
    }
  };
};
