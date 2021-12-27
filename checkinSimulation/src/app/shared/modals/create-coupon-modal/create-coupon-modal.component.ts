import { Component, OnInit } from '@angular/core';
import { ModalService } from '../modal/modal.service';

@Component({
  selector: 'create-coupon-modal',
  templateUrl: './create-coupon-modal.component.html',
  styleUrls: ['./create-coupon-modal.component.css']
})
export class CreateCouponModalComponent implements OnInit {

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
