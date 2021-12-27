import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ModalService } from '../modal/modal.service';

@Component({
  selector: 'edit-qty-modal',
  templateUrl: './edit-qty.component.html',
  styleUrls: ['./edit-qty.component.css']
})
export class EditQtyComponent implements OnInit {
  @Output() submitted: EventEmitter<any> = new EventEmitter();
  @Input() saleToEdit:any;

  maximumQuantity:number = 0;

  editedQuantity:number = 0;

  error:string = "";
  constructor(
    private modalService:ModalService
  ) { }

  ngOnInit(): void {
  }
  confirm(){
/*    if(this.editedQuantity<=0){
      this.error = "Please ensure quantity >0";
    }else if(this.editedQuantity>this.maximumQuantity){
      this.error = "Out of stock";
    }else{*/
      this.error = "";
      this.submitted.emit({"quantity":this.editedQuantity,"sale":this.saleToEdit});
      this.closeModal("edit-qty-modal");
  }
  openModal(id: string) {
    this.editedQuantity = 0;
    this.error = "";

    if(this.saleToEdit.id==""){
      return;
    }else{
      if(this.saleToEdit.product.productType=="Rental"){
        this.maximumQuantity = this.saleToEdit.product.stock - this.saleToEdit.product.rented;
      }else if(this.saleToEdit.product.productType=="Retail"){
        this.maximumQuantity = this.saleToEdit.product.stock;
      }else if(this.saleToEdit.product.productType=="Rental"){
        this.maximumQuantity = this.saleToEdit.product.stock - this.saleToEdit.product.rented;
      }else{
        this.maximumQuantity = 999;
      }
      this.editedQuantity = this.saleToEdit.quantity;
    }
    this.modalService.open(id);
}

closeModal(id: string) {
    this.modalService.close(id);
}

}

