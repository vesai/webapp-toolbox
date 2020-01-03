import { fromEvent, Observable, merge } from 'rxjs';
import { filter, map, share } from 'rxjs/operators';

import { SubscribersMap } from './SubscribersMap';

// Make observable with string!?

type ItemEndpoint = {
  observable: Observable<undefined>;
  get(): string | null;
  set(data: string): void;
  remove(): void;
}

export const ObservableWebStorage = (storage: Storage) => {
  const currentStorageObservable = fromEvent<StorageEvent>(window, 'storage')
    .pipe(
      filter(event => event.storageArea === storage),
      share()
    );

  const subscribersMap = SubscribersMap<string, undefined>();

  return {
    item(key: string): ItemEndpoint {
      const currentStorageKeyObservable = currentStorageObservable
        .pipe(
          filter(event => event.key === key),
          map(() => undefined)
        );

      const localChangesSubject = new Observable<undefined>(subscriber =>
        subscribersMap.get(key).subscribe(subscriber));

      const observable = merge(currentStorageKeyObservable, localChangesSubject);

      return {
        get(): string | null {
          return storage.getItem(key);
        },
        set(data: string): void {
          storage.setItem(key, data);
          subscribersMap.next(key, undefined);
        },
        remove(): void {
          storage.removeItem(key);
          subscribersMap.next(key, undefined);
        },
        observable
      };
    }
  };
};
