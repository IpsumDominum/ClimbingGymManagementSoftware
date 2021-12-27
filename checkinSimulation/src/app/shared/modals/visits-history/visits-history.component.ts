import { Component, OnInit } from '@angular/core';
import { ModalService } from '../modal/modal.service';

@Component({
  selector: 'visits-history-modal',
  templateUrl: './visits-history.component.html',
  styleUrls: ['./visits-history.component.css']
})
export class VisitsHistoryComponent implements OnInit {

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
