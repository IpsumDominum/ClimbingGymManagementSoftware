import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { MainService } from 'src/app/shared/main.service';
import { ModalService } from '../modal/modal.service';

@Component({
  selector: 'choose-customer-modal',
  templateUrl: './choose-customer-modal.component.html',
  styleUrls: ['./choose-customer-modal.component.css']
})
export class ChooseCustomerComponent implements OnInit {
  @Output() submitted: EventEmitter<any> = new EventEmitter();
  @Output() choseCustomerEmitter: EventEmitter<any> = new EventEmitter();
  @Input() openModalEvent:EventEmitter<any> = new EventEmitter();

    displayData:any = new Array(6).fill(undefined);
    resultData:any = [];
    searchPrompt:string = "";
    chosenCustomer:any;

    lookUpKey:string = "Common";

    totalPage:number = 0;
    currentPage:number = 0;
    totalAmount:number = 0;

    constructor(
      private modalService: ModalService,
      private mainService:MainService
      ) { }

    ngOnInit() {
      this.openModalEvent.subscribe(r=>{
        this.searchNew();
        this.openModal('custom-modal-3');
      });
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
        "pageSize":6,
        "currentPage":this.currentPage,
        "searchType":"normal"
         }
      );
    }
    search(searchQuery){
      
      this.mainService.searchMember(
        searchQuery
        ).then((result=>{
          this.displayData = new Array(6).fill(undefined);
          if(result["response"]=="success"){            
            this.resultData = result["data"];
            this.totalPage = result["total_pages"];
            this.currentPage = result["current_page"];
            this.totalAmount = result["total_amount"];
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
    }

    searchNew(){      
      this.search(
        {"searchPrompt":this.searchPrompt,
        "lookUpKey":this.lookUpKey,
        "pageSize":6,
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
        "pageSize":6,
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
        "pageSize":6,
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
        "pageSize":6,
        "currentPage":1,
        "searchType":"normal"
         }
        );
      }
    }  

    /*Choose a customer*/
    chooseCustomer(customer){
      if(this.chooseCustomer!=undefined){
        this.chosenCustomer = customer;
      }
    }
    /*
    Confirm and emit customer to above component
    */
    confirm(){
      if(this.chosenCustomer!=undefined){
        this.choseCustomerEmitter.emit(this.chosenCustomer);
        this.closeModal('custom-modal-3');
      }
    }
    
    openModal(id: string) {
        this.displayData = new Array(6).fill(undefined);
        this.searchPrompt= "";
        this.resultData = [];
        this.chosenCustomer = null;
        this.modalService.open(id);
    }

    closeModal(id: string) {
        this.modalService.close(id);
    }
    dateFromISODetailed(date:string){
      if(date){
        let date_parsed = new Date(date);
        return (date_parsed.getDate()) +"/"+(date_parsed.getMonth()+1) + "/" + date_parsed.getFullYear() +"@" +date_parsed.getHours() + ":"+date_parsed.getMinutes();
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
    getShortened(family){
      if(family){
        return family.slice(0,6)
      }else{
        return "-";
      }
    }
}