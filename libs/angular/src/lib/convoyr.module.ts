import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { ModuleWithProviders, NgModule } from '@angular/core';
import { ConvoyrConfig } from '@convoyr/core';

import { Convoyr } from './convoyr';
import { _CONVOYR_CONFIG } from './convoyr.config';
import { ConvoyrInterceptor } from './convoyr.interceptor';
import { ConvoyrService } from './convoyr.service';

export type ConvoyrModuleArgs =
  | ConvoyrConfig
  | {
      deps?: unknown[];
      config: (...args: unknown[]) => ConvoyrConfig;
    };

@NgModule({})
export class ConvoyrModule {
  static forRoot(args: ConvoyrModuleArgs): ModuleWithProviders<ConvoyrModule> {
    return {
      ngModule: ConvoyrModule,
      providers: [
        Convoyr,
        ConvoyrService,
        {
          provide: _CONVOYR_CONFIG,
          ...('config' in args
            ? {
                deps: args.deps,
                useFactory: args.config,
              }
            : {
                useValue: args,
              }),
        },
        {
          provide: HTTP_INTERCEPTORS,
          multi: true,
          useClass: ConvoyrInterceptor,
        },
      ],
    };
  }
}
