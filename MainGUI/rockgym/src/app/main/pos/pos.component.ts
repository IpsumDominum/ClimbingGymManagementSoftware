import { Component, OnInit, EventEmitter, ViewChild } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { MainService } from 'src/app/shared/main.service';
import { MembershipPosModalComponent } from 'src/app/shared/modals/membership-pos-modal/membership-pos-modal.component';

@Component({
  selector: 'app-pos',
  templateUrl: './pos.component.html',
  styleUrls: ['./pos.component.css'],
  host: {
    '(document:keydown)': 'handleKeyboardDown($event)',
    '(document:keyup)': 'handleKeyboardUp($event)',
  }
})
export class PosComponent implements OnInit {

  @ViewChild('searchProduct') searchBar; 

  today = new Date();
  productData:any;
  searchPrompt:string = "";
  /*Open Modal Emitters */
  openSetRentalDate: EventEmitter<any> = new EventEmitter();
  openChooseCustomer: EventEmitter<any> = new EventEmitter();
  openMembershipPOSChild: EventEmitter<any> = new EventEmitter();
  openMembershipPOSYouth: EventEmitter<any> = new EventEmitter();
  openMembershipPOSAdult: EventEmitter<any> = new EventEmitter();


  /*Open Customer Tab Modal Emitters */
  openVisitHistoryModal: EventEmitter<any> = new EventEmitter();
  openAddCustomerModal: EventEmitter<any> = new EventEmitter();
  openEditModal: EventEmitter<any> = new EventEmitter();
  openInvoicesModal: EventEmitter<any> = new EventEmitter();
  openRentalsModal: EventEmitter<any> = new EventEmitter();
  openWaiversModal: EventEmitter<any> = new EventEmitter();
  openMembershipModal: EventEmitter<any> = new EventEmitter();
  openPurchasesModal: EventEmitter<any> = new EventEmitter();
  openViewFamilyMembersModal : EventEmitter<any> = new EventEmitter();
  openEnlargePhoto: EventEmitter<any> = new EventEmitter();


  openTender: EventEmitter<any> = new EventEmitter();
  openEftpos: EventEmitter<any> = new EventEmitter();

  displayData:any = new Array(8).fill(undefined);
  loading:boolean = true;
  mode:string = "casual";
  currentCustomer:any ;
  saleTray:any[] = new Array(12).fill(undefined);
  filteredData:any;
  itemIDLookup:any = {
    "casual_pass_adult":"010edd04-429e-11eb-a6c6-34e12d703bc2",
    "casual_pass_child":"010edd05-429e-11eb-a6c6-34e12d703bc2",
    "concession_10_adult":"010edd06-429e-11eb-a6c6-34e12d703bc2",
    "concession_10_child":"010edd07-429e-11eb-a6c6-34e12d703bc2"
  }
  tempId:number = 0;
  saleSelection:any = {"id":""};
  altPressed = false;
  productFilterBy:string = "all";

  discountApplied:number = 0;
  discountAmountApplied:number = 0;
  casual_pass_child_price: any;
  casual_pass_young_adult_price: any;
  casual_pass_adult_price: any;
  concession_pass_child_price: any;
  concession_pass_young_adult_price: any;
  concession_pass_adult_price: any;
  membership_child_price: any;
  membership_young_adult_price: any;
  membership_adult_price: any;
  casual_pass_group_price: any;
  isSingleClick: Boolean = true;     

  firstLoaded:boolean = false;
  constructor(
    private mainService:MainService,
    private route:ActivatedRoute,
    private router:Router
  ) { 
    router.events.pipe(
			filter(event => event instanceof NavigationEnd),
		).subscribe(async event=>
           {
            let climber_inject = this.route.snapshot.queryParamMap.get('climber');
            if(climber_inject){
              await this.mainService.getMember(climber_inject).then((result)=>{
                if(result["response"]=="success"){
                    this.reloadCustomer(result["member"].id);
                }else{
                  if(result["response"]=="Member Not Found"){
                    /*pass*/
                  }else{
                    alert(result["response"]);
                  }
                };
              });
            }
           }
		);
  }

  ngOnInit(): void {
    this.load();
  }

  handleKeyboardDown(event:KeyboardEvent){
    if(event.key=="Alt"){
      this.altPressed = true;
    }
  } 
  handleKeyboardUp(event:KeyboardEvent){
    if(event.key=="Alt"){
      this.altPressed = false;
    }
    if(event.key=="s" && this.altPressed){
      this.searchBar.nativeElement.focus();
    }
    if(event.key=="Enter" && this.altPressed){
      this.searchProducts();
    }
    if(event.key=="z" && this.altPressed){
      this.tender();
    }
    if(event.key=="a" && this.altPressed){
      this.openAddCustomerModal.emit(true);
    }
    if(event.key=="1" && this.altPressed){
      this.mode = "casual";
    }
    if(event.key=="2" && this.altPressed){
      this.mode = "concession";
    }
    if(event.key=="3" && this.altPressed){
      this.mode = "memberships";
    }
    if(event.key=="r" && this.altPressed){
      this.clear();
    }
    if(event.key=="c" && this.altPressed){
      this.openChooseCustomer.emit(0);
    }
    if(event.key=="Delete"){
      this.delete_sale();
    }
  } 
  getDefaultProductPrice(type){
    let product = this.productData.find(product=>product.name_unchangeable==type);
    return product.price;
   }
  async load(){
    this.loading = true;

    this.saleTray = new Array(12).fill(undefined);
    this.discountApplied = 0;
    this.discountAmountApplied = 0;
    this.currentCustomer = undefined;


    await this.getProductData();
    this.casual_pass_child_price = this.getDefaultProductPrice("casual_pass_child");
    this.casual_pass_young_adult_price = this.getDefaultProductPrice("casual_pass_young_adult");
    this.casual_pass_adult_price = this.getDefaultProductPrice("casual_pass_adult");
    this.casual_pass_group_price = this.getDefaultProductPrice("casual_pass_group");
    this.concession_pass_child_price = this.getDefaultProductPrice("concession_pass_child");
    this.concession_pass_young_adult_price = this.getDefaultProductPrice("concession_pass_young_adult");
    this.concession_pass_adult_price = this.getDefaultProductPrice("concession_pass_adult");
    this.membership_child_price = this.getDefaultProductPrice("membership_child");
    this.membership_young_adult_price = this.getDefaultProductPrice("membership_young_adult");
    this.membership_adult_price = this.getDefaultProductPrice("membership_adult");
    this.filterProducts("all");
    this.loading = false;
  }
  handleKeyboardEvent(event:KeyboardEvent){
    if(event.key=="Enter"){
      this.searchProducts();
    }
  }  
  filterProducts(filter_type){
    this.displayData = new Array(8).fill(undefined);
    this.productFilterBy = filter_type;    
    
    if(this.productFilterBy=="all"){
      this.filteredData = this.productData.filter(product=>product.is_default==false && product.is_active);
    }
    else if(this.productFilterBy=="rentals"){
      this.filteredData = this.productData.filter(product=>product.productType=="Rental" && product.is_default==false && product.is_active);
    }
    else if(this.productFilterBy=="retail"){
      this.filteredData = this.productData.filter(product=>product.productType=="Retail" && product.is_default==false && product.is_active);
    }
    let jdx = 0;
    
    for(var i=0;i<this.filteredData.length;i++){
      this.filteredData[i].sub_products.forEach(sub_product => {
        sub_product["productType"] = this.filteredData[i]["productType"];
        sub_product["vendor"] = this.filteredData[i]["vendor"];
        sub_product["name"] = this.filteredData[i]["name"];
        sub_product["allow_anonymous_sale"] = this.filteredData[i]["allow_anonymous_sale"];
        if(jdx<this.displayData.length){
          this.displayData[jdx] = sub_product;
        }else{
          this.displayData.push(sub_product);
        }  
        jdx +=1;
      });
    }    
    this.displayData =  this.quick_sort(this.displayData.filter(data=>data.name=="Session Shoes"),this.comp).concat(
      this.displayData.filter(data=>data.name!="Session Shoes")
    );
  }
  
  comp(p1,p2){     
    if(p1 && p2){
      return (parseFloat(p2.size.split("/")[0]) <= parseFloat(p1.size.split("/")[0]));
    }else{
      return false;
    }
  }
quick_sort(array,comp_function){
  if(array.length<3){
    if(comp_function(array[0],array[1])){
      return [array[1],array[0]];
    }else{
      return array;      
    }
  };
  let pivot = Math.floor(array.length/2);
  //move everything left of pivot to quick sort left, and everything right to quick sort right
  let left = [];
  let right = [];

  array.forEach((element,idx) => {
    if(idx!=pivot){
      if(comp_function(element,array[pivot])){
        right.push(element);
      }else{
        left.push(element);
      }
    }
  });
  return this.quick_sort(left,comp_function).concat([array[pivot]],this.quick_sort(right,comp_function));
}
  searchProducts(){    
    this.filterProducts(this.productFilterBy);
    let tempData = this.displayData;
    this.displayData = new Array(8).fill(undefined);
    tempData = tempData.filter((sub_product)=>{
      return (sub_product ? (sub_product.name.toLowerCase().includes(this.searchPrompt.toLowerCase()) || 
      sub_product.vendor.toLowerCase().includes(this.searchPrompt.toLowerCase()) ||
      sub_product.size.toLowerCase().includes(this.searchPrompt.toLowerCase())):false)
    });
    tempData.forEach((sub_product,jdx) => {
      if(jdx<this.displayData.length){
        this.displayData[jdx] = sub_product;
      }else{
        this.displayData.push(sub_product);
      }   
    });      
    this.displayData =  this.quick_sort(this.displayData.filter(data=>data.name=="Session Shoes"),this.comp).concat(
      this.displayData.filter(data=>data.name!="Session Shoes")
    );
  }
  /*
  Select Sale
  */
 selectSale(sale){
   if(sale){
    this.saleSelection = sale;
   }else{
     this.saleSelection = {"id":""};
   }
 }
  
  /*
  Check if sale is selected
  */
 saleSelected(sale){
  if(sale){
    if(this.saleSelection){
     return this.saleSelection.tempId == sale.tempId ? "gray" : "";
    }else{
     return "";
    }    
  }else{
   return "";
  }
}

increaseQuantity(){
  if(!this.saleSelection){
    alert("Please select a sale entry first");
  }else{
    let found_sale = this.saleTray.find(sale=>sale.tempId==this.saleSelection.tempId);
    if(found_sale.saleType=="membership"){
      return;
    }
    if(found_sale.quantity-1<999){
      found_sale.quantity +=1;
    }
  }
}
decreaseQuantity(){
  if(!this.saleSelection){
    alert("Please select a sale entry first");
  }else{
    let found_sale = this.saleTray.find(sale=>sale.tempId==this.saleSelection.tempId);
    if(found_sale.saleType=="membership"){
      return;
    }
    if(found_sale.quantity-1>0){
      found_sale.quantity -=1;
    }
  }
}
  /*
  Delete Sale Entry
  */
  delete_sale(){
    if(this.saleSelection.id==""){
      /*alert("Please select a sale entry first");*/
    }else{
      this.saleTray = this.saleTray.filter(sale=>sale==undefined || sale.tempId!=this.saleSelection.tempId);
      if(this.saleTray.length<20){
        this.saleTray.push(undefined);
      }
    }
  }
  /*
  Get Product Data:
  Get Product Data, calculate data for pagination,
  and set display as first page or otherwise.
  */
  async getProductData(){
    await this.mainService.getAllProducts().then(result=>{
      this.productData = result;
    });    
  }
get_now(){
  return this.parseDate(new Date());
}
  parseDate(isoDate){
    let parsed = new Date(isoDate);
    return parsed.getHours().toString() + ":" +
          parsed.getMinutes().toString() + ":" +
          parsed.getSeconds().toString() + " ";;
  }
  /*Helper Functions*/
  /*
  Build Name
  */
  buildName(member){
    return (member.firstName + " " + member.lastName).slice(0,20);
  }
 
singleClickIssueProduct(product){
  this.isSingleClick = true;
       setTimeout(()=>{
           if(this.isSingleClick){
                this.attemptIssueProduct(product,false);
           }
        },250);
}
doubleClickIssueProduct(product){
        this.isSingleClick = false;
        this.attemptIssueProduct(product,true);
}
  /*
  Attempt to issue product, relay to modal if rental
  */
 attemptIssueProduct(product,double_click=false){
   if(!product){
     return;
   }
   if(product.productType=="Retail"){
    this.issueProduct(product,1,false,"","");
   }else if(product.productType=="Rental"){

    let found_similar =false;
    this.saleTray.forEach(sale => {
      if(!sale){
        return;
      }
      if(sale.product_id==product['id'] && sale.memberName==(this.currentCustomer? this.currentCustomer.firstName + " " + this.currentCustomer.lastName : "Anonymous")){
        /*Sometimes he encapsulates...
        Sometimes he doesn't...
        What is he trying to do...
        This developer sucks */
          this.saleSelection = sale;
          found_similar = true;
          return;
        /*And he should be made to stand up side down for a minute*/
      }
    });
    if(found_similar){
      this.issueProduct(product,1,false,"","");
    }else{
      if(double_click==false){
        this.openSetRentalDate.emit(product);
      }else{
        this.handleSetRentalDate({"mode":"specifyTime","minutes":0,"days":1,"hours":0,"product":product});
      }
    }
   }
 }
 handleSetRentalDate(data){
   if(data["mode"]=="specifyTime"){
    let rental_due_date = {
      "minutes":data["minutes"],
      "hours":data["hours"],
      "days":data["days"]
    }
    this.issueProduct(data["product"],1,false,rental_due_date,data["mode"]);
   }else if(data["mode"]=="selectEndDate"){
    let rental_due_date = data["endDate"];
    this.issueProduct(data["product"],1,false,rental_due_date,data["mode"]);
   }else{
     alert("Error::An unknown error has occured!");
     return;
   }
   
 }

 issueMembershipProduct(data){
   let product = {"id":""};
   if(data["type"]=="Child"){
    product = this.productData.find(product=>product.name_unchangeable=="membership_child");
   }else if(data["type"]=="Young Adult"){
    product = this.productData.find(product=>product.name_unchangeable=="membership_young_adult"); 
   }else if(data["type"]=="Adult"){
    product = this.productData.find(product=>product.name_unchangeable=="membership_adult");
   }
  let sale = {
    "tempId":this.tempId,
    "created":this.get_now(),
    "saleType":"membership",
    "productType":"membership",
    "productName":data["description"],
    "product_id":product.id,
    "anonymousSale":false,
    "member": this.currentCustomer,
    "member_id": this.currentCustomer ? this.currentCustomer.id : "",
    "memberName": this.currentCustomer? this.currentCustomer.firstName + " " + this.currentCustomer.lastName : "Anonymous",
    "quantity":data["membership_duration"],
    "notes":"",
    "rental_due_date":"",
    "rental_due_date_mode":"",
    "price":data["paymentOption"]==2 ? data["weekly_price"]: data["membership_duration"] *data["weekly_price"] *4,
    "payment_method":data["paymentOption"]==2 ? 'Cash/EFTPOS' : 'Stripe',
    "product":{"vendor":"Resistance Gym",
    "color": data["paymentOption"] ==2 ? "Recurring" : "Prepaid"
    },
    "discount_percentage":0,
    "discount_amount":0,
    "status":"pending",
    "paymentOption":data["paymentOption"],
    "type":data["type"],
    "billing_frequency":data["billing_frequency"],
    "card_id":data["card_id"],
    "autoRenew":data["autoRenew"]
  };

  let membership_sale_found_in_tray_already = false;
  for(var i=0;i<this.saleTray.length;i++){
    if(this.saleTray[i]){
      if(this.saleTray[i].saleType=="membership" && this.saleTray[i].memberName==(this.currentCustomer? this.currentCustomer.firstName + " " + this.currentCustomer.lastName : "Anonymous")){
        this.saleTray[i] = sale;
        membership_sale_found_in_tray_already = true;
      }
    }
   }
  if(membership_sale_found_in_tray_already ==false){
    var found_empty_slot = false;
    for(var i=0;i<this.saleTray.length;i++){
     if(this.saleTray[i]==undefined){
       this.saleTray[i] = sale;
       found_empty_slot = true;
       break;
     }
    }
    if(!found_empty_slot){
      this.saleTray.push(sale);
    }
    this.tempId +=1;
  }
 }
 
  /*
  Issue Day Pass Adult
  */
 issueProduct(type,quantity,is_default,rental_due_date,rental_due_date_mode){
   /*
   Types are: 
    "casual_pass_child"
    "casual_pass_young_adult"
    "causal_pass_adult"
    "concession_pass_child"
    "concession_pass_young_adult"
    "concession_pass_adult"
    "$productName"
  */
 
 let product = {};
  if(!type){
    return;
  }

if(is_default){
  product = this.productData.find(product=>product.name_unchangeable==type);
  if(type.includes("child")){
    if(this.getAgeGroup(this.currentCustomer)!="Child"){
      alert("This product can only be issued to members belonging to the age group {Child}!");
      return;
    }
  }else if(type.includes("young_adult")){
      /*
      alert("This product can only be issued to members belonging to the age group {Young Adult}!");
      return;
      */
  }else if(type.includes("pass_adult")){
    if(this.getAgeGroup(this.currentCustomer)!="Adult"){
      alert("This product can only be issued to members belonging to the age group {Adult}!");
      return;
    }
  }
 }else{
   /*Extremely terrible naming... displayData isn't actually displayData*/
   /*Who ever developed this should be punished with 5000000000000000000000000000 push ups*/
   product = this.displayData.find(product=>product.id==type.id);
 }

 if(product["waiver_required"]){
  if(!this.currentCustomer.waiver_signed){
    alert("To issue this product, it is required that the waiver must be signed!");
    return;
  }
 }

 if(!product["allow_anonymous_sale"] && !this.currentCustomer){
  alert("The chosen product does not allow anonymous sales.");
  return;
}
 /*
 Try to find similar item in sale tray,
 if found,add to quantity.
 */
 let found_similar =false;
 this.saleTray.forEach(sale => {
   if(!sale){
     return;
   }
   if(sale.product_id==product['id'] && sale.memberName==(this.currentCustomer? this.currentCustomer.firstName + " " + this.currentCustomer.lastName : "Anonymous")){
     /*What is he trying to do...
     This developer sucks
     *2 on this previous note ^
     */
       this.saleSelection = sale;
       found_similar = true;
       if(product['productType']!="Rental"){
        if(sale['quantity']+quantity > product['stock']){
          alert("Out of stock!");
          return;
         }
       }else{
        if(sale['quantity']+quantity +product['rented']> product['stock']){
          alert("All rented out!");
           return;
         }
       }       
       sale['quantity'] += quantity;       
       return;
    /*And he should be made to stand up side down for a minute*/
   }
 });
 if(found_similar){
   return;
 }else{
  if(product['productType']!="Rental"){
    if(quantity > product['stock']){
      alert("Out of stock!");
       return;
     }
   }else{
    if(quantity +product['rented']> product['stock']){
      alert("All rented out!");
       return;
     }
   }
 }

 /*
 Check for stock left...
 */
 if(product["productType"]=="Rental" && !this.currentCustomer){
  alert("Rental Products do not allow anonymous sales.Please choose a customer first.")
  return; 
 }
 if(!product["allow_anonymous_sale"] && !this.currentCustomer){
    alert("The chosen product does not allow anonymous sales.")
    return; 
 }

  let sale = {
    "tempId":this.tempId,
    "created":this.get_now(),
    "saleType":"dayuse",
    "productType":product["productType"],
    "productName":product['name'],
    "product_id":product["id"],
    "anonymousSale":this.currentCustomer ? false : true,
    "member_id": this.currentCustomer ? this.currentCustomer.id : "",
    "memberName": this.currentCustomer? this.currentCustomer.firstName + " " + this.currentCustomer.lastName : "Anonymous",
    "quantity": rental_due_date_mode ? rental_due_date_mode=='specifyTime' ? rental_due_date.days : quantity : quantity,
    "notes":"",
    "rental_due_date":rental_due_date,
    "rental_due_date_mode":rental_due_date_mode,
    "price": product["price"],// *(1-this.discountApplied/100),
    "discount_percentage":0,
    "discount_amount":0,
    "payment_method":"Cash/EFTPOS",
    "product":product,
    "status":"pending"
  };
  
  var found = false;
 for(var i=0;i<this.saleTray.length;i++){
  if(this.saleTray[i]==undefined){
    this.saleTray[i] = sale;
    found = true;
    break;
  }
 }

if(!found){
  this.saleTray.push(sale);
}
  this.tempId +=1;
}
/*Tender what ever item is in the tray*/
async tender(){
  let filtered_tray = this.saleTray.filter(sale=>sale!=undefined);
  if(filtered_tray.length >0){
      this.openTender.emit({
        "saleTray":filtered_tray,
        }
      );
  }else{
    alert("there is nothing to tender! add an item first.")
  }
}
openEftposMenu(){
  this.openEftpos.emit(true);
}
handleApplyDiscounts(discount){
  console.log(discount);
  if(this.saleSelection.id==""){
    this.saleTray.forEach(sale => {
      if(sale){
        sale.discount_percentage = discount;
      }
    });
  }else{
    this.saleSelection.discount_percentage = discount;
  }
}
handleApplyDiscountsAmount(discount){  
  if(this.saleSelection.id==""){
  let temp = discount;  
  this.saleTray.forEach(sale => {
    if(sale){
      let salePrice = this.roundUp((sale.price * sale.quantity)*(1-sale.discount_percentage/100));
      if(temp >= salePrice){
        sale.discount_amount = salePrice;
        temp -= salePrice;
      }else{
        sale.discount_amount = temp;
        temp = 0 ;
      }        
    }
  });
  if(temp>0){
    this.saleTray[0].discount_amount += temp;
  }
}else{
  this.saleSelection.discount_amount = discount;
}

}

clear(){
  this.saleTray = new Array(20).fill(undefined);
}
  /*
  Set current Customer after event emitted from modal
  */
setCurrentCustomer(customer){
   this.currentCustomer = customer;
   this.discountApplied = 0;
   //this.clear();
}
handleTenderModalClose(event){
  if(event==true){
    this.load();
  }
}
/*
Get the rental due date
*/
getRentalDueDate(sale){
  if(sale.rental_due_date_mode=="specifyTime"){
    return `${sale.quantity} Days`;
  }else if(sale.rental_due_date_mode=="selectEndDate"){
    return sale.rental_due_date;
  }
}
/*
Get total amount of sale in the saleTray
*/
getTotalRaw(){
  let total = 0;
  this.saleTray.forEach(sale => {
    if(sale){
      if(sale.productType=="membership"){
        total += sale.price
      }else{
        total += sale.price * sale.quantity;
      }
    }
  });
  return this.roundUp(total);
}
getTotal(){
  let total = 0;
  this.saleTray.forEach(sale => {
    if(sale){
      if(sale.productType=="membership"){
        total += this.roundUp((sale.price)*(1-sale.discount_percentage/100)- sale.discount_amount);
      }else{
        total += this.roundUp((sale.price * sale.quantity)*(1-sale.discount_percentage/100)- sale.discount_amount);
      }
    }
  });
  return this.roundUp(total);
}
getProductStock(product){
  if(product.productType=="Retail"){
    return product.stock;
  }else{
    return product.rented.toString() + " / " + product.stock;
  }
  
}
roundUp(num){
  return Math.round((num+Number.EPSILON)*100)/100;
}
getAgeGroup(customer){
  if(!customer){
    return;
  }
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
    if(year_diff<=13){
      return "Child"
    }else if(year_diff>13 && year_diff <18){
      return "Young Adult"
    }else{
      return "Adult"
    }
  }else{
    return "-";
  }
}
age_restriction_stringify(age_restriction){
  if(age_restriction==0){
    return "No Restriction";
  }else if(age_restriction==1){
    return "Adult & Young Adult Only"
  }else if(age_restriction==2){
    return "Adult Only"
  }
}
handleEditQuantity($event){
  this.saleTray.forEach(sale=>{
    if(sale){
      if(sale.tempId==$event.sale.tempId){
        sale.quantity = $event.quantity;
      }
    }
  })
}
  async reloadCustomer(customer_id){
    if(!customer_id){
      return;
    }
    this.loading = true;
    await this.mainService.getMember(customer_id).then(result=>{
      if(result["response"]=="success"){
        this.currentCustomer = result["member"];
      }else{
        alert(result["response"]);
      }
    });
    this.loading = false;
  }
  getMembershipType(customer){
    if(customer){
      if(customer.currentMembership){
        if(customer.currentMembership.membership_auto_renew){
          return "AutoRenew";
        }else{
          return "LumpSum";
        }
      }
    }
  }
}

