import { Component, OnInit } from '@angular/core';
import { ModalService } from '../modal/modal.service';

@Component({
  selector: 'redeem-coupon-modal',
  templateUrl: './redeem-coupon-modal.component.html',
  styleUrls: ['./redeem-coupon-modal.component.css']
})
export class RedeemCouponModalComponent implements OnInit {

  constructor(
    private modalService:ModalService
  ) { }

  ngOnInit(): void {
  }
  openModal(id: string) {
    this.modalService.open(id);
}

closeModal(id: string) {
    this.modalService.close(id);
}

}
