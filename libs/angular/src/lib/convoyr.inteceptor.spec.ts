import {
  HttpHandler,
  HttpProgressEvent,
  HttpRequest,
  HttpResponse,
  HttpSentEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { ObserverSpy } from '@hirez_io/observer-spy';

import { createRequest, createResponse, Convoyr } from '@convoyr/core';
import { EMPTY, of, throwError } from 'rxjs';

import { ConvoyrInterceptor } from './convoyr.interceptor';
import { ConvoyrService } from './convoyr.service';

function asMock<TReturn, TArgs extends any[]>(
  value: (...TArgs) => TReturn
): jest.Mock<TReturn, TArgs> {
  return value as jest.Mock<TReturn, TArgs>;
}

describe('ConvoyrInterceptor', () => {
  let convoyrService: ConvoyrService;
  let interceptor: ConvoyrInterceptor;
  let next: HttpHandler;
  let observerSpy: ObserverSpy<HttpResponse<unknown>>;

  beforeEach(() => {
    convoyrService = new ConvoyrService({ plugins: [] });
    interceptor = new ConvoyrInterceptor(convoyrService);
    observerSpy = new ObserverSpy({ expectErrors: true });

    /* Mock `ConvoyrService.handle`. */
    jest.spyOn(convoyrService, 'handle');

    next = {
      /* Just to avoid pipe error. */
      handle: jest.fn().mockReturnValue(EMPTY),
    };
  });

  /* Create an Angular HttpRequest and hand it to interceptor. */
  beforeEach(() => {
    const ngRequest = new HttpRequest('GET', 'https://test.com');

    /* Go! */
    interceptor.intercept(ngRequest, next);
  });

  it('should convert Angular HttpRequest to ConvoyrRequest before handing it to plugins', () => {
    /* Check that request is transformed from Angular HttpRequest to ConvoyrRequest and forwarded to `convoyr`. */
    expect(convoyrService.handle).toHaveBeenCalledTimes(1);
    expect(convoyrService.handle).toHaveBeenCalledWith(
      expect.objectContaining({
        request: createRequest({ url: 'https://test.com', method: 'GET' }),
      })
    );
  });

  it('should convert ConvoyrRequest to Angular HttpRequest after plugins transformations', () => {
    /* Check that request is transformed from ConvoyrRequest to Angular HttpRequest when forwarded to Angular. */
    expect(next.handle).toHaveBeenCalledTimes(1);

    const forwardedNgRequest = asMock(next.handle).mock.calls[0][0];

    expect(forwardedNgRequest).toBeInstanceOf(HttpRequest);
    expect(forwardedNgRequest).toEqual(
      expect.objectContaining({
        method: 'GET',
        url: 'https://test.com',
      })
    );
  });

  it('should ignore HttpEvents except HttpResponse', () => {
    const httpSentEvent: HttpSentEvent = { type: 0 };
    const httpProgressEvent: HttpProgressEvent = {
      type: 3,
      loaded: 1,
      total: 0,
    };
    asMock(next.handle).mockReturnValue(
      of(
        httpSentEvent /* 👈🏻 Simulate some of Angular HttpEvents. */,
        httpProgressEvent,
        new HttpResponse({ body: { answer: 42 } })
      )
    );
    const { request, httpHandler } = asMock(
      convoyrService.handle
    ).mock.calls[0][0];

    httpHandler.handle({ request }).subscribe(observerSpy);

    /* Verify that Angular extra events are ignored in the final handler. */
    expect(observerSpy.receivedNext()).toBe(true);
    expect(observerSpy.receivedComplete()).toBe(true);
    expect(observerSpy.getValuesLength()).toBe(1);
    expect(observerSpy.getLastValue()).toEqual(
      createResponse({ body: { answer: 42 } })
    );
  });

  it('should convert Angular HttpResponse to ConvoyrResponse before handling it back to plugins', () => {
    asMock(next.handle).mockReturnValue(
      of(new HttpResponse({ body: { answer: 42 } }))
    );
    const { request, httpHandler } = asMock(
      convoyrService.handle
    ).mock.calls[0][0];

    httpHandler.handle({ request }).subscribe(observerSpy);

    expect(observerSpy.receivedNext()).toBe(true);
    expect(observerSpy.receivedComplete()).toBe(true);
    expect(observerSpy.getValuesLength()).toBe(1);

    /* 😜 Just making sure that it's not an Angular HttpResponse. */
    expect(observerSpy.getLastValue()).not.toBeInstanceOf(HttpResponse);
    expect(observerSpy.getLastValue()).toEqual(
      createResponse({
        status: 200,
        statusText: 'OK',
        body: {
          answer: 42,
        },
      })
    );
  });

  it('should convert Angular HttpErrorResponse to ConvoyrResponse before handling it back to plugins', () => {
    asMock(next.handle).mockReturnValue(
      throwError(
        new HttpErrorResponse({
          error: '42',
          status: 500,
          statusText: 'Server Error',
        })
      )
    );
    const { request, httpHandler } = asMock(
      convoyrService.handle
    ).mock.calls[0][0];

    httpHandler.handle({ request }).subscribe(observerSpy);

    expect(observerSpy.receivedNext()).toBe(false);
    expect(observerSpy.receivedError()).toBe(true);

    /* Just making sure that it's not an Angular HttpErrorResponse. */
    expect(observerSpy.getError()).not.toBeInstanceOf(HttpErrorResponse);
    expect(observerSpy.getError()).toEqual(
      createResponse({
        body: { error: '42' },
        status: 500,
        statusText: 'Server Error',
      })
    );
  });

  it('should convert plugin ConvoyrResponse to Angular HttpResponse', () => {
    asMock(next.handle).mockReturnValue(
      of(new HttpResponse({ body: { answer: 42 } }))
    );
    const request = new HttpRequest('GET', 'https://test.com');

    interceptor.intercept(request, next).subscribe(observerSpy);

    /* Check there is no raw ConvoyrResponse given to the interceptor. */
    expect(observerSpy.getLastValue()).toBeInstanceOf(HttpResponse);
    expect(observerSpy.getLastValue()).toEqual(
      expect.objectContaining({ body: { answer: 42 } })
    );
  });

  it('should convert plugin ConvoyrResponse to Angular HttpErrorResponse', () => {
    asMock(next.handle).mockReturnValue(
      throwError(
        new HttpErrorResponse({
          error: '42',
          status: 500,
          statusText: 'Server Error',
        })
      )
    );
    const request = new HttpRequest('GET', 'https://test.com');

    interceptor.intercept(request, next).subscribe(observerSpy);

    expect(observerSpy.receivedError()).toBe(true);
    expect(observerSpy.receivedNext()).toBe(false);

    /* Check there is no raw ConvoyrResponse given to the interceptor. */
    expect(observerSpy.getError()).toBeInstanceOf(HttpErrorResponse);
    expect(observerSpy.getError()).toEqual(
      expect.objectContaining({
        error: '42',
        status: 500,
        statusText: 'Server Error',
      })
    );
  });
});
