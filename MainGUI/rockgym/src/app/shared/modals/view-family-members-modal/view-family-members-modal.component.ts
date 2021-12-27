import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { ModalService } from '../modal/modal.service';
import { MainService } from '../../main.service';

@Component({
  selector: 'view-family-members-modal',
  templateUrl: './view-family-members-modal.component.html',
  styleUrls: ['./view-family-members-modal.component.css']
})
export class ViewFamilyMembersModalComponent implements OnInit {

  @Output() submitted: EventEmitter<any> = new EventEmitter();
  @Input() openModalEvent:EventEmitter<any> = new EventEmitter();
  detailUser;

    membersData:any = new Array(7).fill(undefined);
    searchPrompt:string = "";
    chosenFamilyMember:any;
    mode = "waitingCommand";
    family:any = [];
    constructor(
      private modalService: ModalService,
      private mainService:MainService
      ) { }

    ngOnInit() {
      this.openModalEvent.subscribe(customer=>{
        this.detailUser = customer;
        this.openModal('view-family-members-modal');
      });      
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
      this.membersData = new Array(7).fill(undefined);
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
    handleKeyboardEvent(event:KeyboardEvent){

    }  
    openModal(id: string) {      
      if(this.detailUser){
        this.load_family_members();
      }else{
        alert("please first select a member to view their family members");
        return;
      }
        this.searchPrompt= "";
        this.modalService.open(id);
    }

    closeModal(id: string) {
      this.submitted.emit(this.detailUser.id);
      this.detailUser = undefined;
      this.modalService.close(id);
    }

    dateFromISODetailed(date:string){
      if(date){
        let date_parsed = new Date(date);
        return (date_parsed.getUTCDate()+1) +"/"+(date_parsed.getMonth()+1) + "/" + date_parsed.getFullYear() +"@" +date_parsed.getHours() + ":"+date_parsed.getMinutes();
      }else{
        return "-";
      }
    }  
    dateFromISO(date:string){
      if(date){
        let date_parsed = new Date(date);
        return (date_parsed.getUTCDate()+1) +"/"+(date_parsed.getMonth()+1) + "/" + date_parsed.getFullYear();
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
        return year_diff;
      }else{
        return "-";
      }
    }
    expandUser(user){
      this.chosenFamilyMember = user;
     }
}