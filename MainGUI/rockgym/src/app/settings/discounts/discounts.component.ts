import { Component, OnInit } from '@angular/core';
import { MainService } from 'src/app/shared/main.service';

@Component({
  selector: 'app-discounts',
  templateUrl: './discounts.component.html',
  styleUrls: ['./discounts.component.css']
})
export class DiscountsComponent implements OnInit {
  loading:boolean = false;
  userData:any;
  filteredData:any[] = [];
  totalPage:number = 0;
  pageNum:number = 0;
  pageSize:number = 16;  
  searchPrompt:string = "";
  displayData:any = new Array(this.pageSize).fill(undefined);
  detailUser:any;
  showInActive:boolean = false;
  constructor(
    private mainService:MainService    
  ) { 
  }
  ngOnInit(): void {
    this.load();
  }
  handleShowInactive(){
    this.showInActive = !this.showInActive;
    this.load();
  }
  expandUser(user){
   this.detailUser = user;
  }
  handleKeyboardEvent(event:KeyboardEvent){
    if(event.key=="Enter"){
      this.search();
    }
  }  
  async load(){
    this.loading = true;
    this.getUserData();  
    this.loading = false;
  }
  async getUserData(){
    await this.mainService.getAllUsers().then(result=>{
      this.userData = result;
    });
    if(this.showInActive){
      this.filteredData = this.userData;
    }else{
      this.filteredData = this.userData.filter(user=>user.status!="inactive");
      
    }
    this.totalPage = Math.ceil(this.filteredData.length/10);    
    for(var i=0;i<this.pageSize;i++){
      this.displayData[i] = this.filteredData[i+this.pageNum*this.pageSize];      
    }
  }
  async deleteCustomer(){
    let confirmed = confirm("Are you sure to de-activate user "+ this.detailUser.firstName + " "+this.detailUser.lastName + "?")
    if(confirmed){
      await this.mainService.deleteMember(this.detailUser.id).then((result)=>{
        if(result=="success"){
          this.detailUser = undefined;
          this.load();
        }
      })
    }else{

    }
  }
  async activateCustomer(){
    let confirmed = confirm("Are you sure to activate user "+ this.detailUser.firstName + " "+this.detailUser.lastName + "?")
    if(confirmed){
      await this.mainService.deleteMember(this.detailUser.id).then((result)=>{
        if(result=="success"){
          this.detailUser = undefined;
          this.load();
        }
      })
    }else{

    }
  }
  search(){
    this.filteredData = this.userData.filter(      
      user=>user.firstName.includes(this.searchPrompt) ||
      user.lastName.includes(this.searchPrompt)
      );
      
    this.totalPage = Math.ceil(this.filteredData.length/10);
    for(var i=0;i<this.pageSize;i++){
      this.displayData[i] = this.filteredData[i+this.pageNum*this.pageSize];      
    }
  }
  previousPage(){
    if(this.pageNum!=0){
      this.pageNum -=1;
      for(var i=0;i<this.pageSize;i++){
        this.displayData[i] = this.filteredData[i+this.pageNum*this.pageSize];      
      }
    }
  }
  nextPage(){
    if(this.pageNum!=this.totalPage-1){
      this.pageNum +=1;  
      for(var i=0;i<this.pageSize;i++){
        this.displayData[i] = this.filteredData[i+this.pageNum*this.pageSize];      
      }
    }
  }
}
