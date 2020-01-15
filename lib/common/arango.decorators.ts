import { Inject } from '@nestjs/common';
import { getConnectionName, getModelToken } from './arango.utils';

export const InjectConnection = (name?: string) =>
  Inject(getConnectionName(name));

export const InjectModel = (model: string) => Inject(getModelToken(model));
