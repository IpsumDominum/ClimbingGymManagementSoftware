import { Routes, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { LogsComponent } from './logs/logs.component';



const routes: Routes = [
    {
      path: '',
      redirectTo: 'daily-logs',
      pathMatch: 'full'
    },
    {
      path: 'daily-logs',
      component: LogsComponent,
    },

  ];
  
  @NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
  })
  export class AdminRoutingModule { }