import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders} from '@angular/common/http';
import { tap,catchError} from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class DataService {
    httpOptions:any = {
        headers: new HttpHeaders(
            { 'Content-Type': 'application/json' }
            )
    };
    baseUrl:string  = "http://127.0.0.1:5000/";
  constructor(
    private http:HttpClient
  ) {}

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
  async get(url,authenticationNeeded){
    if(!authenticationNeeded){
      return this.http.get(this.baseUrl+url,
        this.httpOptions)
      .toPromise().catch(
        error=>{
          console.error(error);
          return of(null);
      });
    }else{
      if(!this.is_authenticated()){
        return;
      }
      let authenticationOptions = {
        headers: new HttpHeaders(
          { 'Content-Type': 'application/json',          
            'Authorization' : "Bearer " +this.get_token()}
          )
      }
      return this.http.get(this.baseUrl+url,
        authenticationOptions)
      .toPromise().catch(
        error=>{
          console.error(error);
          return of(null);
      });
    }
  }
  async delete(url,authenticationNeeded){
    if(!authenticationNeeded){
      return this.http.delete(this.baseUrl+url,
        this.httpOptions)
      .toPromise().catch(
        error=>{
          console.error(error);
          return of(null);
      });
    }else{
      if(!this.is_authenticated()){
        return;
      }
      let authenticationOptions = {
        headers: new HttpHeaders(
          { 'Content-Type': 'application/json',          
            'Authorization' : "Bearer " +this.get_token()}
          )
      }
      return this.http.delete(this.baseUrl+url,
        authenticationOptions)
      .toPromise().catch(
        error=>{
          console.error(error);
          return of(null);
      });
    }
  }
  async post(url,body,authenticationNeeded){
    if(!authenticationNeeded){
      return this.http.post(this.baseUrl+url,
        JSON.stringify(body),this.httpOptions)
        .toPromise().catch(error=>{
          return error.toPromise();
        });
    }else{
      if(!this.is_authenticated()){
        return;
      }
      let authenticationOptions = {
        headers: new HttpHeaders(
          { 'Content-Type': 'application/json',
            'Authorization' : "Bearer " + this.get_token()}
          )
      }
      return this.http.post(this.baseUrl+url,
        JSON.stringify(body),authenticationOptions)
        .toPromise().catch(error=>{
          return error.toPromise();
        });
    }
  }
  async postRemote(url,body,authenticationNeeded){
    if(!authenticationNeeded){
      return this.http.post(url,
        JSON.stringify(body),this.httpOptions)
        .toPromise().catch(error=>{
          return error.toPromise();
        });
    }else{
      if(!this.is_authenticated()){
        return;
      }
      let authenticationOptions = {
        headers: new HttpHeaders(
          { 'Content-Type': 'application/json',
            'Authorization' : "Bearer " + this.get_token()}
          )
      }
      return this.http.post(url,
        JSON.stringify(body),authenticationOptions)
        .toPromise().catch(error=>{
          return error.toPromise();
        });
    }
  }
}
