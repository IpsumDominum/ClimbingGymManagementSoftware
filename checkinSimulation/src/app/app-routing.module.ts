import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthComponent } from './auth/auth.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'checkinsimulation',
    pathMatch: 'full'
  },
	{
		path: 'checkinsimulation',
		component: AuthComponent,
		loadChildren: () => import('./auth/auth.module').then((m) => m.AuthModule)
  },

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
