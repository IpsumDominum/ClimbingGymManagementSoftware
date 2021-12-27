import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MainRoutingModule } from './main-routing.module';
import { PosComponent } from './pos/pos.component';
import { CheckinComponent } from './checkin/checkin.component';
import { CalendarComponent } from './calendar/calendar.component';
import { SharedModule } from '../shared/shared.module';
import { FormsModule } from '@angular/forms';
import { AddCustomerModalComponent } from '../shared/modals/add-customer-modal/add-customer-modal.component';
import { AlertsComponent } from './alerts/alerts.component';

import { FullCalendarModule } from '@fullcalendar/angular'; // the main connector. must go first
import dayGridPlugin from '@fullcalendar/daygrid'; // a plugin
import interactionPlugin from '@fullcalendar/interaction'; // a plugin
import { WaiversComponent } from './waivers/waivers.component';
import { SendEmailComponent } from './send-email/send-email.component';
import { AngularEditorModule } from '@kolkov/angular-editor';


FullCalendarModule.registerPlugins([ // register FullCalendar plugins
  dayGridPlugin,
  interactionPlugin
]);


@NgModule({
  declarations: [
  AlertsComponent,PosComponent, CheckinComponent, CalendarComponent,
WaiversComponent,
SendEmailComponent],
  imports: [
    CommonModule,
    MainRoutingModule,
    SharedModule,
    FormsModule,
    FullCalendarModule,
    AngularEditorModule
  ]
})
export class MainModule { }
