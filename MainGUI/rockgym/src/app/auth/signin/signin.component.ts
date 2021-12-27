import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from 'src/app/shared/auth.service';
import {AfterViewInit,ElementRef, ViewChild} from '@angular/core';
import { Route } from '@angular/compiler/src/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-signin',
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.css']
})
export class SigninComponent implements OnInit {
  username:string="";
  password:string="";

  loading:boolean = true;
  constructor(
    private authService:AuthService,
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
    this.loading = false;
  }
  async signin(){
      if(this.loading==false){
        await this.authService.signin(this.username,this.password).then((result)=>{
          if(result=="success"){
            localStorage.setItem("recentItems",JSON.stringify([]));
            this.route.navigateByUrl('main');
          }else{
   
          }
        });
    }
  }
}
