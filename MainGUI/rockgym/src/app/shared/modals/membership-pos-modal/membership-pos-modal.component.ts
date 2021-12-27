import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { ModalService } from '../modal/modal.service';
import { MainService } from '../../main.service';

@Component({
  selector: 'membership-pos-modal',
  templateUrl: './membership-pos-modal.component.html',
  styleUrls: ['./membership-pos-modal.component.css']
})
export class MembershipPosModalComponent implements OnInit {
  @Input() type:string;
  @Input() weeklyPrice:number = 1.0;
  @Input() openModalEvent:EventEmitter<any> = new EventEmitter();
  @Output() submitted: EventEmitter<any> = new EventEmitter();
    
    unitPrice:number = 30.0;
    
    /*Attached Member Box Data Fields*/
    attachedMembers:any[] = [];
    attachedChoice:any;
    selectMemberAmountNeed:number = 1;
    selectedMemberAmount:number = 0;
    membership_duration:number = 1;
    /*Search Customer Data Fields*/
    recentItems:any = [];
    resultData:any = [];
    searchPrompt:string = "";
    chosenCustomer:any;
    mode:string ="mainInfo";
    autoRenew:boolean = false;
    displayData:any = new Array(12).fill(undefined);
  
    /*Payment Option Data Fields*/
    paymentOption:number = 1;
    prepaidCashOrCard:number = 0;
    billingFrequency:string = "weekly";
    paymentMethodCardSelect:string = "nocard";
    constructor(
      private modalService: ModalService,
      private mainService:MainService
      ) { }

    ngOnInit() {
      this.openModalEvent.subscribe(async customer=>{
        if(customer){
          this.attachedMembers = [];
          this.selectedMemberAmount = 0;
          await this.mainService.getMember(customer.id).then(result=>{
            if(result["response"]=="success"){
              this.chosenCustomer = result["member"];
            }else{
              alert(result["response"]);
            }
          });
          /*
          if(this.chosenCustomer.membershipActive){
            alert("The chosen member already has membership active!");
            return;
          };          
          */
          await this.mainService.getMember(this.chosenCustomer.id).then(result=>{
            if(result["response"]=="success"){
              this.chosenCustomer = result["member"];
            }else{
              alert(result["response"]);
            }
          });
          let customerAgeGroup = "";

          let age = this.getAgeGroup(this.chosenCustomer);
          if(age<=13){
            customerAgeGroup = "Child";
          }else if(age>13 && age<=17){
            customerAgeGroup = "Young Adult";
          }else if(age>=18){
            customerAgeGroup = "Adult";
          }
          if(customerAgeGroup!=this.type){
            alert("The chosen product can only be issued to age group { "+this.type+" }");
            return;
          }
          if(!this.chosenCustomer.waiver_signed){
            alert("The chosen product requires the waiver to be signed!");
            return;
          }
          if(this.chosenCustomer.currentMembership){
            if(this.chosenCustomer.currentMembership.membership_auto_renew){
              alert("The chosen customer's membership is on autorenew. Cannot be extended");
              return;
            }
          }
        this.attach(); 
        this.openModal('membership-modal-'+this.type);
        }else{
          alert("The chosen product does not allow anonymous sales.");
        }
        
      });
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
    if(this.paymentOption==2){
      if( !this.paymentMethodCardSelect || this.paymentMethodCardSelect=="nocard"){
        alert("Please choose a valid payment method");
        return;
      }
      if(this.billingFrequency==""){
        alert("please choose a billing frequency");
        return;
      }
    }
    let prepaid = this.paymentOption == 1 ? 'prepaid' : 'recurring';
    if(this.membership_duration<1){
      alert("Membership duration is at least 1 month.");
      return;
    }
    if(this.billingFrequency=="weekly"){
      /*pass*/
    }else{
      /*billing fortnightly*/      
      //if(this.membership_duration%2!=0){
      //  alert("Membership duration must be a even number for fornightly billing");
      //  return;
      //}
    }
    if(this.autoRenew==true && this.paymentOption==1){
      alert("Cannot Auto-Renew with lump Sum");
    }

    let data = {
      "paymentOption":this.paymentOption,
      "membership_description":"Weekly Membership-"+this.type,
      "membership_duration":this.membership_duration,
      "membership_duration_unit":"month",
      "billing_frequency":this.billingFrequency,
      "description":"Membership -"+this.type,
      "weekly_price": this.paymentOption==1 ? this.weeklyPrice :10,
      "type":this.type,
      "card_id":this.paymentMethodCardSelect,
      "autoRenew":this.autoRenew
    }    
      this.submitted.emit(data);
      this.closeModal("membership-modal-"+this.type);
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
        this.paymentOption = 1;
        this.prepaidCashOrCard = 0;
        this.billingFrequency = "weekly";
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
          this.attachedChoice = this.chosenCustomer;
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
    dateFromISODetailed(date:string){
      if(date){
        let date_parsed = new Date(date);
        return (date_parsed.getUTCDate()) +"/"+(date_parsed.getMonth()+1) + "/" + date_parsed.getFullYear() +"@" +date_parsed.getHours() + ":"+date_parsed.getMinutes();
      }else{
        return "-";
      }
    }  
    dateFromISO(date:string){
      if(date){
        let date_parsed = new Date(date);
        return (date_parsed.getUTCDate()) +"/"+(date_parsed.getMonth()+1) + "/" + date_parsed.getFullYear();
      }else{
        return "-";
      }
    }
    isBirthday(birthday){
        let date = new Date(birthday);
        let today = new Date();
        let month_diff = today.getMonth() - date.getMonth();
        let day_diff = today.getUTCDate() - date.getUTCDate()-1;        
        if(month_diff==0 && day_diff==0){
          return true;
        }else{
          return false;
        }
    }
    getAgeGroup(customer){
      let today = new Date();
      if(customer.birthday){
        let date = new Date(customer.birthday);
        let year_diff = today.getFullYear() - date.getFullYear();
        let month_diff = today.getMonth() - date.getMonth();
        if(month_diff>0){
        }else if(month_diff==0){
          let day_diff = today.getUTCDate() - date.getUTCDate();        
          if(day_diff >=0){
          }else{
            year_diff -=1;
          }
        }else{
          year_diff -=1;
        }
        return year_diff;
      }else{
        return "-";
      }
    }
    getShortened(family){
      if(family){
        return family.slice(0,6)
      }else{
        return "-";
      }
    }
    toggleAutoRenew(){
      if(this.autoRenew==true){
        this.autoRenew = false;
        this.paymentOption = 1;
      }else{
        this.autoRenew = true;
        this.paymentOption = 2;
      }
    }
    
}
