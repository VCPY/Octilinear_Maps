import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {OctiTestComponent} from './octi-test/octi-test.component';
import {DrawingplaneComponent} from './drawingplane/drawingplane.component';
import {DialogDataSelection, UiMenuComponent} from './ui-menu/ui-menu.component';
import {MatDialogModule, MatDialogRef} from "@angular/material/dialog";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {MatRadioModule} from "@angular/material/radio";
import {MatToolbar, MatToolbarModule} from "@angular/material/toolbar";
import {MatButtonModule} from "@angular/material/button";
import {FormsModule} from "@angular/forms";

@NgModule({
  declarations: [
    AppComponent,
    OctiTestComponent,
    DrawingplaneComponent,
    UiMenuComponent,
    DialogDataSelection
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    MatDialogModule,
    BrowserAnimationsModule,
    MatRadioModule,
    MatToolbarModule,
    MatButtonModule,
    FormsModule
  ],
  providers: [{
    provide: MatDialogRef,
    useValue: {}
  },],
  bootstrap: [AppComponent],
  entryComponents: [DialogDataSelection]
})
export class AppModule {
}
