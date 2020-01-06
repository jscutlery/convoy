import {
  createResponse,
  HttpExtRequest,
  HttpExtResponse,
  PluginHandler,
  PluginHandlerArgs
} from '@http-ext/core';
import { defer, EMPTY, merge, Observable, of } from 'rxjs';
import {
  map,
  mergeMap,
  shareReplay,
  switchMapTo,
  takeUntil
} from 'rxjs/operators';
import { CacheEntry, createCacheEntry } from './cache-entry';
import {
  CacheMetadata,
  createCacheMetadata,
  createEmptyCacheMetadata
} from './cache-metadata';
import { HttpExtCacheResponse, WithCacheMetadata } from './cache-response';
import { StorageAdapter } from './storage-adapters/storage-adapter';

export interface HandlerOptions {
  addCacheMetadata: boolean;
  storage: StorageAdapter;
}

export type CacheHandlerResponse = HttpExtResponse | HttpExtCacheResponse;

export class CacheHandler implements PluginHandler {
  private _shouldAddCacheMetadata: boolean;
  private _storage: StorageAdapter;

  constructor({ addCacheMetadata, storage }: HandlerOptions) {
    this._shouldAddCacheMetadata = addCacheMetadata;
    this._storage = storage;
  }

  handle({
    request,
    next
  }: PluginHandlerArgs): Observable<CacheHandlerResponse> {
    const shouldAddCacheMetadata = this._shouldAddCacheMetadata;

    const fromNetwork$: Observable<HttpExtResponse> = next({
      request
    }).pipe(
      mergeMap(response => {
        /* Return response immediately but store in cache as side effect. */
        return merge(
          of(response),
          this._store(request, response).pipe(switchMapTo(EMPTY))
        );
      }),
      shareReplay({
        refCount: true,
        bufferSize: 1
      })
    );

    const fromCache$: Observable<HttpExtResponse> = defer(() =>
      this._load(request)
    ).pipe(
      map(cacheEntry =>
        this._createResponseWithOptionalMetadata({
          response: cacheEntry.response,
          shouldAddCacheMetadata,
          cacheMetadata: createCacheMetadata(cacheEntry)
        })
      ),
      takeUntil(fromNetwork$)
    );

    /* Order is important here because if we subscribe to fromCache$ first, it will subscribe to fromNetwork$
     * and `takeUntil` will immediately unsubscribe from it because the result is synchronous.
     * If fromNetwork$ is first, it will subscribe and the subscription will be shared with the `takeUntil`
     * thanks to shareReplay. */
    return merge(
      fromNetwork$.pipe(
        map(response =>
          this._createResponseWithOptionalMetadata({
            response,
            shouldAddCacheMetadata,
            cacheMetadata: createEmptyCacheMetadata()
          })
        )
      ),
      fromCache$
    );
  }

  /* Store metadata belong cache. */
  private _store(
    request: HttpExtRequest,
    response: HttpExtResponse
  ): Observable<void> {
    return defer(() => {
      const key = this._getCacheKey(request);
      const cacheEntry = createCacheEntry({
        createdAt: new Date(),
        response
      });
      const cache = JSON.stringify(cacheEntry);

      return this._storage.set(key, cache);
    });
  }

  private _load(request: HttpExtRequest): Observable<CacheEntry> {
    return this._storage.get(this._getCacheKey(request)).pipe(
      mergeMap(rawCacheEntry => {
        /* There's no entry. */
        if (rawCacheEntry == null) {
          return EMPTY;
        }

        /* Parse the cache entry. */
        const cacheEntry = createCacheEntry(JSON.parse(rawCacheEntry));

        return of(cacheEntry);
      })
    );
  }

  /* Create a unique key by request URI to retrieve cache later. */
  private _getCacheKey(request: HttpExtRequest): string {
    const { params } = request;
    const hasParams = Object.keys(params).length > 0;

    return JSON.stringify({
      u: request.url,
      p: hasParams ? request.params : undefined
    });
  }

  private _createResponseWithOptionalMetadata({
    response,
    cacheMetadata,
    shouldAddCacheMetadata
  }: {
    response: HttpExtResponse;
    cacheMetadata: CacheMetadata;
    shouldAddCacheMetadata: boolean;
  }): HttpExtResponse | HttpExtCacheResponse {
    const body = shouldAddCacheMetadata
      ? ({
          cacheMetadata,
          data: response.body
        } as WithCacheMetadata)
      : response.body;
    return createResponse({
      ...response,
      body
    });
  }
}
