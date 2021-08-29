import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  ConvoyrClient,
  ConvoyrConfig,
  ConvoyrRequest,
  createRequest,
  NextHandler,
  RequestOptions,
} from '@convoyr/core';
import { Observable } from 'rxjs';

import { ConvoyrService } from './convoyr.service';

@Injectable()
export class Convoyr implements ConvoyrClient {
  constructor(private _http: HttpClient, private _convoyr: ConvoyrService) {}

  get<TBody>(
    url: string,
    options?: Partial<RequestOptions>
  ): Observable<TBody> {
    return this._buildRequest({
      url,
      options,
      httpHandler$: this._http.get<TBody>(url, options),
    });
  }

  post<TBody>(
    url: string,
    data: unknown,
    options?: Partial<RequestOptions>
  ): Observable<TBody> {
    throw new Error('Method not implemented.');
  }

  put<TBody>(
    url: string,
    data: unknown,
    options?: Partial<RequestOptions>
  ): Observable<TBody> {
    throw new Error('Method not implemented.');
  }

  patch<TBody>(
    url: string,
    data: unknown,
    options?: Partial<RequestOptions>
  ): Observable<TBody> {
    throw new Error('Method not implemented.');
  }

  delete<TBody>(
    url: string,
    options?: Partial<RequestOptions>
  ): Observable<TBody> {
    throw new Error('Method not implemented.');
  }

  /* @todo improve typing */
  private _buildRequest({
    url,
    options: { plugins, ...options },
    httpHandler$,
  }: {
    url: string;
    options: Partial<RequestOptions>;
    httpHandler$;
  }): Observable<any> {
    const request = createRequest({ url, ...options });
    const httpHandler = {
      handle: () => httpHandler$,
    };

    return this._convoyr.handle({
      request,
      plugins,
      httpHandler,
    });
  }
}
