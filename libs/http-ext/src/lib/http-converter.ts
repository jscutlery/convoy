import {
  HttpHeaders,
  HttpParams,
  HttpRequest,
  HttpResponse
} from '@angular/common/http';

import { createRequest, HttpExtRequest, HttpMethod } from './request';
import { createResponse, HttpExtResponse } from './response';

function fromNgClass(
  ngClass: HttpHeaders | HttpParams
): { [key: string]: string } {
  return ngClass
    .keys()
    .reduce((_obj, key) => ({ [key]: ngClass.get(key) }), {});
}

export function fromNgRequest(
  request: HttpRequest<unknown>
): HttpExtRequest<unknown> {
  return createRequest({
    url: request.url,
    method: request.method as HttpMethod,
    body: request.body,
    headers: fromNgClass(request.headers),
    params: fromNgClass(request.params)
  });
}

export function toNgRequest(
  request: HttpExtRequest<unknown>
): HttpRequest<unknown> {
  const init = {
    headers: new HttpHeaders(request.headers),
    params: new HttpParams({ fromObject: request.params })
  };

  if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
    return new HttpRequest(request.method, request.url, request.body, init);
  }

  return new HttpRequest(request.method, request.url, init);
}

export function fromNgResponse(
  ngResponse: HttpResponse<unknown>
): HttpExtResponse<unknown> {
  return createResponse({
    data: ngResponse.body,
    headers: fromNgClass(ngResponse.headers),
    status: ngResponse.status,
    statusText: ngResponse.statusText
  });
}

export function toNgResponse(
  response: HttpExtResponse<unknown>
): HttpResponse<unknown> {
  return new HttpResponse({
    body: response.data,
    headers: new HttpHeaders(response.headers),
    status: response.status,
    statusText: response.statusText
  });
}
