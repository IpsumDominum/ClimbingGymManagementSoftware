import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { ModalService } from '../modal/modal.service';
import { MainService } from '../../main.service';

@Component({
  selector: 'membership-pos-modal',
  templateUrl: './membership-pos-modal.component.html',
  styleUrls: ['./membership-pos-modal.component.css']
})
export class MembershipPosModalComponent implements OnInit {
  @Input() type:number;
  @Output() submitted: EventEmitter<any> = new EventEmitter();
    quantity:number = 1;
    unitPrice:number = 30.0;    

    weeklyPrice:number = 1.0;
    /*Attached Member Box Data Fields*/
    attachedMembers:any[] = [];
    attachedChoice:any;
    selectMemberAmountNeed:number = 1;
    selectedMemberAmount:number = 0;

    /*Search Customer Data Fields*/
    recentItems:any = [];
    resultData:any = [];
    searchPrompt:string = "";
    chosenCustomer:any;
    mode:string ="mainInfo";
    displayData:any = new Array(12).fill(undefined);
  
    /*Payment Option Data Fields*/
    paymentOption:number = 0;
    prepaidCashOrCard:number = 0;
    billingFrequency:string = "weekly";
    paymentMethodCardSelect:string = "nocard";

    constructor(
      private modalService: ModalService,
      private mainService:MainService
      ) { }

    ngOnInit() {
      this.load();
    }
    load(){
      this.recentItems = JSON.parse(localStorage.getItem("recentItems"));
      if(this.recentItems==undefined){
        this.recentItems = [];
      }
    }
    search(){
      this.mainService.searchMember(
        {"searchPrompt":this.searchPrompt,
        "searchType":"simple",
         }).then((result=>{
           this.displayData = new Array(12).fill(undefined);
          this.resultData = result;
          for(var i=0;i<this.resultData.length;i++){
            if(i<this.displayData.length){
              this.displayData[i] = this.resultData[i];
            }else{
              this.displayData.push(this.resultData[i]);
            }
          }
      }));
    }
    handleKeyboardEvent(event:KeyboardEvent){
      if(event.key=="Enter"){
        this.search();
      }
    }  
    chooseCustomer(customer){
      if(customer!=undefined){
        this.chosenCustomer = customer;
      }
    }
    /*
    Remove a member from attachedMembers list
    The member is selected as 'attachedChoice'
    */
    removeAttached(){
      if(this.attachedMembers.includes(this.attachedChoice)){
        this.attachedMembers = this.attachedMembers.filter(attached=>attached!=this.attachedChoice);
        this.attachedChoice = undefined;
        this.selectedMemberAmount -=1;
      }
    }

    /*
    Create Membership
    */
    createMemberShip(){
      
    }

  /*
  Choose Attached Choice
  */
 chooseAttachedChoice(member){
   this.attachedChoice = member;
   if(member.paymentMethods.length>0){
     this.paymentMethodCardSelect = member.paymentMethods[0].payment_method_stripe_id;
   }
 }
  /*
  Confirm Payment Option
  */
  confirmPaymentOption(){
      if(this.paymentOption==1){
        /*Prepaid In Full */        
        if(this.prepaidCashOrCard==0){
          /*Prepaid with cash or eftpos, no need for calling Stripe*/
          this.attachedMembers.forEach(member => {
            this.mainService.createMembership({
              "paymentOption":"prepaidCash",
              "paidFull":true,
              "customer":member,
              "membership_description":this.type + " Month Membership",
              "membership_duration": this.type * 4 , 
              "membership_duration_unit": "week", 
              "billing_frequency":"weekly"
            }).then(result=>{
              this.handleConfirmationError(result);
            });
          }
          );
        /*}else if(this.prepaidCashOrCard==1){
          /*Prepay using card via stripe
          this.mainService.createMembership({
            "paymentOption":"prepaidCard",
            "paidFull":false,
            "members":this.attachedMembers,
            "membership_duration": 1, 
            "membership_duration_unit": "month", 
          }).then(result=>{
            this.handleConfirmationError(result);
          });*/
        }else{
          alert("Unknown Error: Please report to developer.");
        }

      }else if(this.paymentOption==2){
        /*Card Recurring*/
        if(this.paymentMethodCardSelect=="nocard"){
          alert("No payment method available");
          return;
        }
        if( !this.paymentMethodCardSelect){
          alert("Please choose a payment method");
          return;
        }
        this.attachedMembers.forEach(member => {
        /*Prepay using card via stripe*/
        member.card_id = this.paymentMethodCardSelect
        this.mainService.createMembership({
          "paymentOption":"recurring",
          "paidFull":false,
          "customer":member,
          "membership_duration": this.type *4, 
          "membership_description":this.type + " Month Membership",
          "membership_duration_unit": "week", 
          "billing_frequency":this.billingFrequency,
        }).then(result=>{
          this.handleConfirmationError(result);
        });  
        });
      }else if(this.paymentOption==3){
        /*Bank Transfer Full*/
      }
    }
    /*
    Handle Confirmation Error
    ****TODO****
    */
   handleConfirmationError(result){
    if(result=="success"){
      this.closeModal("membership-modal-"+this.type.toString());
    }else{
      alert(result);
    }
   }
    /*
    Open and Close Modal Methods
    */
    openModal(id: string) {      
        this.paymentOption = 0;
        this.prepaidCashOrCard = 0;
        this.billingFrequency = "week";
        this.paymentMethodCardSelect= "nocard";
        this.modalService.open(id);
    }

    closeModal(id: string) {
        this.modalService.close(id);
    }
    attach(){
      if(this.chosenCustomer!=undefined && 
        this.selectedMemberAmount<this.selectMemberAmountNeed){
        if(!this.attachedMembers.includes(this.chosenCustomer)){
          this.attachedMembers.push(this.chosenCustomer);
          this.mode="mainInfo";          
            this.selectedMemberAmount +=1;
            this.recentItems = JSON.parse(localStorage.getItem("recentItems"));
            if(this.recentItems==undefined){
              this.recentItems = [];
            }
            if(this.chosenCustomer!=undefined){
              this.recentItems = this.recentItems.filter(customer=>customer.id!=this.chosenCustomer.id);
              this.recentItems.push(this.chosenCustomer);
            }
            localStorage.setItem("recentItems",JSON.stringify(this.recentItems));
        }else{
          alert("member already attached!");
        }
      }

    }
}