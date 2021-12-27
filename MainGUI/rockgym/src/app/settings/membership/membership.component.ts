import { Component, OnInit, EventEmitter } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { MainService } from 'src/app/shared/main.service';

@Component({
  selector: 'app-membership-management',
  templateUrl: './membership.component.html',
  styleUrls: ['./membership.component.css']
})
export class MembershipManagementComponent implements OnInit {
  loading:boolean = false;
  resultData:any;
  filteredData:any[] = [];

  searchPrompt:string = "";

  pageSize:number = 7;  

  displayData:any = new Array(this.pageSize).fill(undefined);
  
  adjustmentData:any = new Array(10).fill(undefined);
  invoiceDetail:any = new Array(10).fill(undefined);

  selectedInvoice:any;
  detailMembership:any;

  lookUpKey:string = "Common";

  /*Filter invoice key...*/
  filterKey:string = "all";
  filterMembershipKey:string ="all"

  totalPage:number = 0;
  currentPage:number = 0;
  totalAmount:number = 0;

  openMembershipHolidayModal: EventEmitter<any> = new EventEmitter();

  constructor(
    private mainService:MainService,
    private router:Router,
    private route:ActivatedRoute
  ) { 

    router.events.pipe(
			filter(event => event instanceof NavigationEnd),
		).subscribe(async event=>
           {
            let member_search = this.route.snapshot.queryParamMap.get('member_search');
            if(member_search){
              this.searchPrompt = member_search;
              this.searchNew();
            }
          });
  }
  ngOnInit(): void {
    this.load();
  }

handleFreezeAndHoliday(mode){
  if(mode.includes("All")){
    this.openMembershipHolidayModal.emit({'membership':undefined,'mode':mode});
  }else if(this.detailMembership){
    this.openMembershipHolidayModal.emit({'membership':this.detailMembership,'mode':mode});
  }
}
  insertIntoPlaceHolderArray(placeHolderArray,array){
    for(var i=0;i<array.length;i++){
      if(i<placeHolderArray.length){
        placeHolderArray[i] = array[i];
      }else{
        placeHolderArray.push(array[i]);
      }
    }
    return placeHolderArray;
  }
  filterInvoiceArray(membershipInvoices){
    let filteredArray = [];
    this.invoiceDetail = new Array(10).fill(undefined);
    if(this.filterKey=="all"){
      filteredArray = membershipInvoices;
    }else{
      filteredArray = membershipInvoices.filter(invoice=>invoice.status==this.filterKey);
    }
    this.insertIntoPlaceHolderArray(this.invoiceDetail,filteredArray);
  }
  async expandMembership(membership){
    this.detailMembership = membership;

   this.adjustmentData = new Array(10).fill(undefined);
   this.invoiceDetail = new Array(10).fill(undefined);

   if(membership){
    this.filterInvoiceArray(membership.invoices);
    this.insertIntoPlaceHolderArray(this.adjustmentData,membership.adjustments);
   }

  }


filterMembership(filter_by){
    this.filterMembershipKey = filter_by;
    this.currentPage = 1;
    this.search(
      {"searchPrompt":this.searchPrompt,
      "lookUpKey":this.lookUpKey,
      "pageSize":this.pageSize,
      "currentPage":1,
      "searchType":"normal"
       }
    )
  }

  async load(){
    this.loading = true;
    this.searchNew(); 
    this.loading = false;
  }

    
  async sendEmailOnRetrySuccess(member_query){
    interface Template{
      template_content:any,
      template_header:any,
      recipients:any[],
      template_name:any,
    }
    await this.mainService.getAllEmailTemplates().then(async (result:Template[])=>{
      let emailTemplates:Template[] = result;      
      let template:Template = emailTemplates.filter(template=>template.template_name=="Invoice Retry Successful")[0];
      if(!template){
        alert("template 'Invoice Retry Success' not found...")
      }
      await this.mainService.sendArbitaryEmail({
        "msg_html":template.template_content,
        "msg_header":template.template_header,
        "recipients":[member_query]
      }).then((result)=>{
        return result;
      });  
    });
    
  }
  async retryInvoice(){
    if(!this.selectedInvoice){
      return;
    }else{
      if(this.selectedInvoice.status=="failed"){
        let confirmation = confirm("Are you sure to retry this invoice?");
        if(confirmation){
          /*Proceed to void invoice*/
          let member_query;
          await this.mainService.getMember(this.selectedInvoice.member_id).then((result)=>{
            if(result["response"]=="success"){
              member_query = result["member"];
            }else{
              alert(result["response"]);
            }
          });
          if(!member_query){
            alert("Error::Member query not found due to unknown error...");
            return;
          }
          await this.mainService.retryInvoice(this.selectedInvoice.id).then(async (result)=>{
            if(result["response"]=="success"){
              alert("Successfully paid invoice after retry...");
              let confirmation = confirm("Would you wish to send an email to the customer letting them know about retry successful?");
              if(confirmation){
                await this.sendEmailOnRetrySuccess(member_query).then((email_result)=>{
                  console.log(email_result);
                  alert(email_result["response"]);
                });
              }
              this.detailMembership.invoices.forEach(invoice => {
                if(invoice)  {
                  if(invoice.id==this.selectedInvoice.id){
                    invoice["status"] = "paid-after-retry";
                  }
                }
              });
              //this.load();
            }else{
              alert(result["response"]);
            }
          });
        }else{
          /*Canceled*/
          return;
        }
  
      }else{
        alert("Cannot retry invoice with status { "+this.selectedInvoice.status + " }");
      }
    }
  }
 voidInvoice(){
  if(!this.selectedInvoice){
    return;
  }else{
    if(this.selectedInvoice.status!="void"){
      let confirmation = confirm("Are you sure to void this invoice?");
      if(confirmation){
        /*Proceed to void invoice*/
        this.mainService.voidInvoice(this.selectedInvoice.id).then((result)=>{
          if(result["response"]=="success"){
            alert("Successfully voided invoice...");
            this.detailMembership.invoices.forEach(invoice => {
              if(invoice)  {
                if(invoice.id==this.selectedInvoice.id){
                  invoice["status"] = "void";
                }
              }
            });
            //this.load();
          }else{
            alert(result["response"]);
          }
        });
      }else{
        /*Canceled*/
        return;
      }

    }else{
      alert("Cannot void invoice with status { "+this.selectedInvoice.status + " }");
    }
  }
 }
  
 confirmInvoice(){
  if(!this.selectedInvoice){
    return;
  }else{
    if(this.selectedInvoice.status!="paid" || this.selectedInvoice.status!="paid-after-retry"){
      let confirmation = confirm("Are you sure to confirm this invoice?");
      if(confirmation){
        /*Proceed to void invoice*/
        this.mainService.confirmInvoice(this.selectedInvoice.id).then((result)=>{
          if(result["response"]=="success"){
            alert("Successfully confirmed invoice...");
            this.detailMembership.invoices.forEach(invoice => {
              if(invoice)  {
                if(invoice.id==this.selectedInvoice.id){
                  invoice["status"] = "paid";
                }
              }
            });
            //this.load();
          }else{
            alert(result["response"]);
          }
        });
      }else{
        /*Canceled*/
        return;
      }

    }else{
      alert("Cannot void invoice with status { "+this.selectedInvoice.status + " }");
    }
  }
 }
  

  /*Pagination Stuff*/
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
      "pageSize":this.pageSize,
      "currentPage":this.currentPage,
      "searchType":"normal"
       }
    );
  }


  search(searchQuery){
    searchQuery["isActive"] = this.filterMembershipKey;
    this.mainService.searchMembership(
      searchQuery
      ).then((result=>{
        this.displayData = new Array(this.pageSize).fill(undefined);
        if(result["response"]=="success"){            
          this.resultData = result["data"];
          this.totalPage = result["total_pages"];
          this.currentPage = result["current_page"];
          this.totalAmount = result["total_amount"];
          this.insertIntoPlaceHolderArray(this.displayData,this.resultData);
        }else{
          alert(result["response"]);
        }
    }));
  }

  searchNew(){      
    this.search(
      {"searchPrompt":this.searchPrompt,
      "lookUpKey":this.lookUpKey,
      "pageSize":this.pageSize,
      "currentPage":1,
      "searchType":"normal"
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
      "pageSize":this.pageSize,
      "currentPage":this.currentPage+1,
      "searchType":"normal"
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
      "pageSize":this.pageSize,
      "currentPage":this.currentPage-1,
      "searchType":"normal"
       }
    );
  }

  handleKeyboardEvent(event:KeyboardEvent){
    if(event.key=="Enter"){
      this.search(
        {"searchPrompt":this.searchPrompt,
      "lookUpKey":this.lookUpKey,
      "pageSize":this.pageSize,
      "currentPage":1,
      "searchType":"normal"
       }
      );
    }
  }  

  
/*
filter by
*/
filterBy(filterKey){  
  this.filterKey = filterKey;
  if(this.detailMembership){
    this.filterInvoiceArray(this.detailMembership.invoices);
  }
  
}

dateFromISODetailed(date:string){
  if(date){
    let date_parsed = new Date(date);
    return (date_parsed.getDate()) +"/"+(date_parsed.getMonth()+1) + "/" + date_parsed.getFullYear() +"@" +date_parsed.getHours() + ":"+date_parsed.getMinutes();
  }else{
    return "-";
  }
}  
monthToString(month){
  switch (month){
    case 1:{
      return "Jan";
    }
    case 2:{
      return "Feb";
    }
    case 3:{
      return "Mar";
    }
    case 4:{
      return "Apr";
    } 
    case 5:{
      return "May";      
    } 
    case 6:{
      return "Jun";
    }
    case 7:{
      return "Jul";
    }
    case 8:{
      return "Aug";
    }
    case 9:{
      return "Sep";
    }
    case 10:{
      return "Oct";
    }
    case 11:{
      return "Nov";
    }
    case 12:{
      return "Dec";
    }
    default:{
      return month;
    }
  }
    
}
dateFromISO(date:string){
  if(date){
    let date_parsed = new Date(date);
    return (date_parsed.getDate()) +" - "+this.monthToString((date_parsed.getMonth()+1)) + " -" + date_parsed.getFullYear();
  }else{
    return "-";
  }
}
getAmountByStatus(status){
  if(this.detailMembership){
    let pendingAmount = 0;
    this.detailMembership.invoices.forEach(invoice => {
      if(invoice){
        if(invoice.status==status){
          pendingAmount +=invoice.expected_amount;
        }
      }
    });
    return pendingAmount;  
  }else{
    return "   "
  }
}
getInvoiceColor(status){
  if(status=="paid" || status=="paid-after-retry"){
    return "green";
  }else if(status=="pending"){
    return "blue";
  }else if(status=="failed"){
    return "red";
  }else if(status=="void"){
    return "gray";
  }else{
    return "black";
  }
}
export_to_csv(){
  this.search(
    {"searchPrompt":this.searchPrompt,
  "lookUpKey":this.lookUpKey,
  "pageSize":this.pageSize,
  "currentPage":1,
  "searchType":"normal",
  "export":true
   })
  }
}
