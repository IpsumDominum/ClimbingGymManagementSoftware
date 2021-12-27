import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MainService } from 'src/app/shared/main.service';

@Component({
  selector: 'app-alerts',
  templateUrl: './alerts.component.html',
  styleUrls: ['./alerts.component.css']
})
export class AlertsComponent implements OnInit {
  loading:boolean = false;
  today = new Date();
  displayData:any = new Array(13).fill(undefined);
  time:number = 0;
  constructor(
    private mainService:MainService,
    private router:Router
  ) { 

  }
  async ngOnInit(){
    this.loading = true;
    await this.load();
    this.loading = false;
  }
  async load(){   
    this.displayData = new Array(13).fill(undefined);
    await this.mainService.getAllAlerts().then((result)=>{
      this.insertIntoPlaceHolderArray(this.displayData,result);
    });     
  }
  async insertIntoPlaceHolderArray(placeHolderArray,array){
    for(var i=0;i<array.length;i++){      
      if(array[i].member_associated!=""){
        await this.mainService.getMember(array[i].member_associated).then((result)=>{
          if(result["response"]=="success"){
            array[i].member = result["member"];
          }else{
            alert(result["response"]);
          }
        });
      }else{
        array[i].member = {"firstName":"","lastName":""};
      }
      if(i<placeHolderArray.length){
        placeHolderArray[i] = array[i];        
      }else{
        placeHolderArray.push(array[i]);
      }
    }
    return placeHolderArray;
  }
  getColor(alert_level){
    if(alert_level==1){
      return "brown";
    }
    else if(alert_level==2){
      return "orange";
    }
    else if(alert_level==3){
      return "red";
    }
  }
  jumpToMembership(member){
    if(member){
      this.router.navigateByUrl("/management/membership?member_search="+member.firstName+" "+member.lastName);
    }
  }
  markAlertAsSolved(alert_ref){
    this.mainService.markAlertAsSolved(alert_ref.id).then((result)=>{
      let confirmation= confirm("are you sure to mark this alert as solved?");
      if(confirmation){
        alert(result);
        this.load();
      }
    });
  }
}
