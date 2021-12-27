import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { ModalService } from '../modal/modal.service';

@Component({
  selector: 'discount-amount-modal',
  templateUrl: './discount-amount-modal.component.html',
  styleUrls: ['./discount-amount-modal.component.css']
})
export class DiscountAmountComponent implements OnInit {
  @Output() submitted: EventEmitter<any> = new EventEmitter();

  discountAmount:number = 0;
  error:string = "";
  constructor(
    private modalService:ModalService
  ) { }

  ngOnInit(): void {
  }

  search(){
    
  }
  handleKeyboardEvent(event:KeyboardEvent){
    if(event.key=="Enter"){
      this.search();
    }
  }  
  isNumeric(str) {
    if (typeof str != "string") return false // we only process strings!  
    // @ts-ignore
    return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
    // @ts-ignore
           !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
  }
  submit(){
    if(!this.isNumeric(this.discountAmount.toString())){
      this.error = "Discount Amount must be a number";
      return;
    }else{
      this.submitted.emit(this.discountAmount);
      this.closeModal("discount-amount-modal");
    }
  }

  openModal(id: string) {
    this.discountAmount = 0;
    this.modalService.open(id);
}

closeModal(id: string) {
    this.modalService.close(id);
}

}
