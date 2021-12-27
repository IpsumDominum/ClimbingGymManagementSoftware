import { Component, OnInit } from '@angular/core';
import { ModalService } from '../modal/modal.service';

@Component({
  selector: 'waiver-temp-view-details-modal',
  templateUrl: './waiver-temp-view-details-modal.component.html',
  styleUrls: ['./waiver-temp-view-details-modal.component.css']
})
export class WaiverTempViewDetailsModalComponent implements OnInit {
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
