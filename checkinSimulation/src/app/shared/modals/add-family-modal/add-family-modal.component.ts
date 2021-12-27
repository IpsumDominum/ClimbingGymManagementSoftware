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
    membersData:any = new Array(6).fill(undefined);
    resultData:any = [];
    searchPrompt:string = "";
    chosenCustomer:any;
    chosenFamilyMember:any;
    mode = "waitingCommand";
    family:any = [];
    constructor(
      private modalService: ModalService,
      private mainService:MainService
      ) { }

    ngOnInit() {
      this.openModalEvent.subscribe(r=>{
        this.openModal('add-family-modal');
      });      
    }
    search(){
      this.mainService.searchMember(
        {"searchPrompt":this.searchPrompt,
        "searchType":"simple",
         }).then((result=>{
          this.displayData = new Array(12).fill(undefined);
          this.resultData = result;
          var i =0;
          var j = 0;
          while(i<this.resultData.length){
            //==============================
            if(this.isSameUser(this.resultData[i],this.detailUser)){
              i+=1;
              continue;
            }else{
            if(j<this.displayData.length){
              this.displayData[j] = this.resultData[i];
            }else{
              this.displayData.push(this.resultData[i]);
            }
            i +=1;
            j+=1;
          }
          }
          //==============================
      }));
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
      this.membersData = new Array(6).fill(undefined);
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
        await this.load_family_members();
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
        this.search();
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
}