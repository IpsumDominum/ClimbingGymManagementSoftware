import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {DataService} from './data.service';
import { BehaviorSubject, from, Observable, of } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(
    private http:HttpClient,
    private dataService:DataService
  ) { }

  async signin(username,password){
    return await this.dataService.post('signin',
    {username:username,password:password},false).then(data=>{
      if(data['access_token']){
          //Got the data       
          sessionStorage.setItem('resistance', data['access_token']);
          sessionStorage.setItem('refresh', data['refresh_token']);
          return new Promise(resolve=>resolve("success"));
        }else if(data=="Invalid password"){
            alert("Invalid Password Or Username");
        }else{
          alert(data);
        }
    });
  } 
  is_authenticated(){
    if(sessionStorage.getItem('resistance')!=undefined){
      return true;
    }else{
      return false;
    }
  }
  get_token(){
    if(this.is_authenticated()){
      return sessionStorage.getItem('resistance');
    }else{
      return null;
    }
  }

}
