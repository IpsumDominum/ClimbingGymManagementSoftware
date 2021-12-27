import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../shared/shared.module';
import { FormsModule } from '@angular/forms';

import { FullCalendarModule } from '@fullcalendar/angular'; // the main connector. must go first
import dayGridPlugin from '@fullcalendar/daygrid'; // a plugin
import interactionPlugin from '@fullcalendar/interaction'; // a plugin
import { LogsComponent } from './logs/logs.component';
import { AdminRoutingModule } from './admin-routing.module';
import { ChartModule } from 'angular-highcharts';
import { BrowserModule } from '@angular/platform-browser';



FullCalendarModule.registerPlugins([ // register FullCalendar plugins
  dayGridPlugin,
  interactionPlugin
]);


@NgModule({
  declarations: [
    LogsComponent,
],
  imports: [
    CommonModule,
    AdminRoutingModule,
    SharedModule,
    FormsModule,
    ChartModule,
    FullCalendarModule,
  ]
})
export class AdminModule { }
