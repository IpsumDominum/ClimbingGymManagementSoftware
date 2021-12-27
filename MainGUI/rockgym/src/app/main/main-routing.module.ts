import { Routes, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { PosComponent } from './pos/pos.component';
import { CalendarComponent } from './calendar/calendar.component';
import { CheckinComponent } from './checkin/checkin.component';
import { AlertsComponent } from './alerts/alerts.component';
import { WaiversComponent } from './waivers/waivers.component';
import { SendEmailComponent } from './send-email/send-email.component';


const routes: Routes = [
    {
      path: '',
      redirectTo: 'pos',
      pathMatch: 'full'
    },

    {
      path: 'pos',
      component: PosComponent,
    },
    {
      path: 'checkin',
      component: CheckinComponent,
    },
    {
      path: 'calendar',
      component: CalendarComponent,
    },
    {
      path: 'waivers',
      component: WaiversComponent,
    },
    {
      path: 'alerts',
      component: AlertsComponent,
    },
    {
      path: 'emailing',
      component: SendEmailComponent,
    },
  ];
  
  @NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
  })
  export class MainRoutingModule { }