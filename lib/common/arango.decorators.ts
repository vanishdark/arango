import {Inject} from '@nestjs/common';
import {getConnectionName} from './arango.utils';

export const InjectConnection = (name?: string) =>
    Inject(getConnectionName(name));
