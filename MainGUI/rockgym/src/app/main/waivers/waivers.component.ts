import { Component, OnInit, EventEmitter } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MainService } from 'src/app/shared/main.service';


@Component({
  selector: 'app-waivers',
  templateUrl: './waviers.component.html',
  styleUrls: ['./waivers.component.css']
})
export class WaiversComponent implements OnInit {
  today:Date = new Date();
  loading:boolean =false;
  openTempWaiverDetails: EventEmitter<any> = new EventEmitter();
  openConvertToCustomer: EventEmitter<any> = new EventEmitter();

  waiverTempDisplayData:any = new Array(7).fill(undefined);
  waiverFetchLogDisplayData:any = new Array(7).fill(undefined);

  openedIdx:any;
  
  constructor(
    private mainService:MainService,
    private router:Router
  ) { }

  ngOnInit(): void {
    this.load();
  }
  async load(){
    //await this.fetchNewWaivers(false);
    this.loading = true;    
    this.waiverTempDisplayData = new Array(7).fill(undefined);
    this.waiverFetchLogDisplayData = new Array(7).fill(undefined);
    await this.mainService.getTempWaivers().then((result)=>{
      if(result["response"]=="success"){
        for(var i=0;i<result["data"].length;i++){
          if(i < this.waiverTempDisplayData.length){
            this.waiverTempDisplayData[i] = result["data"][i];
          }else{
            this.waiverTempDisplayData.push(result["data"][i]);
          }
        }    
      }      
    });
    
    await this.mainService.getWaiverFetchLogs().then((result)=>{
      if(result["response"]=="success"){
        for(var i=0;i<result["data"].length;i++){
          if(i < this.waiverFetchLogDisplayData.length){
            this.waiverFetchLogDisplayData[i] = result["data"][i];
          }else{
            this.waiverFetchLogDisplayData.push(result["data"][i]);
          }
        }
      }      
    });    
    this.loading = false;
  }
async markAsSolved(id){
  let confirmation = confirm("Are you sure?");
  if(confirmation!=true){
    return;
  }
  await this.mainService.markWaiverTempAsSolved(id).then((result)=>{
    if(result=="success"){
      alert("success");
      this.load();
    }else{
      alert(result);
    }
  });
}
async markAllAsSolved(){
  let confirmation = confirm("Are you sure?");
  if(confirmation!=true){
    return;
  }
  await this.mainService.markWaiverTempAsSolved("all").then((result)=>{
    if(result=="success"){
      alert("success");
      this.load();
    }else{
      alert(result);
    }
  });
}
  async fetchNewWaivers(load){
    this.loading = true;
    await this.mainService.fetchNewWaivers().then((result)=>{
      if(result=="success"){
        if(load){
          this.load();
        }
      }else{
        alert(result);
      }
    });
  this.loading = false;
}

openConvertToCustomerModal(waiverTemp,idx){
  this.openedIdx = idx;
  let data = {
    ...waiverTemp,
    "index":idx
  }
  this.openConvertToCustomer.emit(data);
}
handleConverted(data){
  this.markAsSolved(data["waiver"].id);
  this.router.navigateByUrl("/main/pos?climber="+data["member_id"]);
}

  dateFromISODetailed(date:string){
    if(date){
      let date_parsed = new Date(date);
      return (date_parsed.getUTCDate()) +"/"+(date_parsed.getMonth()+1) + "/" + date_parsed.getFullYear() +"@" +date_parsed.getHours() + ":"+date_parsed.getUTCMinutes();
    }else{
      return "-";
    }
  }  
  calcAge(birthday){
    let date = new Date(birthday)
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
        return year_diff;
    }

    alert_check(data){
      let message = data["message"];
      let idx = data["idx"];
      if(idx==this.openedIdx){
        alert(message);
      }
      
    }
}
