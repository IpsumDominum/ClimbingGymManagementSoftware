import { Component, OnInit } from '@angular/core';
import { MainService } from 'src/app/shared/main.service';
import { StockChart } from 'angular-highcharts';

@Component({
  selector: 'app-invoices',
  templateUrl: './invoices.component.html',
  styleUrls: ['./invoices.component.css']
})
export class InvoicesComponent implements OnInit {
  loading:boolean = false;

  tab:string = "sales";

  totalPage:number = 0;
  pageNum:number = 0;
  pageSize:number = 20;  
  searchPrompt:string = "";
  
  detailUser:any;
  today = new Date();
  showInActive:boolean = false;

  salesData:any;
  invoiceData:any;

  filteredData:any[] = [];

  invoiceDisplayData:any = new Array(this.pageSize).fill(undefined);
  saleDisplayData:any = new Array(this.pageSize).fill(undefined);
  offset:number =0;
  queryDate:Date = new Date();
  resultDate:Date = new Date();

  stringDate:string ="";
  /* Charting */
  chart = new StockChart({
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
      text: 'Invoice History'
    },
    credits: {
      enabled: false
    },
    series: [
      {
        name: 'Suceeded',
        data: [[1293580800000,5],
        [1293667200000,200],
        [1293753600000,100], 
        [1294012800000, 47.08],
        [1294099200000, 47.33],
        [1294185600000, 47.71],
        [1294272000000, 47.68],
        [1294358400000, 48.02],
        [1294617600000, 48.92],
        [1294704000000, 48.81],
        [1294790400000, 49.20],
        [1294876800000, 49.38],
        [1294963200000, 49.78],
        [1295308800000, 48.66],
        [1295395200000, 48.41],
        [1295481600000, 47.53],
        [1295568000000, 46.67],
        [1295827200000, 48.21],
        [1295913600000, 48.77],
        [1296000000000, 49.12],
        [1296086400000, 49.03],
        [1296172800000, 48.01],
        [1296432000000, 48.47]],
        type:"line",
        color:"green"
      },{
        name: 'Failed',
        data: [[1293580800000,5*1.5],
        [1293667200000,200*2],
        [1293753600000,100*3], 
        [1294012800000, 47.08*5],
        [1294099200000, 47.33*1.2],
        [1294185600000, 47.71*5],
        [1294272000000, 47.68*1.5],
        [1294358400000, 48.02*1],
        [1294617600000, 48.92*5],
        [1294704000000, 48.81],
        [1294790400000, 49.20],
        [1294876800000, 49.38],
        [1294963200000, 49.78],
        [1295308800000, 48.66],
        [1295395200000, 48.41],
        [1295481600000, 47.53],
        [1295568000000, 46.67],
        [1295827200000, 48.21],
        [1295913600000, 48.77],
        [1296000000000, 49.12],
        [1296086400000, 49.03],
        [1296172800000, 48.01],
        [1296432000000, 48.47]],
        type:"line",
        color:"red"
      }

    ]
  });
  salesChart:any;
  constructor(
    private mainService:MainService    
  ) { 
    setInterval(() => {
      this.today = new Date();
    }, 1);
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
    await this.getUserData();  
    await this.getSalesData(this.queryDate);
    this.stringDate = this.stringDateFromObj(this.queryDate);
    let generated = [];
    for(var i=0;i<365;i++){
      generated.push([1293667200000+i*86400000,Math.pow(i,3)])
    }

    this.salesChart= new StockChart({
      chart: {
        type: 'line',      
      },   
      xAxis:{
        type:"datetime",
      },
      yAxis:{
        title:{
          text:"NZD"
        },
        labels:{
          format:"${value}"
        }
      },
      title: {
        text: 'Sale Amount'
      },
      credits: {
        enabled: false
      },
      series: [
        {
          name: 'Total Sale',
          data: generated,
          type:"line",
        },
      ]
    });
    this.loading = false;
  }
  async getUserData(){
    await this.mainService.getAllInvoices().then(result=>{
      this.invoiceData = result;
    });
    for(var i=0;i<this.invoiceData.length;i++){
      if(i<this.invoiceDisplayData.length){
        this.invoiceDisplayData[i] = this.invoiceData[i];
      }else{
        this.invoiceDisplayData.push(this.invoiceData[i]);
      }
    }
  }  
  async nextDay(){
    this.offset +=1;
    await this.getSalesData(this.queryDate);
  }

  async previousDay(){
    this.offset -=1;
    await this.getSalesData(this.queryDate);
  }
  async getSalesData(queryDate){    
    let date = {
      "year":queryDate.getFullYear(),
      "month":queryDate.getMonth()+1,
      "day":queryDate.getDate(),
      "offset":this.offset
    };

    await this.mainService.getSalesToday(date).then(result=>{

      let resultData = result["data"];

      this.resultDate = new Date(result["queryDate"]);

      this.stringDate = this.stringDateFromObj(this.resultDate);

      this.salesData = new Array(33).fill(undefined);

      if(this.salesData.length<=resultData.length){
        this.salesData = resultData.reverse();
      }else{
        for(var i=0;i<this.salesData.length;i++){
          if(i<resultData.length){
            this.salesData[i] = resultData[resultData.length-i-1];
          }else{
            break;
          }
        }
      }      
    });
  }
  async selectDate(event){
    let value = event["srcElement"]["value"];
    this.queryDate = this.parseStringDate(value);
    this.offset = 0;
    await this.getSalesData(this.queryDate);
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
  parseStringDate(date){
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
    this.filteredData = this.invoiceData.filter(      
      user=>user.firstName.includes(this.searchPrompt) ||
      user.lastName.includes(this.searchPrompt)
      );
      
    this.totalPage = Math.ceil(this.filteredData.length/10);
    for(var i=0;i<this.pageSize;i++){
      this.invoiceDisplayData[i] = this.filteredData[i+this.pageNum*this.pageSize];      
    }
  }
  previousPage(){
    if(this.pageNum!=0){
      this.pageNum -=1;
      for(var i=0;i<this.pageSize;i++){
        this.invoiceDisplayData[i] = this.filteredData[i+this.pageNum*this.pageSize];      
      }
    }
  }
  nextPage(){
    if(this.pageNum!=this.totalPage-1){
      this.pageNum +=1;  
      for(var i=0;i<this.pageSize;i++){
        this.invoiceDisplayData[i] = this.filteredData[i+this.pageNum*this.pageSize];      
      }
    }
  }

  buildName(name){
    return "";
  }
}
