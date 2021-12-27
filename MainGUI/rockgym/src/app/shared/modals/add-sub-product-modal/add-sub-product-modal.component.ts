import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { MainService } from 'src/app/shared/main.service';
import { ModalService } from '../modal/modal.service';

@Component({
  selector: 'add-sub-product-modal',
  templateUrl: './add-sub-product-modal.component.html',
  styleUrls: ['./add-sub-product-modal.component.css']
})
export class AddSubProductModalComponent implements OnInit {
  @Input() mode:string = "add";
  @Input() sub_product_ref:any;
  @Input() product_ref:any;
  @Output() submitted: EventEmitter<any> = new EventEmitter();
    vendor:string = "";
    productName:string = "";
    
    notes:string = "";
    size:string = "";
    color:string = "";
    stock:number = 0;
    price:number = 0.0;

    editPrice:boolean = false;
    loading:boolean = false;
    constructor(
      private modalService: ModalService,
      private mainService:MainService
      ) { }

    ngOnInit() {
      this.loading = true;
      this.load();
      this.loading = false;
    }
    async load(){
      if(!this.product_ref){
        return;
      }
      this.vendor = this.product_ref.vendor;
      this.productName = this.product_ref.name;
      
      if(this.mode=="edit"){
        if(!this.sub_product_ref){
          return;
        }
        await this.mainService.getSubProduct(this.sub_product_ref.id).then((result)=>{
            this.notes = result["notes"];
            this.size = result["size"];
            this.color = result["color"];
            this.stock = result["stock"];
            this.price = result["price"];
        });
      }else{
        this.notes = "";
        this.size = "";
        this.color = "";
        this.stock = 0;
        this.price = this.product_ref.price;
      }
    }
    alert(message){
      alert(message);
    }
    async submit(){
      let data = {     
        "product_id":this.product_ref.id,
        "notes":this.notes,
        "size":this.size,
        "color":this.color,
        "stock":this.stock,
        "price":this.price,
      }
      if(this.mode=="edit"){
        data["id"] = this.sub_product_ref.id
        await this.mainService.editSubProduct(data).then(result=>{
          if(result=="success"){
            this.closeModal(this.mode+"-sub-product-modal")
            this.submitted.emit(true)
          }else{
  
          }
        });
      }else{
        await this.mainService.createSubProduct(data).then(result=>{
          if(result=="success"){
            alert("success!")
            this.closeModal(this.mode+"-sub-product-modal")
            this.submitted.emit(true)
          }else{
            alert(result);
          }
        });
      }
    }
    
    openModal(id: string) {
      if(!this.product_ref){
        return;
      }
      if(this.product_ref.is_default==true){
        alert("cannot add subItem for default Product");
        return;
      }
      this.load();      
        this.modalService.open(id);
    }

    closeModal(id: string) {
        this.modalService.close(id);
    }
}