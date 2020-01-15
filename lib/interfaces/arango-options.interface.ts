import {LoadBalancingStrategy} from 'arangojs/lib/cjs/connection';
import {ModuleMetadata, Type} from '@nestjs/common/interfaces';

export interface ArangoConfig {
    url: string;
    isAbsolute?: boolean;
    arangoVersion?: number;
    loadBalancingStrategy?: LoadBalancingStrategy;
    maxRetries?: false | number;
    agent?: any;
    agentOptions?: {
        [key: string]: any;
    };
    headers?: {
        [key: string]: string;
    };
}

export interface ArangoConnection {
    connectionName: string;
    baseDataBase: string;
    auth: {
        user: string,
        password: string,
    };
    retryAttempts?: number;
    retryDelay?: number;
}

export interface ArangoModuleAsyncOptions {
    connectionConfig: ArangoConnection;
    arangoConfig: ArangoConfig;
    connectionFactory?: (connection: any, name: string) => any;
}

export interface ArangoOptionsFactory {
    createArangoOptions():
        | Promise<ArangoModuleAsyncOptions>
        | ArangoModuleAsyncOptions;
}

//
export interface ArangoAsyncConfig extends Pick<ModuleMetadata, 'imports'> {
    connectionName?: string;
    useExisting?: Type<ArangoOptionsFactory>;
    useClass?: Type<ArangoOptionsFactory>;
    useFactory?: (...args: any[]) => Promise<ArangoModuleAsyncOptions> | ArangoModuleAsyncOptions;
    inject?: any[];
}
