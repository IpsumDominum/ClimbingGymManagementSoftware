import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from 'src/app/shared/auth.service';
import {AfterViewInit,ElementRef, ViewChild} from '@angular/core';
import { Route } from '@angular/compiler/src/core';
import { Router } from '@angular/router';
import { MainService } from 'src/app/shared/main.service';

@Component({
  selector: 'app-signin',
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.css']
})
export class SigninComponent implements OnInit {
  username:string="";
  password:string="";
  userId:string = "";
  loading:boolean = true;
  members:any = [];
  constructor(
    private authService:AuthService,
    private mainService:MainService,
    private route:Router
  ) { }
  ngOnInit(): void {
    this.load();
  }
  async load(){
    this.loading = true;
    //if(this.authService.is_authenticated()){
    //  this.route.navigateByUrl('main');
    //}
    await this.mainService.getAllUsers().then(result=>{
      this.members = result["data"];
    });
    this.loading = false;
  }
  async checkin(id){
    await this.mainService.checkIn(id).then((result)=>{
    });
  }

}
