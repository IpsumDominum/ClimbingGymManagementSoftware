import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { ModalService } from '../modal/modal.service';

@Component({
  selector: 'redeem-coupon-modal',
  templateUrl: './redeem-coupon-modal.component.html',
  styleUrls: ['./redeem-coupon-modal.component.css']
})
export class RedeemCouponModalComponent implements OnInit {
  @Output() submitted: EventEmitter<any> = new EventEmitter();

  discountPercentage:number = 0;
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
      this.submit();
    }
  }  
  submit(){
    if(this.discountPercentage<0 || this.discountPercentage>100){
      this.error = "Discount percentage must be between 0-100";
    }else{
      this.submitted.emit(this.discountPercentage);
      this.closeModal("redeem-coupon-modal");
    }
  }

  openModal(id: string) {
    this.discountPercentage = 0;
    this.modalService.open(id);
}

closeModal(id: string) {
    this.modalService.close(id);
}

}
