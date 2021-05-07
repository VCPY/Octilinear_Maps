import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {OctiTestComponent} from './octi-test/octi-test.component';
import {DrawingplaneComponent} from './drawingplane/drawingplane.component';

@NgModule({
  declarations: [
    AppComponent,
    OctiTestComponent,
    DrawingplaneComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
