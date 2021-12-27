import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { ModalService } from '../modal/modal.service';

@Component({
  selector: 'set-rental-due-date-modal',
  templateUrl: './set-rental-due-date-modal.component.html',
  styleUrls: ['./set-rental-due-date-modal.component.css']
})
export class SetRentalDueDateModalComponent implements OnInit {
  @Output() submitted: EventEmitter<any> = new EventEmitter();
  @Input() openModalEvent:EventEmitter<any> = new EventEmitter();

  mode:string = "specifyTime";

  days:number = 1;
  endDate:string;
  product_ref:any;
  constructor(
    private modalService:ModalService
  ) { }

  ngOnInit(): void {
    this.openModalEvent.subscribe(r=>{
      this.product_ref = r;
      this.openModal('set-rental-due-date-modal');
    });
  }
  confirm(){
    if(this.mode=="specifyTime"){

      if(this.days<0 || this.days >365){
        return;
      }
      
    }else if(this.mode=="selectEndDate"){
      if(this.endDate==undefined){
        return;
      }else{
        /*pass*/
      }
    }else{
      /*weird...*/
      return;
    }
      let data = {
        "days":this.days,
        "endDate":this.endDate,
        "mode":this.mode,
        "product":this.product_ref
      }
      this.submitted.emit(data);
    this.modalService.close('set-rental-due-date-modal');
  }
  openModal(id: string) {
    this.modalService.open(id);
}

closeModal(id: string) {
  this.modalService.close(id);
}

}
