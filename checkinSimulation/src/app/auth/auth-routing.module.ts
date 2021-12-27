import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SigninComponent } from './signin/signin.component';

const authRoutes: Routes = [
	{
		path: '',
		redirectTo: 'checkin-simulation',
		pathMatch: 'full'
	},
	{
		path: 'checkin-simulation',
		component: SigninComponent
	},
];

@NgModule({
	imports: [RouterModule.forChild(authRoutes)],
	exports: [RouterModule]
})
export class AuthRoutingModule {}