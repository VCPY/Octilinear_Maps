import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {DrawingplaneComponent} from './drawingplane/drawingplane.component';
import {DialogDataSelection, UiMenuComponent} from './ui-menu/ui-menu.component';
import {MatDialogModule, MatDialogRef} from "@angular/material/dialog";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {MatRadioModule} from "@angular/material/radio";
import {MatToolbarModule} from "@angular/material/toolbar";
import {MatButtonModule} from "@angular/material/button";
import {FormsModule} from "@angular/forms";
import {MatProgressSpinnerModule} from "@angular/material/progress-spinner";
import {MatCheckboxModule} from "@angular/material/checkbox";
import {MatTableModule} from "@angular/material/table";
import {MatSelectModule} from "@angular/material/select";
import {MatIconModule} from "@angular/material/icon";
import {ColorPickerModule} from "ngx-color-picker";
import {MatSliderModule} from "@angular/material/slider";

@NgModule({
  declarations: [
    AppComponent,
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
    FormsModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    MatTableModule,
    MatSelectModule,
    MatIconModule,
    ColorPickerModule,
    MatSliderModule
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
