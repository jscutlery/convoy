import { CommonModule } from '@angular/common';
import { Component, NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { RouterModule } from '@angular/router';
import { Convoyr } from '@convoyr/angular';
import { WithCacheMetadata } from '@convoyr/plugin-cache';
import { map, shareReplay, startWith, switchMap } from 'rxjs/operators';

import { environment } from '../../environments/environment';
import { Bike } from '../bike/bike';
import { BikeCardModule } from '../bike/bike-card.component';
import { createLoggerPlugin } from '../http/create-logger-plugin';

@Component({
  selector: 'app-bike-search',
  template: `
    <div fxLayout="row" fxLayoutAlign="center">
      <mat-form-field appearance="outline">
        <input
          [formControl]="searchControl"
          matInput
          type="search"
          placeholder="Search"
        />
      </mat-form-field>
    </div>
    <div
      class="bikes"
      fxLayout="row wrap"
      fxLayoutAlign="space-around"
      [class.is-from-cache]="isFromCache$ | async"
    >
      <app-bike-card
        class="bike"
        *ngFor="let bike of bikes$ | async"
        [bike]="bike"
        [routerLink]="['/bikes', bike.id]"
      ></app-bike-card>
    </div>
  `,
  styles: [
    `
      .bike {
        cursor: pointer;
        min-width: 200px;
        max-width: 300px;
        margin: 10px;
      }

      .bikes {
        transition: filter 0.2s;
      }

      .is-from-cache {
        filter: blur(1px) grayscale(80%);
      }

      mat-form-field {
        margin-top: 8px;
      }
    `,
  ],
})
export class BikeSearchComponent {
  searchControl = new FormControl();
  bikesResponse$ = this.searchControl.valueChanges.pipe(
    startWith(''),
    switchMap((query) =>
      this.http.get<WithCacheMetadata<{ bikes: Bike[] }>>(
        environment.apiBaseUrl + '/bikes',
        {
          params: {
            q: query,
          },
          plugins: [createLoggerPlugin()],
        }
      )
    ),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  bikes$ = this.bikesResponse$.pipe(map(({ data }) => data.bikes));
  isFromCache$ = this.bikesResponse$.pipe(
    map(({ cacheMetadata }) => cacheMetadata.isFromCache)
  );

  constructor(private http: Convoyr) {}
}

@NgModule({
  declarations: [BikeSearchComponent],
  exports: [BikeSearchComponent],
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    FlexLayoutModule,
    BikeCardModule,
  ],
})
export class BikeSearchModule {}
