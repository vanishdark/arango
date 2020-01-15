import {ModuleMetadata} from '@nestjs/common/interfaces';
import {ModelDefinition} from './model-definition.interface';

export interface AsyncModelFactory
    extends Pick<ModuleMetadata, 'imports'>,
        Pick<ModelDefinition, 'name' | 'collection'> {
    useFactory: (
        ...args: any[]
    ) => ModelDefinition['document'] | Promise<ModelDefinition['document']>;
    inject?: any[];
}
