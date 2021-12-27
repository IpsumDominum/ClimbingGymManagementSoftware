import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MainService } from 'src/app/shared/main.service';

@Component({
  selector: 'app-checkin',
  templateUrl: './checkin.component.html',
  styleUrls: ['./checkin.component.css']
})
export class CheckinComponent implements OnInit{
  today:Date = new Date();

  pageSize:number = 6;
  displayData:any = new Array(this.pageSize).fill(undefined);

  loading:boolean = false;

  time:number = 0;

  offset:number = 0;
  stringDate:string = "";

  totalPage:number = 0;
  currentPage:number = 0;
  totalAmount:number = 0;

  checkInId:string = "";
  autoRefresh:boolean = false;
  autoRefreshInterval:any;

  queryMode = "onDate";

  constructor(
    private mainService:MainService,
    private router:Router
  ) {  
    router.events.subscribe((val)=>{
    clearInterval(this.autoRefreshInterval);
    })
   }

  async ngOnInit(){    
      await this.load();    
  }

  async load(){
    this.loading = true;
    // this.checkInId = ""
    let data = {
      "queryDate":this.stringDate,
      "offset":this.offset,
      "currentPage":this.currentPage,
      "pageSize":this.pageSize,
      "queryMode":this.queryMode
    };
    await this.getCheckInData(data);
    this.loading = false;
  }
  async export_to_csv(){
    let data = {
      "queryDate":this.stringDate,
      "offset":this.offset,
      "currentPage":1,
      "pageSize":this.pageSize,
      "queryMode":this.queryMode,
      "export":true
    };
    await this.getCheckInData(data);
  }
  async nextDay(){
    this.offset +=1;
    let data = {
      "queryDate":this.stringDate,
      "offset":this.offset,
      "currentPage":1,
      "pageSize":this.pageSize,
      "queryMode":this.queryMode
    };
    await this.getCheckInData(data);
  }
  async filterByOnDate(){
    this.queryMode = "onDate";
    let data = {
      "queryDate":this.stringDate,
      "offset":this.offset,
      "currentPage":1,
      "pageSize":this.pageSize,
      "queryMode":this.queryMode
    };
    await this.getCheckInData(data);
  }
  async filterBySinceDate(){
    this.queryMode = "sinceDate";
    let data = {
      "queryDate":this.stringDate,
      "offset":this.offset,
      "currentPage":1,
      "pageSize":this.pageSize,
      "queryMode":this.queryMode
    };
    await this.getCheckInData(data);
  }
  async previousDay(){
    this.offset -=1;
    let data = {
      "queryDate":this.stringDate,
      "offset":this.offset,
      "currentPage":1,
      "pageSize":this.pageSize,
      "queryMode":this.queryMode
    };
    await this.getCheckInData(data);
  }
  async selectDate($event){
    this.stringDate = $event.target.value;
    this.offset = 0;
    let data = {
      "queryDate":this.stringDate,
      "offset":this.offset,
      "currentPage":1,
      "pageSize":this.pageSize,
      "queryMode":this.queryMode
    };
    await this.getCheckInData(data);
  }
  async getCheckInData(data){      
    this.loading= true;
    this.displayData = new Array(this.pageSize).fill(undefined);
    await this.mainService.getAllCheckins(
      data      
    ).then((result)=>{
      if(result["csv_exported"]){
        alert(result["response"]);  
      }
      
      this.totalAmount = result["total_amount"];
      this.totalPage = result["total_pages"];
      if(this.totalPage==0){
        this.currentPage = 0;
      }else{
        this.currentPage = result["current_page"];
      }
      this.stringDate = result["query_date"];
      this.offset = 0;
      this.insertIntoPlaceHolderArray(this.displayData,result["data"]);
      this.loading = false;
    });     
  }

  async previousPage(){
    if(this.currentPage <=1){
      if(this.totalPage==0){
        this.currentPage = 0;
      }else{
        this.currentPage = 1;
      }
      return;
    }else{
      let data = {
        "queryDate":this.stringDate,
        "offset":this.offset,
        "currentPage":this.currentPage -1,
        "pageSize":this.pageSize,
        "queryMode":this.queryMode
      };
      await this.getCheckInData(data);
    }
  }
  async nextPage(){
    if(this.currentPage >=this.totalPage){
      this.currentPage = this.totalPage;
      return;
    }else{
      let data = {
        "queryDate":this.stringDate,
        "offset":this.offset,
        "currentPage":this.currentPage +1,
        "pageSize":this.pageSize,
        "queryMode":this.queryMode
      };
      await this.getCheckInData(data);
    }
  }
   toggleAutoRefresh($event){
    if(this.autoRefresh==false){
      this.autoRefreshInterval = setInterval(() => {
        this.today = new Date();
        if(this.loading ==false){
          this.load();
        }
      }, 1000);
     }else{
      clearInterval(this.autoRefreshInterval);
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
  dateFromISODetailed(date:string){
    if(date){
      let date_parsed = new Date(date);
      return (date_parsed.getUTCDate()) +"/"+(date_parsed.getMonth()+1) + "/" + date_parsed.getFullYear() +"@" +date_parsed.getHours() + ":"+date_parsed.getMinutes();
    }else{
      return "-";
    }
  }  
  dateFromISO(date:string){
    if(date){
      let date_parsed = new Date(date);
      return (date_parsed.getUTCDate()) +"/"+(date_parsed.getMonth()+1) + "/" + date_parsed.getFullYear();
    }else{
      return "-";
    }
  }
  isBirthday(birthday){
      let date = new Date(birthday);
      let month_diff = this.today.getMonth() - date.getMonth();
      let day_diff = this.today.getUTCDate() - date.getUTCDate()-1;        
      if(month_diff==0 && day_diff==0){
        return true;
      }else{
        return false;
      }
  }
  getAgeGroup(customer){
    if(customer.birthday){
      let date = new Date(customer.birthday);
      let year_diff = this.today.getFullYear() - date.getFullYear();
      let month_diff = this.today.getMonth() - date.getMonth();
      if(month_diff>0){
      }else if(month_diff==0){
        let day_diff = this.today.getUTCDate() - date.getUTCDate();        
        if(day_diff >=0){
        }else{
          year_diff -=1;
        }
      }else{
        year_diff -=1;
      }
      if(year_diff<13){
        return "Child"
      }else if(year_diff>=13 && year_diff <18){
        return "Young Adult"
      }else{
        return "Adult"
      }
    }else{
      return "-";
    }
  }
  async handleFobRead(event:KeyboardEvent){
    if(event.key=="Enter"){      
      await this.mainService.checkIn(this.checkInId).then((result)=>{
          if(result["response"]=="success"){
            this.load();
          }else{
            alert(result["response"]);
          }
          this.checkInId = "";
      });
    }
  } 
  openPOSMember(member_id){
		this.router.navigateByUrl("/main/pos?climber="+member_id);
	}
  async revoke(checkin){
    await this.mainService.revokeCheckIn(checkin.id).then((result)=>{
      if(result["response"]=="success"){
        this.load();
      }else{
        alert(result["response"]);
      }
    });
  }
  
}
