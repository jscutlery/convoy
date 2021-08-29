import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { ConvoyrModule } from '@convoyr/angular';
import { createAuthPlugin } from '@convoyr/plugin-auth';
import { createCachePlugin } from '@convoyr/plugin-cache';
import { createRetryPlugin } from '@convoyr/plugin-retry';

import { AuthService } from '../auth/auth.service';
import { rejectUnknownOriginsPlugin } from './reject-unknown-origins-plugin';

@NgModule({
  imports: [
    HttpClientModule,
    ConvoyrModule.forRoot({
      deps: [AuthService, Router, MatSnackBar],
      config(auth: AuthService, router: Router, snackBar: MatSnackBar) {
        return {
          plugins: [
            rejectUnknownOriginsPlugin,
            createCachePlugin({
              addCacheMetadata: true,
            }),
            createRetryPlugin(),
            createAuthPlugin({
              token: auth.token$,
              onUnauthorized: () => {
                auth.setToken(undefined);
                router.navigate(['signin']);
                snackBar.open(
                  `Unauthorized response handled. You've been redirect to the signin form.`,
                  'ok',
                  {
                    duration: 12000,
                  }
                );
              },
            }),
          ],
        };
      },
    }),
  ],
  exports: [HttpClientModule, ConvoyrModule],
})
export class HttpModule {}
