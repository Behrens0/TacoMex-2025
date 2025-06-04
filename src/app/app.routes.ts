import { provideRouter, Routes } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { SplashPage } from './splash/splash.page';


export const routes: Routes = [
  {
    path: '',
    component: SplashPage
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then(m => m.LoginPage)
  },
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then(m => m.HomePage)
  },
];


export const appConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient()
  ]};