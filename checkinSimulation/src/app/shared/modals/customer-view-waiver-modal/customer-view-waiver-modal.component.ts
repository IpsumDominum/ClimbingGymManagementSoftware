import { Component, OnInit } from '@angular/core';
import { ModalService } from '../modal/modal.service';

@Component({
  selector: 'customer-view-waiver-modal',
  templateUrl: './customer-view-waiver-modal.component.html',
  styleUrls: ['./customer-view-waiver-modal.component.css']
})
export class CustomerViewWaiverModalComponent implements OnInit {

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
