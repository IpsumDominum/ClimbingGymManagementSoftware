import { Component, EventEmitter, Input, OnInit } from '@angular/core';
import { ModalService } from '../modal/modal.service';

@Component({
  selector: 'advanced-search-modal',
  templateUrl: './advanced-search-modal.component.html',
  styleUrls: ['./advanced-search-modal.component.css']
})
export class AdvancedSearchModalComponent implements OnInit {
  @Input() openModalEvent:EventEmitter<any> = new EventEmitter();
  photo:string;
  
  constructor(
    private modalService:ModalService
  ) { }

  ngOnInit(): void {
    this.openModalEvent.subscribe(data=>{
      this.photo = data;
      this.openModal('advanced-search-modal');
  });
  }
  openModal(id: string) {
    this.modalService.open(id);
}

closeModal(id: string) {
    this.modalService.close(id);
}

}
