import { Subject, Observable } from 'rxjs';
import { share } from 'rxjs/operators';

export type SubscribersMap<TKey, TSubscriptionValue> = {
  get(key: TKey): Observable<TSubscriptionValue>;
  next(key: TKey, value: TSubscriptionValue): void;
}

export const SubscribersMap = <TKey, TSubscriptionValue>(): SubscribersMap<TKey, TSubscriptionValue> => {
  const itemsMap = new Map<TKey, [Subject<TSubscriptionValue>, Observable<TSubscriptionValue>]>();
  return {
    get(key: TKey): Observable<TSubscriptionValue> {
      return new Observable(subscriber => {
        const x = itemsMap.get(key);
        if (x !== undefined) {
          return x[1].subscribe(subscriber);
        }

        const obs = (new Observable<TSubscriptionValue>(s => {
          const subject = new Subject<TSubscriptionValue>();
          itemsMap.set(key, [subject, obs]);
          subject.subscribe(s);
          return () => { itemsMap.delete(key); };
        }))
          .pipe(share());

        return obs.subscribe(subscriber);
      });
    },
    next(key: TKey, value: TSubscriptionValue): void {
      const x = itemsMap.get(key);
      if (x !== undefined) {
        x[0].next(value);
      }
    }
  };
};
