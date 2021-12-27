import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ModalComponent } from './modals/modal/modal.component';
import { AddCustomerModalComponent } from './modals/add-customer-modal/add-customer-modal.component';
import { AddProductModalComponent } from './modals/add-product-modal/add-product-modal.component';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { ChooseCustomerComponent } from './modals/choose-customer-modal/choose-customer-modal.component';
import { MembershipPosModalComponent } from './modals/membership-pos-modal/membership-pos-modal.component';
import { EditCustomerModalComponent } from './modals/add-customer-modal/edit-customer-modal.component';
import { InvoicePaymentsModalComponent } from './modals/invoice-payments-modal/invoice-payments-modal.component';
import { VisitsHistoryComponent } from './modals/visits-history/visits-history.component';
import { POSHistoryComponent } from './modals/pos-history/pos-history-component';
import { AddSubProductModalComponent } from './modals/add-sub-product-modal/add-sub-product-modal.component';
import { RestockModalComponent } from './modals/restock-modal/restock-modal.component';
import { AddFamilyModalComponent } from './modals/add-family-modal/add-family-modal.component';
import { ViewFamilyMembersModalComponent } from './modals/view-family-members-modal/view-family-members-modal.component';
import { DigitalWaiversModalComponent } from './modals/digital-waivers-modal/digital-waivers-modal.component';
import { ViewSalesHistoryComponent } from './modals/view-sales-history/view-sales-history.component';
import { ViewPurchaseHistoryComponent } from './modals/view-purchase-history/view-purchase-history.component';
import { CustomerViewRentalsModalComponent } from './modals/customer-view-rentals-modal/customer-view-rentals-modal.component';
import { CustomerViewWaiverModalComponent } from './modals/customer-view-waiver-modal/customer-view-waiver-modal.component';
import { CreateCouponModalComponent } from './modals/create-coupon-modal/create-coupon-modal.component';
import { AdvancedSearchModalComponent } from './modals/advanced-search-modal/advanced-search-modal.component';
import { CustomerViewMembershipModalComponent } from './modals/customer-view-membership-modal/customer-view-membership-modal.component';
import { EditCouponModalComponent } from './modals/edit-coupon-modal/edit-coupon-modal.component';
import { RedeemCouponModalComponent } from './modals/redeem-coupon-modal/redeem-coupon-modal.component';
import { ConvertToCustomerModalComponent } from './modals/convert-to-customer-modal/convert-to-customer-modal.component';
import { WaiverTempViewDetailsModalComponent } from './modals/waiver-temp-view-details-modal/waiver-temp-view-details-modal.component';
import { SendEmailModalComponent } from './modals/send-email-modal/send-email-modal.component';
import { AngularEditorModule } from '@kolkov/angular-editor';
import { SetRentalDueDateModalComponent } from './modals/set-rental-due-date-modal/set-rental-due-date-modal.component';





@NgModule({
  declarations: [
    ModalComponent,
    AddCustomerModalComponent,
    AddProductModalComponent,
    ChooseCustomerComponent,
    MembershipPosModalComponent,
    EditCustomerModalComponent,
    InvoicePaymentsModalComponent,
    VisitsHistoryComponent,
    AddSubProductModalComponent,
    POSHistoryComponent,
    RestockModalComponent,
    AddFamilyModalComponent,
    ViewFamilyMembersModalComponent,
    DigitalWaiversModalComponent,
    ViewSalesHistoryComponent,
    ViewPurchaseHistoryComponent,
    CustomerViewRentalsModalComponent,
    CustomerViewWaiverModalComponent,
    CreateCouponModalComponent,
    AdvancedSearchModalComponent,
    CustomerViewMembershipModalComponent,
    EditCouponModalComponent,
    RedeemCouponModalComponent,
    ConvertToCustomerModalComponent,
    WaiverTempViewDetailsModalComponent,
    SendEmailModalComponent,
    SetRentalDueDateModalComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    AngularEditorModule
  ],
  exports:[
    ModalComponent,    
    RestockModalComponent,
    AddCustomerModalComponent,
    AddProductModalComponent,
    ChooseCustomerComponent,
    AddSubProductModalComponent,
    MembershipPosModalComponent,
    EditCustomerModalComponent,
    InvoicePaymentsModalComponent,
    VisitsHistoryComponent,
    POSHistoryComponent,
    CustomerViewMembershipModalComponent,
    CustomerViewWaiverModalComponent,
    CustomerViewRentalsModalComponent,
    CreateCouponModalComponent,
    AdvancedSearchModalComponent,
    ViewPurchaseHistoryComponent,
    ViewSalesHistoryComponent,
    AddFamilyModalComponent,
    ViewFamilyMembersModalComponent,
    DigitalWaiversModalComponent,
    CreateCouponModalComponent,
    EditCouponModalComponent,
    DigitalWaiversModalComponent,
    RedeemCouponModalComponent,
    WaiverTempViewDetailsModalComponent,
    ConvertToCustomerModalComponent,
    SendEmailModalComponent,
    SetRentalDueDateModalComponent
  ]
})
export class SharedModule { }
