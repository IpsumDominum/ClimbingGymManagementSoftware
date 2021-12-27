import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthComponent } from './auth/auth.component';
import { MainComponent } from './main/main.component';
import { SettingsComponent } from './settings/settings.component';
import { DataComponent } from './data/data.component';
import { AdminComponent } from './admin/admin.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'admin',
    pathMatch: 'full'
  },
	{
		path: 'auth',
		component: AuthComponent,
		loadChildren: () => import('./auth/auth.module').then((m) => m.AuthModule)
  },
  {
		path: 'main',
		component: MainComponent,
		loadChildren: () => import('./main/main.module').then((m) => m.MainModule)
  },
  {
		path: 'management',
		component: SettingsComponent,
		loadChildren: () => import('./settings/settings.module').then((m) => m.SettingsModule)
  },
  {
		path: 'data',
    component: DataComponent,
		loadChildren: () => import('./data/data.module').then((m) => m.DataModule)
  },
  {
		path: 'admin',
    component: AdminComponent,
		loadChildren: () => import('./admin/admin.module').then((m) => m.AdminModule)
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
