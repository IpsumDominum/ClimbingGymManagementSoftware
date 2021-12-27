import { Component, OnInit } from '@angular/core';
import { ModalService } from '../modal/modal.service';

@Component({
  selector: 'convert-to-customer-modal',
  templateUrl: './convert-to-customer-modal.component.html',
  styleUrls: ['./convert-to-customer-modal.component.css']
})
export class ConvertToCustomerModalComponent implements OnInit {

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
