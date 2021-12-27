import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductsComponent } from './products/products.component';
import { SettingsComponent } from './settings.component';
import { SettingsRoutingModule } from './settings-routing.module';
import { SharedModule } from '../shared/shared.module';
import { MembershipManagementComponent } from './membership/membership.component';
import { DiscountsComponent } from './discounts/discounts.component';
import {ChartModule} from 'angular-highcharts';
import { FormsModule } from '@angular/forms';
import { CustomersComponent } from './customers/customers.component';
import { EmailingComponent } from './emailing/emailing.component';
import { AngularEditorModule } from '@kolkov/angular-editor';
import { AccountingComponent } from './accounting/accounting.component';
import { SalesComponent } from './sales/sales.component';
import { InvoicesComponent } from './invoices/invoices.component';




@NgModule({
  declarations: [
    ProductsComponent,SettingsComponent,
    CustomersComponent,MembershipManagementComponent,
  DiscountsComponent,
  EmailingComponent,
  AccountingComponent,
  SalesComponent,
  InvoicesComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    FormsModule,
    ChartModule,
    SettingsRoutingModule,
    AngularEditorModule,
  ]
})
export class SettingsModule { }
