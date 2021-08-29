import { HttpClient, HttpResponse } from '@angular/common/http';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { createSpyPlugin, SpyPlugin } from '@convoyr/core/testing';
import { ObserverSpy } from '@hirez_io/observer-spy';

import { _CONVOYR_CONFIG } from './convoyr.config';
import { ConvoyrModule } from './convoyr.module';

describe('ConvoyrModule', () => {
  let spyPlugin: SpyPlugin;
  let observerSpy: ObserverSpy<HttpResponse<unknown>>;

  describe('with config', () => {
    beforeEach(() => {
      spyPlugin = createSpyPlugin();
      observerSpy = new ObserverSpy();

      TestBed.configureTestingModule({
        imports: [
          HttpClientTestingModule,
          ConvoyrModule.forRoot({
            plugins: [spyPlugin],
          }),
        ],
      });
    });

    let httpClient: HttpClient;
    beforeEach(() => (httpClient = TestBed.inject(HttpClient)));

    let httpController: HttpTestingController;
    beforeEach(() => (httpController = TestBed.inject(HttpTestingController)));

    afterEach(() => httpController.verify());

    it('should handle http request', () => {
      httpClient
        .get('https://jscutlery.github.io/items/ITEM_ID')
        .subscribe(observerSpy);

      httpController
        .expectOne('https://jscutlery.github.io/items/ITEM_ID')
        .flush({
          id: 'ITEM_ID',
          title: 'ITEM_TITLE',
        });

      expect(observerSpy.receivedNext()).toBe(true);
      expect(observerSpy.receivedComplete()).toBe(true);
      expect(observerSpy.getLastValue()).toEqual({
        id: 'ITEM_ID',
        title: 'ITEM_TITLE',
      });

      expect(spyPlugin.handler.handle).toHaveBeenCalledTimes(1);
      expect(spyPlugin.handler.handle.mock.calls[0][0].request).toEqual({
        url: 'https://jscutlery.github.io/items/ITEM_ID',
        method: 'GET',
        body: null,
        headers: {},
        params: {},
        responseType: 'json',
      });
      expect(typeof spyPlugin.handler.handle.mock.calls[0][0].next).toEqual(
        'object'
      );
      expect(
        typeof spyPlugin.handler.handle.mock.calls[0][0].next.handle
      ).toEqual('function');
    });
  });

  describe('with dynamic config', () => {
    beforeEach(() => {
      spyPlugin = createSpyPlugin();
      observerSpy = new ObserverSpy();

      TestBed.configureTestingModule({
        imports: [
          HttpClientTestingModule,
          ConvoyrModule.forRoot({
            config: () => ({
              plugins: [spyPlugin],
            }),
          }),
        ],
      });
    });

    let httpClient: HttpClient;
    beforeEach(() => (httpClient = TestBed.inject(HttpClient)));

    let httpController: HttpTestingController;
    beforeEach(() => (httpController = TestBed.inject(HttpTestingController)));

    afterEach(() => httpController.verify());

    it('should handle http request', () => {
      httpClient
        .get('https://jscutlery.github.io/items/ITEM_ID')
        .subscribe(observerSpy);

      httpController
        .expectOne('https://jscutlery.github.io/items/ITEM_ID')
        .flush({});

      expect(observerSpy.receivedNext()).toBe(true);
      expect(observerSpy.receivedComplete()).toBe(true);
      expect(spyPlugin.handler.handle).toHaveBeenCalledTimes(1);
    });
  });

  describe('with dynamic config and dependency injection', () => {
    class Service {}

    let configFn: jest.Mock;
    let service: Service;

    beforeEach(() => {
      configFn = jest.fn();
      service = new Service();

      TestBed.configureTestingModule({
        providers: [
          {
            provide: Service,
            useValue: service,
          },
        ],
        imports: [
          HttpClientTestingModule,
          ConvoyrModule.forRoot({
            deps: [Service],
            config: configFn,
          }),
        ],
      });
    });

    it('should handle http request', () => {
      const config = {};
      configFn.mockReturnValue(config);

      /* Injecting config triggers the config factory. */
      expect(TestBed.inject(_CONVOYR_CONFIG)).toEqual(config);

      expect(configFn).toHaveBeenCalledTimes(1);
      expect(configFn).toHaveBeenCalledWith(service);
    });
  });
});
