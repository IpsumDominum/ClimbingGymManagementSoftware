import { Component } from '@angular/core';

@Component({
	selector: 'app-data',
	template: `		
	<style>
	a{
		font-family:'grifter';
		font-size:20px;
	}
	a:hover{
		color:#CC5500;
	}
	.menu{
		position:absolute;
		top:-60px !important;
		background:white;
		border:black solid 1px;
		width:200px;
		height:250px;
		right:0px;
		z-index:50;
		padding-right:20px;
		border-radius:50px;
		padding-top:50px;
		display:flex;
		flex-direction:column;
		box-shadow: 0 2px 6px rgba(0,0,0,0.5), inset 0 1px rgba(255,255,255,0.3), inset 0 10px rgba(255,255,255,0.2), inset 0 10px 20px rgba(255,255,255,0.25), inset 0 -15px 30px rgba(0,0,0,0.3) !important;
	-o-box-shadow: 0 2px 6px rgba(0,0,0,0.5), inset 0 1px rgba(255,255,255,0.3), inset 0 10px rgba(255,255,255,0.2), inset 0 10px 20px rgba(255,255,255,0.25), inset 0 -15px 30px rgba(0,0,0,0.3) !important;
	-webkit-box-shadow: 0 2px 6px rgba(0,0,0,0.5), inset 0 1px rgba(255,255,255,0.3), inset 0 10px rgba(255,255,255,0.2), inset 0 10px 20px rgba(255,255,255,0.25), inset 0 -15px 30px rgba(0,0,0,0.3) !important;
	-moz-box-shadow: 0 2px 6px rgba(0,0,0,0.5), inset 0 1px rgba(255,255,255,0.3), inset 0 10px rgba(255,255,255,0.2), inset 0 10px 20px rgba(255,255,255,0.25), inset 0 -15px 30px rgba(0,0,0,0.3) !important;	
	}
	.menuClosed{
		position:absolute;
		right:0px;
		top:-80px;
		z-index:5;
	}
	button{
		padding-top:100px;
		padding-right:20px;
		border-radius:50px !important;
		background:white !important;
		box-shadow: 0 2px 6px rgba(0,0,0,0.5), inset 0 1px rgba(255,255,255,0.3), inset 0 10px rgba(255,255,255,0.2), inset 0 10px 20px rgba(255,255,255,0.25), inset 0 -15px 30px rgba(0,0,0,0.3) !important;
	-o-box-shadow: 0 2px 6px rgba(0,0,0,0.5), inset 0 1px rgba(255,255,255,0.3), inset 0 10px rgba(255,255,255,0.2), inset 0 10px 20px rgba(255,255,255,0.25), inset 0 -15px 30px rgba(0,0,0,0.3) !important;
	-webkit-box-shadow: 0 2px 6px rgba(0,0,0,0.5), inset 0 1px rgba(255,255,255,0.3), inset 0 10px rgba(255,255,255,0.2), inset 0 10px 20px rgba(255,255,255,0.25), inset 0 -15px 30px rgba(0,0,0,0.3) !important;
	-moz-box-shadow: 0 2px 6px rgba(0,0,0,0.5), inset 0 1px rgba(255,255,255,0.3), inset 0 10px rgba(255,255,255,0.2), inset 0 10px 20px rgba(255,255,255,0.25), inset 0 -15px 30px rgba(0,0,0,0.3) !important;
	}
	img{
		width:100px;
		height:100px;
	}
	.cancel{
		position:absolute;
		margin-left:150px;
		margin-top:20px;
		font-size:25px;
	}
	.cancel:hover{
		color:#CC5500;
	}
	</style>
	<ng-container *ngIf="menuOpen;else notOpen">
	<div class="menu">
	<a (click)="closeMenu()" class="cancel">X</a>
	<br><br>
	<a style="color:#CC5500;" [routerLink]="['/data']"> Data </a> 
	<br><br>
	<a [routerLink]="['/management']"> Management </a> 
	<br>
	<br>
	<a   [routerLink]="['/main']"> Main Functions </a>
	<br>
	<br>
	<a  [routerLink]="['/auth/signin']"> Log off</a>
	</div>
	</ng-container>
	<ng-template #notOpen>
	<div (click)="openMenu()" class="menuClosed">
		<button><img src="assets/logo.png"> </button>
	</div>
	
	</ng-template>
	<router-outlet></router-outlet> 
	`
})
export class DataComponent {
	menuOpen:boolean = false;
	constructor() {}

	closeMenu(){
		this.menuOpen = false;
	}
	openMenu(){
		this.menuOpen = true;
	}

}