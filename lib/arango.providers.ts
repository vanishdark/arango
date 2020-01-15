import { AsyncModelFactory } from './interfaces/async-model-factory.interface';
import { getConnectionName, getModelToken } from './common/arango.utils';
import { Database } from 'arangojs';
import { flatten } from '@nestjs/common';

export function createArangoAsyncProviders(
  connectionName?: string,
  modelFactories: AsyncModelFactory[] = [],
) {
  const providers = (modelFactories || []).map(model => [
    {
      provide: getModelToken(model.name),
      useFactory: async (connection: Database, ...args: unknown[]) => {
        const schema = await model.useFactory(...args);
        return connection.collection(model.collection).document(model.name);
      },
      inject: [getConnectionName(connectionName), ...(model.inject || [])],
    },
  ]);
  return flatten(providers);
}
