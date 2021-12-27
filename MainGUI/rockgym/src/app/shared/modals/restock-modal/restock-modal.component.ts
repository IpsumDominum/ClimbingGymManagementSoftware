import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ModalService } from '../modal/modal.service';
import { MainService } from '../../main.service';

@Component({
  selector: 'restock-modal',
  templateUrl: './restock-modal.component.html',
  styleUrls: ['./restock-modal.component.css']
})
export class RestockModalComponent implements OnInit {
  @Input() sub_product_ref:any;
  @Output() submitted: EventEmitter<any> = new EventEmitter();

  restock_amount:number = 0;
  note:string = "";
  constructor(
    private modalService:ModalService,
    private mainService:MainService

  ) { }

  ngOnInit(): void {
  }
  restock(){
    let data = {
      "sub_product_id":this.sub_product_ref.id,
      "restock_amount":this.restock_amount,
      "note":this.note
    }
    this.mainService.addRestock(data).then((result)=>{
      if(result=="success"){
        alert("success!");
        this.closeModal('restock-modal');
        this.submitted.emit(0);
      }
    });
  }
  openModal(id: string) {
    if(!this.sub_product_ref){
      return;
    }
    this.restock_amount = 0;
    this.note = ""

    this.modalService.open(id);
}

closeModal(id: string) {
    this.modalService.close(id);
}
}
