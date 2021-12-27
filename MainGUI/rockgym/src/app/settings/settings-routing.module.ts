import { Routes, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { ProductsComponent } from './products/products.component';
import { MembershipManagementComponent } from './membership/membership.component';
import { DiscountsComponent } from './discounts/discounts.component';
import { CustomersComponent } from './customers/customers.component';
import { EmailingComponent } from './emailing/emailing.component';
import { AccountingComponent } from './accounting/accounting.component';


const routes: Routes = [
    {
      path: '',
      redirectTo: 'customers',
      pathMatch: 'full'
    },
    {
      path: 'customers',
      component: CustomersComponent,
    },
    {
        path: 'products',
        component: ProductsComponent,
      },

      {
        path: 'email-templates',
        component: EmailingComponent,
      },
      {
        path: 'membership',
        component: MembershipManagementComponent,
      },
      {
        path: 'sales',
        component: AccountingComponent,
      },


  ];
  
  @NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
  })
  export class SettingsRoutingModule { }