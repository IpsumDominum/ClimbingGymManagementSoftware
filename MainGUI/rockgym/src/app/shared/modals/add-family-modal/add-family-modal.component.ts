import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { ModalService } from '../modal/modal.service';
import { MainService } from '../../main.service';

@Component({
  selector: 'add-family-modal',
  templateUrl: './add-family-modal.component.html',
  styleUrls: ['./add-family-modal.component.css']
})
export class AddFamilyModalComponent implements OnInit {
  @Output() submitted: EventEmitter<any> = new EventEmitter();
  @Output() choseCustomerEmitter: EventEmitter<any> = new EventEmitter();
  @Input() openModalEvent:EventEmitter<any> = new EventEmitter();
  @Input() detailUser;

    displayData:any = new Array(12).fill(undefined);
    membersData:any = new Array(12).fill(undefined);
    resultData:any = [];
    searchPrompt:string = "";
    chosenCustomer:any;
    chosenFamilyMember:any;
    mode = "waitingCommand";
    family:any = [];


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
        this.openModal('add-family-modal');
      });      
    }
    getSearchResultLength(){
      var amount = 0;
      this.displayData.forEach(item=> {
        if(item){
          amount +=1;
        }
      });
      return amount;
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
        "searchType":"normal"
         }
      );
    }
    search(searchQuery){
      
      this.mainService.searchMember(
        searchQuery
        ).then((result=>{
          this.displayData = new Array(12).fill(undefined);
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
        "pageSize":12,
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
        "pageSize":12,
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
        "pageSize":12,
        "currentPage":this.currentPage-1,
        "searchType":"normal"
         }
      );
      
    }
    chooseCustomer(customer){
      if(this.chooseCustomer!=undefined){
        this.chosenCustomer = customer;
      }
    }
    isSameUser(member1,member2){
      if(member1==undefined || member2 ==undefined){
        return false;
      }else{
        return member1.id ==member2.id;
      }
    }
    removeFamilyMember(){
      if(this.chosenFamilyMember==undefined){
        alert("please choose a famlily member first");
      }else{
        let confirmation = confirm("Are you sure to remove " + 
        this.chosenFamilyMember.firstName + " " + 
        this.chosenFamilyMember.lastName + " from this family?"
        );
        if(confirmation==false){
          return;
        }else{
          /*pass*/
        }
        this.mainService.removeFromFamily(this.chosenFamilyMember.id).then((result)=>{
          if(result=="success"){
            this.load_family_members();   
          }else{
            alert('result');
          }
        });
      }
    }

    async load_family_members(){
      this.membersData = new Array(12).fill(undefined);
      if(!this.detailUser){
        return;
      }
      this.mainService.getFamily(this.detailUser.id).then((result)=>{
        if(result["response"]=="success"){
          this.family = result["data"];
          var i =0;
          var j =0;
          if(this.family.members==undefined){
            return;
          }
          while(i<this.family.members.length){
            if(this.family.members[i].id == this.detailUser.id){
              //Pass
              i += 1;
              continue;
            }else{
              if(j<this.membersData.length){
                this.membersData[j] = this.family.members[i];
              }else{
                this.membersData.push(this.family.members[i]);
              } 
              j += 1;             
              i += 1;
            }
            
          }
      }else if(!result["response"]){
          alert("load_family_members()::unknown database error...")
        }else{
          alert(result["response"]);
        }
      });
    }
    /*
    Confirm and emit customer to above component
    */
    async confirm(){
      if(!this.chosenCustomer){
        return;
      }
      if(this.mode=="selectMemberInitial"){
        this.detailUser = this.chosenCustomer;
        this.chosenCustomer = undefined;
        await this.load_family_members();
        this.displayData = new Array(12).fill(undefined);
        this.mode = "waitingCommand";
      }else if(this.mode=="selectMemberAdditional"){
        if(this.chosenCustomer.family !=null){
          if(this.chosenCustomer.family ==this.detailUser.family){
            alert("The chosen customer is already in the family");
            return;
          }else{
            let confirmation = confirm("The chosen customer "+this.chosenCustomer.firstName + " " + this.chosenCustomer.lastName
            +" has already a family associated. Are you sure to move him into this family instead?")
            if(confirmation==true){
              /*pass*/
            }else{
              return;
            }
          }
        }else{
          let confirmation = confirm("Are you sure to add "+this.chosenCustomer.firstName + " " + this.chosenCustomer.lastName
            +" to this family?")
            if(confirmation==true){
              /*pass*/
            }else{
              return;
            }
        }
        

        let data = {
          "primary_member":this.detailUser.id,
          "secondary_member":this.chosenCustomer.id
        }
        await this.mainService.addFamily(data).then((result)=>{
          if(result=="success"){
            this.load_family_members();
            this.mode = "waitingCommand";
          }else{
          }
          alert(result);
        })
        
        //this.mode = "waitingCommand";
      }else{

      }
    }
    handleKeyboardEvent(event:KeyboardEvent){
      if(event.key=="Enter"){
        this.search(
          {"searchPrompt":this.searchPrompt,
        "lookUpKey":this.lookUpKey,
        "pageSize":12,
        "currentPage":1,
        "searchType":"normal"
         }
        );
      }
    }  
    openModal(id: string) {      
      if(this.detailUser){
        this.mode="selectMemberAdditional";
        this.load_family_members();
      }else{
        this.mode = "selectMemberInitial";
      }
        this.displayData = new Array(12).fill(undefined);        
        this.searchPrompt= "";
        this.resultData = [];        
        this.modalService.open(id);
    }

    closeModal(id: string) {
      this.detailUser = undefined;
      this.submitted.emit(true);
      this.modalService.close(id);
    }
    getShortened(family){
      if(family){
        return family.slice(0,6)
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
        let today = new Date();
        let date = new Date(birthday);
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
}