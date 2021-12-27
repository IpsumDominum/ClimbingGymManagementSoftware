import { Component, OnInit } from '@angular/core';
import { StockChart } from 'angular-highcharts';
import { MainService } from 'src/app/shared/main.service';


@Component({
  selector: 'app-accounting',
  templateUrl: './accounting.component.html',
  styleUrls: ['./accounting.component.css']
})
export class AccountingComponent implements OnInit {
  loading:boolean = false;
  

  today = new Date();

  invoiceData:any;

  filteredData:any[] = [];

  /*invoiceDisplayData:any = new Array(this.pageSize).fill(undefined);*/
  

  
  constructor(
    private mainService:MainService
  ) { 
  }  
  ngOnInit(): void {
    this.load();
  }

  async load(){
    /*pass*/
  }

}