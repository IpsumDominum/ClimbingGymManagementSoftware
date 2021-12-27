import { Routes, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { InvoicesComponent } from './invoices/invoices.component';



const routes: Routes = [
    {
      path: '',
      redirectTo: 'invoices',
      pathMatch: 'full'
    },
    {
      path: 'invoices',
      component: InvoicesComponent,
    },

  ];
  
  @NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
  })
  export class DataRoutingModule { }