import { Component, OnInit, ANALYZE_FOR_ENTRY_COMPONENTS } from '@angular/core';
import { MainService } from 'src/app/shared/main.service';

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css']
})
export class ProductsComponent implements OnInit {
  loading:boolean = false;
  productData:any;
  filteredData:any[] = [];
  totalPage:number = 0;
  pageNum:number = 0;
  pageSize:number = 10;  
  searchPrompt:string = "";
  displayData:any = new Array(this.pageSize).fill(undefined);
  detailProduct:any;
  subItems:any = new Array(15).fill(undefined);
  selectedSubProduct:any;
  subProductRestock:any = new Array(10).fill(undefined);
  subProductRental:any = new Array(10).fill(undefined);

  showInactiveProducts:boolean = false;
  showInactiveSubProducts:boolean = false;
  currentPage: number;

  lookUpKey:string = "Common";
  rentalSelect:any;
  constructor(
    private mainService:MainService    
  ) { 

  }
  ngOnInit(): void {
    this.load();
  }
  getTotalQuantity(product){
    let amount = 0;
    product.sub_products.forEach((subProduct)=> {
      amount += subProduct.stock;  
    });
    return amount;
  }
  insertIntoPlaceHolderArray(placeHolderArray,array){
    for(var i=0;i<array.length;i++){
      if(i<placeHolderArray.length){
        placeHolderArray[i] = array[i];
      }else{
        placeHolderArray.push(array[i]);
      }
    }
    return placeHolderArray;
}
  expandSubProduct(subproduct){
    this.selectedSubProduct = subproduct;
    this.subProductRestock = new Array(10).fill(undefined);
    this.subProductRental = new Array(10).fill(undefined);    
    if(this.selectedSubProduct){
      let filteredRestocks = this.selectedSubProduct.restocks;
      this.insertIntoPlaceHolderArray(this.subProductRestock,filteredRestocks);
      this.mainService.getRentalsBySubProduct(this.selectedSubProduct.id).then((result)=>{
        if(!result["response"]){
          alert("Error::Unknown Error");
        }else{        
          if(result["response"]!="success"){
            alert(result["response"]);
            return;
          }
        }
        this.insertIntoPlaceHolderArray(this.subProductRental,result["data"]);
      });
    }
  }
  expandProduct(product){
   this.detailProduct = product;
   this.subItems = new Array(15).fill(undefined);
   this.selectedSubProduct = undefined;
   if(product){
    let filteredSubProducts = [];

    if(this.showInactiveSubProducts){
        filteredSubProducts = product.sub_products;
      }else{
        filteredSubProducts = product.sub_products.filter(sub_product=>sub_product.is_active);
    }

    this.insertIntoPlaceHolderArray(this.subItems,filteredSubProducts);
   }
  }
  handleKeyboardEvent(event:KeyboardEvent){
    if(event.key=="Enter"){
      this.search();
    }
  }  
  async load(){
    this.loading = true;
    this.getProductData();
    this.expandProduct(undefined);
    this.loading = false;
  }
  async getProductData(){
    await this.mainService.getAllProducts().then(result=>{
      this.productData = result;
    });
    /*

    What is worse than spaghetti code?

    */
    if(this.detailProduct)
    this.productData.forEach(product => {
      if(this.detailProduct.id==product.id)  {
        this.detailProduct = product;        
        let found_sub = null;

        if(this.selectedSubProduct){
          product.sub_products.forEach(sub_product => {
            if(this.selectedSubProduct.id==sub_product.id){
              found_sub = sub_product;
            }
          });
        }
        this.expandProduct(product);        
        if(found_sub){
          this.expandSubProduct(found_sub);
        }
      }
    });
    /*
    Answer: spaghetti code without comments.(This is debatable)
    */
    if(this.showInactiveProducts){
      this.filteredData = this.productData;
    }else{
      this.filteredData = this.productData.filter(product=>product.is_active);
    }

    this.totalPage = Math.ceil(this.filteredData.length/10);    
    for(var i=0;i<this.pageSize;i++){
      this.displayData[i] = this.filteredData[i+this.pageNum*this.pageSize];      
    }
    this.currentPage = this.totalPage==0 ? 0 : this.pageNum+1;

  }

  deleteProduct(){
    if(this.detailProduct){
      let confirmed = false;
      if(this.detailProduct.is_default){
        alert("Cannot De-Activate default product!");
        return;
      }
      if(this.detailProduct.is_active){
        confirmed = confirm("Are you sure to De-Activate product : {" + this.detailProduct.name + "}");
        if(!confirmed){
          return;
        }
      }else{
        confirmed = confirm("Are you sure to Re-Activate product : {" + this.detailProduct.name + "}");
        if(!confirmed){
          return;
        }
      }
      this.mainService.deleteProduct(this.detailProduct.id).then((result)=>{
        if(result=="success"){
          alert("success");
          this.load();
        }else{
          alert(result);
        }
      });
      if(this.detailProduct.is_active){
        this.detailProduct = undefined;
      }
    }
  }
  async deleteSubProduct(){
    if(this.selectedSubProduct){

      let confirmed = false;

      if(this.selectedSubProduct.is_active){
        confirmed = confirm("Are you sure to De-Activate product : {" + this.detailProduct.name + "}");
        if(!confirmed){
          return;
        }
      }else{
        confirmed = confirm("Are you sure to Re-Activate product : {" + this.detailProduct.name + "}");
        if(!confirmed){
          return;
        }
      }
      await this.mainService.deleteSubProduct(this.selectedSubProduct.id).then((result)=>{
        if(result=="success"){
          alert("success");
          this.load();
        }else{
          alert(result);
        }
      })
      if(this.selectedSubProduct.is_active){
        this.selectedSubProduct = undefined;
      }
    }
  }
  isNumeric(str) {
    if (typeof str != "string") return false // we only process strings!  
    // @ts-ignore
    return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
    // @ts-ignore
           !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
  }
  onSearchChange($event): void {  
    if($event.target.value==""){
      return;
    }
    
    if(! this.isNumeric($event.target.value)){
      $event.target.value = "";
    }else{
      let parsed = parseInt($event.target.value);
      if(parsed>this.totalPage){
        parsed = this.totalPage;
        $event.target.value = this.totalPage;
      }
      this.currentPage = parsed;
    }
  }
  /*
  Search methods
  This will be enormous...
  */
  filter_criteria(product){
    /*Check show inactive products or not*/
    if(this.showInactiveProducts){
      /*pass*/
    }else{
      if(product.is_active==false){
        return false;
      }else{
        /*pass*/
      }
    }    
    if(this.lookUpKey=="Common"){
      let c1 = true;
      let c2 = true;
      let c3 = true;
        if(product.is_default){
          c1 = product.name_unchangeable.toLowerCase().includes(this.searchPrompt.toLowerCase());
        }else{
          c1 = product.name.toLowerCase().includes(this.searchPrompt) ;
        }
        c2 =  product.productType.toLowerCase().includes(this.searchPrompt.toLowerCase());        
        c3 = product.vendor.includes(this.searchPrompt);      
        return c1 || c2 || c3 ;
    }else if(this.lookUpKey=="ProductType"){
      return product.productType.toLowerCase().includes(this.searchPrompt.toLowerCase());
    }else if(this.lookUpKey=="Vendor"){
      return product.vendor.toLowerCase().includes(this.searchPrompt.toLowerCase());
    }else if(this.lookUpKey=="ProductName"){
      let c1 = true;
      if(product.is_default){
        c1 = product.name_unchangeable.toLowerCase().includes(this.searchPrompt.toLowerCase());
      }else{
        c1 = product.name.toLowerCase().includes(this.searchPrompt.toLowerCase()) ;
      }
    }else if(this.lookUpKey=="WaiverRequired"){
      let searchBoolean = false;
      if(["yes","true","required"].includes(this.searchPrompt.toLowerCase())){
        searchBoolean = true;
      }else{
        searchBoolean = false;
      }
      return product.waiver_required==searchBoolean;
    }else if(this.lookUpKey=="AgeRestriction"){
      return this.age_restriction_stringify(product.age_restriction).includes(this.searchPrompt);
    }else if(this.lookUpKey=="AllowAnonymousSale"){
      let searchBoolean = false;
      if(["yes","true","allowed"].includes(this.searchPrompt.toLowerCase())){
        searchBoolean = true;
      }else{
        searchBoolean = false;
      }
      return product.allow_anonymous_sale ==this.search;
    }else if(this.lookUpKey=="Notes"){

    }else if(this.lookUpKey=="Price"){
      let searchNumber = 0;
      let searchOperator = this.searchPrompt[0];      

      if(this.isNumeric(this.searchPrompt.slice(1,this.searchPrompt.length))){
        searchNumber = parseFloat(this.searchPrompt.slice(1,this.searchPrompt.length));
      }else{
        searchNumber = 0;
      }

      if(searchOperator==">"){
        return product.price > searchNumber;
      }else if(searchOperator=="<"){
        return product.price < searchNumber;
      }else{
        if(this.isNumeric(this.searchPrompt)){
          searchNumber = parseFloat(this.searchPrompt);
        }else{
          searchNumber = 0;
        }
        return product.price == searchNumber;
      }
    }else{
      return true;
    }
  }
  search(){
    this.filteredData = this.productData.filter(      
      product=>this.filter_criteria(product)
    );
    this.totalPage = Math.ceil(this.filteredData.length/10);
    for(var i=0;i<this.pageSize;i++){
      this.displayData[i] = this.filteredData[i+this.pageNum*this.pageSize];
    }
    this.currentPage = this.totalPage==0 ? 0 : this.pageNum+1;
  }
  previousPage(){
    if(this.pageNum!=0){
      this.pageNum -=1;
      for(var i=0;i<this.pageSize;i++){
        this.displayData[i] = this.filteredData[i+this.pageNum*this.pageSize];      
      }
    }
    this.currentPage = this.totalPage==0 ? 0 : this.pageNum+1;
  }
  nextPage(){
    if(this.pageNum!=this.totalPage-1){
      this.pageNum +=1;  
      for(var i=0;i<this.pageSize;i++){
        this.displayData[i] = this.filteredData[i+this.pageNum*this.pageSize];      
      }
    }
    this.currentPage = this.totalPage==0 ? 0 : this.pageNum+1;
  }
  /*
  Helper methods
  */
  dateFromISO(date:string){
    if(date){
      let date_parsed = new Date(date);
      return (date_parsed.getUTCDate()+1) +"/"+(date_parsed.getMonth()+1) + "/" + date_parsed.getFullYear();
    }else{
      return "-";
    }
  }
  dateFromISODetailed(date:string){
    if(date){
      let date_parsed = new Date(date);
      return (date_parsed.getDate()) +"/"+(date_parsed.getMonth()+1) + "/" + date_parsed.getFullYear() +"@" +date_parsed.getHours() + ":"+date_parsed.getMinutes();
    }else{
      return "-";
    }
  }  
  age_restriction_stringify(age_restriction){
    if(age_restriction==0){
      return "No Restriction";
    }else if(age_restriction==1){
      return "Adult & Young Adult Only"
    }else if(age_restriction==2){
      return "Adult Only"
    }
  }
  getStatusColor(rental){
    let status = rental.status;
    if(status=="overdue"){
      return "brown";
    }else if(status=="outstanding"){
      return "red";
    }else if(status=="lost"){
      return "black";
    } else if(status=="damaged"){
      return "black";
    }else{
      return "green";
    }
  }
  
  markAsReturned(){
    if(this.rentalSelect){
      this.mainService.rentalMarkAsReturned(this.rentalSelect.id).then((result)=>{
        if(result["response"]=="success"){
          alert("success!");          
          this.rentalSelect.status="returned";
        }else{
          alert(result["response"]);
        }
      });
    }
  }
  
  markAsLost(){
    if(this.rentalSelect){
      this.mainService.rentalMarkAsLost(this.rentalSelect.id).then((result)=>{
        if(result["response"]=="success"){
          alert("success!");
          this.rentalSelect.status="lost";
        }else{
          alert(result["response"]);
        }
      });
    }
  }
  markAsDamaged(){
    if(this.rentalSelect){
      this.mainService.rentalMarkAsDamaged(this.rentalSelect.id).then((result)=>{
        if(result["response"]=="success"){
          alert("success!");
          this.rentalSelect.status="damaged";
        }else{
          alert(result["response"]);
        }
      });
    }
  }
  viewAllOverDue(){
    
  }
  reportAllStock(){
    this.loading = true;
    this.mainService.reportAllStock().then((result)=>{
      if(result["response"]=="success"){
        alert("success");
      }else{
        alert(result["response"]);
      }
    });
    this.loading = false;
  }
}

