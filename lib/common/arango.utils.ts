import {DEFAULT_DB_CONNECTION } from '../arango.constants';
import { Observable } from 'rxjs';
import { delay, retryWhen, scan } from 'rxjs/operators';
import { Logger } from '@nestjs/common';

export function getModelToken(model: string) {
  return `${model}`;
}

export function getConnectionName(name?: string) {
  return name && name !== DEFAULT_DB_CONNECTION ? name : DEFAULT_DB_CONNECTION;
}

export function handleRetry(
  retryAttempts = 9,
  retryDelay = 3000,
): <T>(source: Observable<T>) => Observable<T> {
  return <T>(source: Observable<T>) =>
    source.pipe(
      retryWhen(e =>
        e.pipe(
          scan((errorCount, error) => {
            Logger.error(
              `Unable to connect to the database. Retrying (${errorCount +
              1})...`,
              '',
              'ArangoModule',
            );
            if (errorCount + 1 >= retryAttempts) {
              throw error;
            }
            return errorCount + 1;
          }, 0),
          delay(retryDelay),
        ),
      ),
    );
}
