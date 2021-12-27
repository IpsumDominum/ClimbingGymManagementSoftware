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

    displayData:any = new Array(12).fill(undefined);
    resultData:any = [];
    searchPrompt:string = "";
    chosenCustomer:any;
    constructor(
      private modalService: ModalService,
      private mainService:MainService
      ) { }

    ngOnInit() {
      this.openModalEvent.subscribe(r=>{
        this.openModal('custom-modal-3');
      });
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
    handleKeyboardEvent(event:KeyboardEvent){
      if(event.key=="Enter"){
        this.search();
      }
    }  
    openModal(id: string) {
        this.displayData = new Array(12).fill(undefined);
        this.searchPrompt= "";
        this.resultData = [];
        this.modalService.open(id);
    }

    closeModal(id: string) {
        this.modalService.close(id);
    }
}