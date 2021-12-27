import { Component, OnInit, EventEmitter } from '@angular/core';
import { MainService } from 'src/app/shared/main.service';

@Component({
  selector: 'app-customers',
  templateUrl: './customers.component.html',
  styleUrls: ['./customers.component.css']
})
export class CustomersComponent implements OnInit {
  loading:boolean = false;
  userData:any;
  filteredData:any[] = [];

  pageNum:number = 0;
  pageSize:number = 12;  

  searchPrompt:string = "";
  displayData:any = new Array(this.pageSize).fill(undefined);
  resultData:any = [];
  detailUser:any;
  showInActive:boolean = false;

  lookUpKey:string = "Common";
  /*Open Modal Emitters */
  openVisitHistoryModal: EventEmitter<any> = new EventEmitter();
  openEditModal: EventEmitter<any> = new EventEmitter();
  openInvoicesModal: EventEmitter<any> = new EventEmitter();
  openRentalsModal: EventEmitter<any> = new EventEmitter();
  openWaiversModal: EventEmitter<any> = new EventEmitter();
  openMembershipModal: EventEmitter<any> = new EventEmitter();
  openPurchasesModal: EventEmitter<any> = new EventEmitter();
  openViewFamilyMembersModal : EventEmitter<any> = new EventEmitter();
  


  totalPage:number = 0;
  currentPage:number = 1;
  totalAmount:number = 0;
  constructor(
    private mainService:MainService    
  ) { 

  }

 
  ngOnInit(): void {
    this.load();
  }
  handleShowInactive(){
    this.showInActive = !this.showInActive;
    this.load();
  }
  expandUser(user){
   this.detailUser = user;
  }
  handleKeyboardEvent(event:KeyboardEvent){
    if(event.key=="Enter"){
      this.search(
        {"searchPrompt":this.searchPrompt,
      "lookUpKey":this.lookUpKey,
      "pageSize":12,
      "currentPage":1,
      "searchType":"normal",
      "showInActive":this.showInActive,      
       }
      );
    }
  }
  dateFromISODetailed(date:string){
    if(date){
      let date_parsed = new Date(date);
      return (date_parsed.getFullYear()) +"-"+(date_parsed.getMonth()+1) + "-" + date_parsed.getUTCDate() +"@" +date_parsed.getHours() + ":"+date_parsed.getMinutes();
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
      if(year_diff<13){
        return "Child"
      }else if(year_diff>=13 && year_diff <18){
        return "Young Adult"
      }else{
        return "Adult"
      }
    }else{
      return "-";
    }
  }
  async load(){
    this.loading = true;
    await this.search(
      {"searchPrompt":this.searchPrompt,
      "lookUpKey":this.lookUpKey,
      "pageSize":12,
      "currentPage":1,
      "searchType":"normal",
      "showInActive":this.showInActive,
       }
    );
    this.detailUser = this.resultData[0];
    this.loading = false;
  }
  async getUserData(){
    
  }


  async toggleCustomer(){
    let confirmed = false;
    if(this.detailUser.status=="inactive"){
      confirmed = confirm("Are you sure to activate again user "+ this.detailUser.firstName + " "+this.detailUser.lastName + "?");
    }else{
      confirmed = confirm("Are you sure to de-activate user "+ this.detailUser.firstName + " "+this.detailUser.lastName + "?");
    }
    if(confirmed){
      /*
      Says delete, actually is toggling active/in-active status
      */
      await this.mainService.deleteMember(this.detailUser.id).then((result)=>{
        if(result=="success"){
          this.detailUser = undefined;
          this.load();
        }
      })
    }else{

    }
  }
  async activateCustomer(){
    let confirmed = confirm("Are you sure to activate user "+ this.detailUser.firstName + " "+this.detailUser.lastName + "?")
    if(confirmed){
      await this.mainService.deleteMember(this.detailUser.id).then((result)=>{
        if(result=="success"){
          this.detailUser = undefined;
          this.load();
        }
      })
    }else{

    }
  }
  isNumeric(str) {
    if (typeof str != "string") return false // we only process strings!  
    // @ts-ignore
    return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
    // @ts-ignore
           !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
  }
  onSearchChange($event): void {  
    if($event.target.value==""){
      return;
    }
    
    if(! this.isNumeric($event.target.value)){
      $event.target.value = "";
    }else{
      let parsed = parseInt($event.target.value);
      if(parsed>this.totalPage){
        parsed = this.totalPage;
        $event.target.value = this.totalPage;
      }
      this.currentPage = parsed;
    }
    this.search(
      {"searchPrompt":this.searchPrompt,
      "lookUpKey":this.lookUpKey,
      "pageSize":12,
      "currentPage":this.currentPage,
      "searchType":"normal",
      "showInActive":this.showInActive,
       }
    );
  }
  async search(searchQuery){
  this.loading = true;    
    await this.mainService.searchMember(
      searchQuery
      ).then((result=>{
        this.displayData = new Array(12).fill(undefined);
        if(result["response"]=="success"){            
          this.resultData = result["data"];
          this.totalPage = result["total_pages"];
          this.currentPage = result["current_page"];
          this.totalAmount = result["total_amount"];          
          this.resultData.forEach(async user => {
            if(user){
              let pendingNum = 0;
              await this.mainService.getInvoicesByUser(user.id).then((result)=>{
                if(result["response"]=="success"){
                  result["data"].forEach(invoice => {
                    if(invoice.status=="pending"){
                      pendingNum +=1;
                    }
                  });  
                }else{
                  return "Error::Unable to retrieve Invoices";
                }
              });    
              user["pendingNum"] = pendingNum;
            }
          });

          for(var i=0;i<this.resultData.length;i++){
            if(i<this.displayData.length){
              this.displayData[i] = this.resultData[i];
            }else{
              this.displayData.push(this.resultData[i]);
            }
          }
                       
        }else{
          alert(result["response"]);
        }
    }));
    this.loading = false;
  }

  searchNew(){      
    this.search(
      {"searchPrompt":this.searchPrompt,
      "lookUpKey":this.lookUpKey,
      "pageSize":12,
      "currentPage":1,
      "searchType":"normal",
      "showInActive":this.showInActive,
       }
    );
  }
  nextPage(){      
    if(this.currentPage==this.totalPage){
      return;
    }
    this.search(
      {"searchPrompt":this.searchPrompt,
      "lookUpKey":this.lookUpKey,
      "pageSize":12,
      "currentPage":this.currentPage+1,
      "searchType":"normal",
      "showInActive":this.showInActive,
       }
    );
  }
  handleShowNonActive($event){
    this.search(
      {"searchPrompt":this.searchPrompt,
      "lookUpKey":this.lookUpKey,
      "pageSize":12,
      "currentPage":1,
      "searchType":"normal",
      "showInActive":!this.showInActive
       }
    );
  }
  previousPage(){
    if(this.currentPage==1 || this.currentPage==0){
      return;
    }
    this.search(
      {"searchPrompt":this.searchPrompt,
      "lookUpKey":this.lookUpKey,
      "pageSize":12,
      "currentPage":this.currentPage-1,
      "searchType":"normal",
      "showInActive":this.showInActive,
       }
    );
  }
  export_to_csv(){
    this.search(
      {"searchPrompt":this.searchPrompt,
      "lookUpKey":this.lookUpKey,
      "pageSize":12,
      "currentPage":this.currentPage,
      "searchType":"normal",
      "showInActive":this.showInActive,
      "export":true
       }
    );
  }
  getShortened(family){
    if(family){
      return family.slice(0,6)
    }else{
      return "-";
    }
  }

  async reloadCustomer(customer_id){    
    if(customer_id==true){
      return;
    }
    await this.mainService.getMember(customer_id).then(async (result)=>{
      if(result["response"]=="success"){
        this.detailUser = result["member"];
      }else{
        alert(result["response"]);
      }
      for(var i=0;i<this.displayData.length;i++){
        if(this.displayData[i]){
          if(this.displayData[i].id==this.detailUser.id){
            this.displayData[i] = this.detailUser;
            if(this.detailUser){
              let pendingNum = 0;
              await this.mainService.getInvoicesByUser(this.detailUser.id).then((result)=>{
                if(result["response"]=="success"){
                  result["data"].forEach(invoice => {
                    if(invoice.status=="pending"){
                      pendingNum +=1;
                    }
                  });  
                }else{
                  return "Error::Unable to retrieve Invoices";
                }
              });    
              this.detailUser["pendingNum"] = pendingNum;
            }
          }
        }
      }
    });    
  }
}
