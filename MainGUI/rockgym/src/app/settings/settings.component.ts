import { Component } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { MainService } from '../shared/main.service';

@Component({
	selector: 'app-main',
	templateUrl: './settings.component.html',
	styleUrls: ['./settings.component.css'],	
})
export class SettingsComponent {
	menuOpen:boolean = false;
	currentRoute:string;
	today:Date = new Date;

	offset:number = 0;
	stringDate:string = "";
	pageSize:number = 3;
	totalPage:number = 0;
	currentPage:number = 0;
	totalAmount:number = 0;
	firstLoad:boolean = true;
	checkinData:any = new Array(this.pageSize).fill(undefined);
	autoRefreshInterval:any;
	constructor(
		private router:Router,
		private mainService:MainService
	) {
		router.events.pipe(
			filter(event => event instanceof NavigationEnd),
		).subscribe(event=>
           {
			this.currentRoute = event["urlAfterRedirects"];
			if(this.currentRoute.split("/")[1]!="management"){
				clearInterval(this.autoRefreshInterval);
			}
		   }
		);
    }
	ngOnInit(): void {
		this.autoRefreshInterval = setInterval(() => {
			this.today = new Date();
			let data = {
				"queryDate":this.stringDate,
				"offset":this.offset,
				"currentPage":this.currentPage,
				"pageSize":this.pageSize
			  };
			  /*
			  this.checkinData.forEach(ele => {
				  if(ele){
					if(ele["timed"]>200){
						ele["timed"] -= 10;
					}else{
						ele["timed"] = 0;
					}
				  }
			  });
			  */
			this.getCheckInData(data);
		  }, 500);
	}
	putIntoCheckInData(data){
		data.reverse().forEach(ele => {
			if(this.checkinData.find(el=> el ? el.id.slice(0,4)===ele.id.slice(0,4) :false)==undefined){
				//If not already considered, append.
				if(this.firstLoad){
					ele["timed"] = 0;
				}else{
					ele["timed"] = 1000;	
				}
				for(var i=this.pageSize-1;i>0;i--){
					this.checkinData[i] = this.checkinData[i-1];
				}
				this.checkinData[0] = ele;
			}else{
				//pass
			}
		});
		if(this.firstLoad){
			this.firstLoad = false;
		}
		/*
		this.checkinData.forEach(ele => {
			console.log(ele.member.firstName + " | "+ele.id);
		});
		console.log("====================");
		*/
	}
	async getCheckInData(data){
		//this.checkinData = new Array(this.pageSize).fill(undefined);
		await this.mainService.getAllCheckins(
		  data      
		).then((result)=>{
		  this.totalAmount = result["total_amount"];
		  this.totalPage = result["total_pages"];
		  if(this.totalPage==0){
			this.currentPage = 0;
		  }else{
			this.currentPage = result["current_page"];
		  }
		  this.stringDate = result["query_date"];
		  this.offset = 0;
		  this.putIntoCheckInData(result["data"]);
		});     
	  }
	openPOSMember(member_id){
		this.router.navigateByUrl("/main/pos?climber="+member_id);
	}
	closeMenu(){
		this.menuOpen = false;
	}
	openMenu(){
		this.menuOpen = true;
	}

}