import { Observable } from 'rxjs';

import { ConvoyrPlugin } from './plugin';

export interface RequestOptions {
  plugins: ConvoyrPlugin[];
  params: { [k: string]: string };
  headers: { [k: string]: string };
}

export interface ConvoyrClient {
  get<TBody>(url: string, options?: Partial<RequestOptions>): Observable<TBody>;

  post<TBody, TPayload = unknown>(
    url: string,
    data: TPayload,
    options?: Partial<RequestOptions>
  ): Observable<TBody>;

  put<TBody, TPayload = unknown>(
    url: string,
    data: TPayload,
    options?: Partial<RequestOptions>
  ): Observable<TBody>;

  patch<TBody, TPayload = unknown>(
    url: string,
    data: TPayload,
    options?: Partial<RequestOptions>
  ): Observable<TBody>;

  delete<TBody>(
    url: string,
    options?: Partial<RequestOptions>
  ): Observable<TBody>;
}
