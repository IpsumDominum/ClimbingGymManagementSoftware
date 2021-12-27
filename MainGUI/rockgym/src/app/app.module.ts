import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AuthModule } from './auth/auth.module';
import { MainModule } from './main/main.module';
import { CommonModule } from '@angular/common';
import { AuthComponent } from './auth/auth.component';
import { MainComponent } from './main/main.component';
import { SharedModule } from './shared/shared.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DataComponent } from './data/data.component';
import { AdminModule } from './admin/admin.module';
import { AdminComponent } from './admin/admin.component';


@NgModule({
  declarations: [
    AppComponent,
    AuthComponent,
    MainComponent,
    DataComponent,
    AdminComponent,
  ],
  imports: [
    BrowserModule,
    SharedModule,
    AuthModule,
    MainModule,
    AdminModule,
    CommonModule,
    AppRoutingModule,
    BrowserAnimationsModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
