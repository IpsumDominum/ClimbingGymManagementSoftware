import { Component, OnInit } from '@angular/core';
import { MainService } from 'src/app/shared/main.service';
import { StockChart } from 'angular-highcharts';
import { chart, color } from 'highcharts';
import { CalendarOptions,Calendar } from '@fullcalendar/angular'; // useful for typechecking
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
@Component({
  selector: 'app-logs',
  templateUrl: './logs.component.html',
  styleUrls: ['./logs.component.css']
})
export class LogsComponent implements OnInit {
  loading:boolean = false;
  calendarOptions: CalendarOptions = {
    initialView: 'dayGridMonth',
    height:'380px',
  };
  events:any[] = [
    {
      start: '2021-6-6T10:00:00',
      end: '2021-7-6T16:00:00',
      display: 'background'
    }
  ]
  tab:string = "sales";

  totalPage:number = 0;
  pageNum:number = 0;
  pageSize:number = 20;  
  searchPrompt:string = "";

  detailUser:any;
  today = new Date();
  showInActive:boolean = false;

  salesData:any;
  logData:any;

  filteredData:any[] = [];

  logDisplayData:any = new Array(this.pageSize).fill(undefined);
  offset:number =0;
  queryDate:Date = new Date();
  resultDate:Date = new Date();
  lookUpKey:string = "Common";
  stringDate:string ="";

  showChart:string = "error";

  /* Charting */
  chart:any;
  salesChart:any;

  autoRefreshInterval:any;
  currentRoute:string;
  dailyCheckProgress = 0;
  constructor(
    private router:Router,
    private mainService:MainService,
    private route:ActivatedRoute
  ) { 
    router.events.pipe(
			filter(event => event instanceof NavigationEnd),
		).subscribe(event=>
           {
      let query_date = this.route.snapshot.queryParamMap.get('query_date');
      if(query_date){
        this.queryDate = this.parseStringDate(query_date);
      }      
			this.currentRoute = event["url"];
			if(this.currentRoute.split("/")[1]!="main"){
				clearInterval(this.autoRefreshInterval);
			}
		   }
		);
  }  

  ngOnInit(): void {
    this.autoRefreshInterval = setInterval(() => {
        this.mainService.getDailyCheckProgress().then((result)=>{
          if(result["response"]!="success"){
            clearInterval(this.autoRefreshInterval);
            alert(result["response"]);
          }else{
            this.dailyCheckProgress = result["recurring_progress"]
            console.log(result["recurring_progress"]);
          }
        });
        //this.getLogs(this.queryDate);
		  }, 500);
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
    this.getChecks();
    this.getLogs(this.queryDate);
    this.stringDate = this.stringDateFromObj(this.queryDate);
    this.loading = false;
  }
  
  async nextDay(){
    this.offset +=1;
    await this.getLogs(this.queryDate);
  }

  async previousDay(){
    this.offset -=1;
    await this.getLogs(this.queryDate);
  }
  async getChecks(){
    await this.mainService.getSystemChecks().then((result:any[])=>{
      let errorData = [];
      let timeData = [];
      let eventsData = [];
      result.forEach(item => {
        errorData.push([item.checked_date,item.error_amount]);
        timeData.push([item.checked_date,item.time_taken]);
        eventsData.push({          
            start: item.checked_date_format,
            end:item.checked_date_format ,
            overlap: false,
            color: item.error_amount >0 ? 'ff9f89' : '',
            display:'background'}
        );
        if(item.error_amount!=0){
          eventsData.push({
            title:"has Errors",        
            start: item.checked_date_format,
            end:item.checked_date_format ,
            overlap: false,
            color:'#fc5000',
            url:"/admin/daily-logs?query_date="+item.checked_date_format,
          });
        }
      });
  var calendarEl = document.getElementById("calendar");
  var calendar = new Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    height:'332px',    
    headerToolbar: {
      left: 'title',
      center: '',
      right: 'today prev,next'
    },
    initialDate: '2021-06-12',
    events: eventsData
  });
  calendar.render();

      this.chart = new StockChart({
        rangeSelector: {
          selected: 1
        },
        yAxis:{
          title:{
            text:"Amount"
          },
          labels:{
            format:"{value}"
          }
        },
        title: {
          text: 'Errors from daily checks'
        },
        credits: {
          enabled: false
        },
        series: [
         {
            name: 'Errors',
            data: errorData,
            type:"line",
            color:"red"
          }
        ]
      });
      this.salesChart= new StockChart({
        chart: {
          type: 'line',      
        },   
        xAxis:{
          type:"datetime",
        },
        yAxis:{
          title:{
            text:"time(seconds)"
          },
          labels:{
            format:"{value}s"
          }
        },
        title: {
          text: 'Time taken to do daily check'
        },
        credits: {
          enabled: false
        },
        series: [
          {
            name: 'time(seconds)',
            data: timeData,
            type:"line",
          },
        ]
      });
    })
  }
  async triggerDailyCheck(){
    this.mainService.triggerDailyCheck().then(result=>{
      if(result["response"]=="success"){
        this.getChecks();
        this.getLogs(this.queryDate);
      }else{
        alert(result["response"]);
      }
    });
  }
  async getLogs(queryDate){    
    let date = {
      "year":queryDate.getFullYear(),
      "month":queryDate.getMonth()+1,
      "day":queryDate.getDate(),
      "offset":this.offset
    };
    await this.mainService.getSystemLogs(date).then(result=>{
      let resultData = result["data"];

      this.resultDate = new Date(result["queryDate"]);

      this.stringDate = this.stringDateFromObj(this.resultDate);

      this.logData = resultData;
    });
    //this.searchPrompt = "";
    this.search();
  }
  async selectDate(event){
    let value = event["srcElement"]["value"];
    this.queryDate = this.parseStringDate(value);
    this.offset = 0;
    await this.getLogs(this.queryDate);
  }
  stringDateFromObj(date_obj){
    let month_string = (date_obj.getMonth()+1).toString();
    if(month_string.length==1){
      month_string = "0" + month_string;
    }
    let date_string = (date_obj.getDate()).toString();
    if(date_string.length==1){
      date_string = "0" + date_string;
    }
    let string_date = date_obj.getFullYear()+"-" +month_string+"-"+ date_string;
    return string_date;
  }
  parseStringDate(date):Date{
    let tokens = date.split("-");
    let date_obj = new Date(Number.parseInt(tokens[0]),Number.parseInt(tokens[1])-1,Number.parseInt(tokens[2]));
    return date_obj;
} 

  parseISODate(isoDate){
    let parsed = new Date(isoDate);
    return (parsed.getUTCDate()+1).toString() + "/" +
          (parsed.getUTCMonth()+1).toString() + "/" +
          parsed.getUTCFullYear().toString() + " ";;
  }
  search(){
    
    this.filteredData = this.logData.filter(      
      log=>
      (log.log_message ? log.log_message.includes(this.searchPrompt):false) ||
      (log.log_type ? log.log_type.includes(this.searchPrompt) : false)
      || (log.log_status ? log.log_status.includes(this.searchPrompt) : false)
    );
    
    this.totalPage = Math.ceil(this.filteredData.length/10);
    this.logDisplayData = new Array(this.pageSize).fill(undefined);
    for(var i=0;i<this.filteredData.length;i++){
      if(i<this.logDisplayData.length){
        this.logDisplayData[i] = this.filteredData[i+this.pageNum*this.pageSize];
      }else{
        this.logDisplayData.push(this.filteredData[i+this.pageNum*this.pageSize]);
      }
    }
  }
  previousPage(){
    if(this.pageNum!=0){
      this.pageNum -=1;
      for(var i=0;i<this.pageSize;i++){
        this.logDisplayData[i] = this.filteredData[i+this.pageNum*this.pageSize];      
      }
    }
  }
  nextPage(){
    if(this.pageNum!=this.totalPage-1){
      this.pageNum +=1;  
      for(var i=0;i<this.pageSize;i++){
        this.logDisplayData[i] = this.filteredData[i+this.pageNum*this.pageSize];      
      }
    }
  }

  buildName(name){
    return "";
  }
}
