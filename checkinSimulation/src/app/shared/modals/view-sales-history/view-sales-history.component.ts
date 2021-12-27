import { Component, OnInit } from '@angular/core';
import { ModalService } from '../modal/modal.service';

@Component({
  selector: 'view-sales-history-modal',
  templateUrl: './view-sales-history.component.html',
  styleUrls: ['./view-sales-history.component.css']
})
export class ViewSalesHistoryComponent implements OnInit {
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
