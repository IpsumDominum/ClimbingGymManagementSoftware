import { Component, OnInit } from '@angular/core';
import { ModalService } from '../modal/modal.service';

@Component({
  selector: 'edit-coupon-modal',
  templateUrl: './edit-coupon-modal.component.html',
  styleUrls: ['./edit-coupon-modal.component.css']
})
export class EditCouponModalComponent implements OnInit {

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
