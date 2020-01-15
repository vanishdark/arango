import { DynamicModule, Global, Inject, Logger, Module, OnApplicationShutdown, Provider, Type } from '@nestjs/common';
import { Database } from 'arangojs/lib/async/database';
import { ARANGO_CONNECTION_NAME, ARANGO_MODULE_OPTIONS } from './arango.constants';
import { ModuleRef } from '@nestjs/core';
import { getConnectionName, handleRetry } from './common/arango.utils';
import { defer } from 'rxjs';
import { ArangoAsyncConfig, ArangoConfig, ArangoConnection, ArangoModuleAsyncOptions, ArangoOptionsFactory } from './interfaces';

@Global()
@Module({})
export class ArangoCoreModule implements OnApplicationShutdown{
  constructor(@Inject(ARANGO_CONNECTION_NAME) private readonly connectionName: string,
              private readonly moduleRef: ModuleRef) {
  }

  static forRoot(database: ArangoConnection, options: ArangoConfig): DynamicModule {
    const arangoConnectionName = getConnectionName(database.connectionName);
    let connection: Database;
    try {
      connection = new Database(options).useBasicAuth(database.auth.user, database.auth.password);
    } catch (e) {
      throw new Error(e);
    }
    const arangoConnectionNameProvider = {
      provide: ARANGO_CONNECTION_NAME,
      useValue: arangoConnectionName,
    };
    const connectionProvider = {
      provide: arangoConnectionName,
      useFactory: async (): Promise<any> =>
        await defer(async () => connection.exists()
          .then(value => {
            new Logger(('ArangoModule')).log(value ? 'Connected' : 'Not Connected');
            return connection.useDatabase(database.baseDataBase);
          }))
          .pipe(handleRetry(database.retryAttempts, database.retryDelay))
          .toPromise()
          .catch(e => {
            const obj = { code: e.code, description: e.message };
            new Logger('ArangoModule').error('Could not connect to database. Reason: ' + obj.description);
          }),
    };
    return {
      module: ArangoCoreModule,
      providers: [connectionProvider, arangoConnectionNameProvider],
      exports: [connectionProvider],
    };
  }

  static forRootAync(options: ArangoAsyncConfig) {
    const arangoConnectionName = getConnectionName(options.connectionName);
    const arangoConnectionNameProvider = {
      provide: ARANGO_CONNECTION_NAME,
      useValue: arangoConnectionName,
    };

    const connectionProvider = {
      provide: arangoConnectionName,
      useFactory: async (arangoModuleOption: ArangoModuleAsyncOptions): Promise<any> => {
        const {
          connectionConfig,
          arangoConfig,
          connectionFactory,
          ...arangoOptions
        } = arangoModuleOption;
        const connections = new Database(arangoModuleOption.arangoConfig)
          .useBasicAuth(arangoModuleOption.connectionConfig.auth.user, arangoModuleOption.connectionConfig.auth.password);

        const arangoConnectionFactory = connectionFactory || (connection => connection);

        return await defer(async () => arangoConnectionFactory(connections.exists()
          .then(value => {
            if (value) {
              new Logger(('ArangoModule')).log(value ? 'Connected' : 'Not Connected');
              return connections.useDatabase(arangoModuleOption.connectionConfig.baseDataBase);
            } else {
              return;
            }
          }), arangoConnectionName))
          .pipe(handleRetry(arangoModuleOption.connectionConfig.retryAttempts, arangoModuleOption.connectionConfig.retryDelay)).toPromise()
          .catch(e => {
            const obj = { code: e.code, description: e.message };
            new Logger('ArangoModule').error('Could not connect to database. Reason: ' + obj.description);
          });
      },
      inject: [ARANGO_MODULE_OPTIONS],
    };
    const asyncProviders = this.createAsyncProviders(options);
    return {
      module: ArangoCoreModule,
      imports: options.imports,
      providers: [
        ...asyncProviders,
        connectionProvider,
        arangoConnectionNameProvider,
      ],
      exports: [connectionProvider],
    };
  }

  private static createAsyncProviders(
    options: ArangoAsyncConfig,
  ): Provider[] {
    if (options.useExisting || options.useFactory) {
      return [this.createAsyncOptionsProvider(options)];
    }
    const useClass = options.useClass as Type<ArangoOptionsFactory>;
    return [
      this.createAsyncOptionsProvider(options),
      {
        provide: useClass,
        useClass,
      },
    ];
  }

  private static createAsyncOptionsProvider(
    options: ArangoAsyncConfig,
  ): Provider {
    if (options.useFactory) {
      return {
        provide: ARANGO_MODULE_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject || [],
      };
    }
    // `as Type<MongooseOptionsFactory>` is a workaround for microsoft/TypeScript#31603
    const inject = [
      (options.useClass || options.useExisting) as Type<ArangoOptionsFactory>,
    ];
    return {
      provide: ARANGO_MODULE_OPTIONS,
      useFactory: async (optionsFactory: ArangoOptionsFactory) =>
        await optionsFactory.createArangoOptions(),
      inject,
    };
  }

  async onApplicationShutdown() {
    const connection = this.moduleRef.get<any>(this.connectionName);
    connection && (await connection.close());
  }
}
