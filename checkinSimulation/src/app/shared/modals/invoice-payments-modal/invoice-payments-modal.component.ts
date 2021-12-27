import { Component, OnInit, Input } from '@angular/core';
import { ModalService } from '../modal/modal.service';
import { MainService } from '../../main.service';

@Component({
  selector: 'invoice-payment-modal',
  templateUrl: './invoice-payments-modal.component.html',
  styleUrls: ['./invoice-payments-modal.component.css']
})
export class InvoicePaymentsModalComponent implements OnInit {
  @Input() customer:any;
  loading:boolean = false;
  selectedInvoice:any;
  invoiceData:any;
  displayData:any = new Array(10).fill(undefined);
  constructor(
    private modalService:ModalService,
    private mainService:MainService
  ) { }

  ngOnInit(): void {
    this.load();
  }
  expandInvoice(invoice){

  }
  async load(){
    this.loading = true;
    await this.mainService.getInvoicesByUser(this.customer.id).then((result)=>{
      this.invoiceData = result;    
    });
    for(var i=0;i<this.invoiceData.length;i++){
      if(i<this.displayData.length){
        this.displayData[i] = this.invoiceData[i];
      }else{
        this.displayData.push(this.invoiceData[i]);
      }
    }
    this.loading = false;
  }
  openModal(id: string) {
    this.load();
    this.modalService.open(id);
}

closeModal(id: string) {
    this.modalService.close(id);
}
}
