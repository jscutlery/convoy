import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ConvoyrResponse } from '@convoyr/core';
import { Observable, throwError } from 'rxjs';
import { catchError, filter, map } from 'rxjs/operators';

import { ConvoyrService } from './convoyr.service';
import {
  ErrorBody,
  fromNgErrorResponse,
  fromNgRequest,
  fromNgResponse,
  toNgErrorResponse,
  toNgRequest,
  toNgResponse,
} from './http-converter';

@Injectable()
export class ConvoyrInterceptor implements HttpInterceptor {
  constructor(private _convoyr: ConvoyrService) {}

  intercept(
    ngRequest: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    return this._convoyr
      .handle({
        request: fromNgRequest(ngRequest),
        httpHandler: {
          handle: ({ request }) =>
            next.handle(toNgRequest(request)).pipe(
              filter(
                (httpEvent) =>
                  httpEvent instanceof HttpResponse ||
                  httpEvent instanceof HttpErrorResponse
              ),
              map(fromNgResponse),
              catchError((error: HttpErrorResponse) =>
                throwError(fromNgErrorResponse(error))
              )
            ),
        },
      })
      .pipe(
        map(toNgResponse),
        catchError((error: ConvoyrResponse<ErrorBody>) =>
          throwError(toNgErrorResponse(error))
        )
      );
  }
}
