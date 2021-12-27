import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { MainService } from 'src/app/shared/main.service';
import { ModalService } from '../modal/modal.service';

@Component({
  selector: 'add-product-modal',
  templateUrl: './add-product-modal.component.html',
  styleUrls: ['./add-product-modal.component.css']
})
export class AddProductModalComponent implements OnInit {
  @Input() mode:string = "add";
  @Input() product_ref:any;
  @Output() submitted: EventEmitter<any> = new EventEmitter();
    vendor:string = "";
    productName:string = "";
    notes:string = "";
    size:string = "";
    color:string = "";
    stock:number = 0;
    price:number = 0.0;
    productType:string = "Retail";

    waiver_required:number = 0;
    allow_anonymous_sale:boolean = false;

    loading:boolean = false;

    product:any;
    is_default:any = false;
    constructor(
      private modalService: ModalService,
      private mainService:MainService
      ) { }

    ngOnInit() {
      this.loading = false;
      this.load();
      this.loading = true;
    }

    alert(message){
      alert(message);
    }
    async load(){
      if(this.mode=="edit" && this.product_ref!=undefined){
        this.mainService.getProduct(this.product_ref.id).then((result)=>{
          this.vendor = result['vendor'];
          this.is_default = result["is_default"];
          this.productName = result['name'];
          this.price = result['price'];
          this.notes = result['notes'];
          this.productType = result["productType"];
          this.waiver_required = result["waiver_required"]
          this.allow_anonymous_sale = result["allow_anonymous_sale"];
          this.product = result;  
        });
      }
    }

    async submit(){
      let data = {     
        "vendor": this.vendor,
        "name":this.productName,
        "notes":this.notes,
        "size":this.size,
        "color":this.color,
        "stock":this.stock,
        "price":this.price,
        "allow_anonymous_sale": this.productType=="Retail" ? this.allow_anonymous_sale : false,
        "waiver_required":this.waiver_required,
        "productType":this.productType
      }
      if(this.mode=="add"){      
        await this.mainService.createProduct(data).then(result=>{
          if(result=="success"){
            alert("success!");
            this.closeModal(this.mode+"-product-modal")
            this.submitted.emit(true)
          }else{
            alert(result);
          }
        });  
      }else if(this.mode=="edit"){
        data["id"] = this.product.id;
        await this.mainService.editProduct(data).then(result=>{
          if(result=="success"){
            alert("success!");
            this.closeModal(this.mode+"-product-modal")
            this.submitted.emit(true)
          }else{
            alert(result);
          }
        });
      }
      
    }
    openModal(id: string) {
      this.load();
      this.modalService.open(id);
    }

    closeModal(id: string) {
        this.modalService.close(id);
    }
    check_product_is_default(product){
      if(product){
          return product.is_default;
      }else{
        return false;
      }
    }
    check_product_has_sub_items(product){
      if(product){
        return product.sub_products.length>0;
      }else{
        return false;
      }
    }
}