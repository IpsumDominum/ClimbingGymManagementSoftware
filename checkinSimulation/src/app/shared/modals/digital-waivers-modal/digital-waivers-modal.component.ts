import { Component, OnInit, Input } from '@angular/core';
import { ModalService } from '../modal/modal.service';

@Component({
  selector: 'digital-waivers-modal',
  templateUrl: './digital-waivers-modal.component.html',
  styleUrls: ['./digital-waivers-modal.component.css']
})
export class DigitalWaiversModalComponent implements OnInit {
  @Input() mode:string = "small";
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
