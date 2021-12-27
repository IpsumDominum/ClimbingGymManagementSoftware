import { Component, OnInit } from '@angular/core';
import { ModalService } from '../modal/modal.service';

@Component({
  selector: 'advanced-search-modal',
  templateUrl: './advanced-search-modal.component.html',
  styleUrls: ['./advanced-search-modal.component.css']
})
export class AdvancedSearchModalComponent implements OnInit {

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
