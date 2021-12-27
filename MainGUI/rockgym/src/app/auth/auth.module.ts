import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SigninComponent } from './signin/signin.component';
import { SignupComponent } from './signup/signup.component';
import { AuthRoutingModule } from './auth-routing.module';
import {HttpClientModule} from '@angular/common/http';
import { SharedModule } from '../shared/shared.module';
import { FormsModule } from '@angular/forms';


@NgModule({
  declarations: [SigninComponent, SignupComponent],
  imports: [
    CommonModule,
    AuthRoutingModule,
    HttpClientModule,
    SharedModule,
    FormsModule
  ]
})
export class AuthModule { }
