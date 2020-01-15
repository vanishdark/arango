import { DynamicModule, Module } from '@nestjs/common';
import { ArangoAsyncConfig, ArangoConfig, ArangoConnection } from './interfaces';
import { ArangoCoreModule } from './arango-core.module';

@Module({})
export class ArangoModule {
  static forRoot(database: ArangoConnection, options: ArangoConfig): DynamicModule {
    return {
      module: ArangoModule,
      imports: [ArangoCoreModule.forRoot(database, options)],
    };
  }

  static forRootAsync(options: ArangoAsyncConfig): DynamicModule {
    return {
      module: ArangoModule,
      imports: [ArangoCoreModule.forRootAync(options)],
    };
  }
}
