import React from 'react';
import { BehaviorSubject } from 'rxjs';
import { useSubscription, Subscription } from 'use-subscription';

export const useBehaviorSubject = <T>(behaviorSubject: BehaviorSubject<T>) => {
  const subscriptionParams = React.useMemo<Subscription<T>>(
    () => ({
      getCurrentValue: () => behaviorSubject.getValue(),
      subscribe: callback => {
        const subscription = behaviorSubject.subscribe(() => callback());
        return () => subscription.unsubscribe();
      }
    }),
    [behaviorSubject]
  );
  return useSubscription(subscriptionParams);
};
