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
    loadComponent: () => import('./componentes/login/login.page').then(m => m.LoginPage)
  },
  {
    path: 'home',
    loadComponent: () => import('./componentes/home/home.page').then(m => m.HomePage)
  },
    {
    path: 'registro',
    loadComponent: () => import('./componentes/registro/registro.component').then(m => m.RegistroComponent)
  },
  {
    path: 'lista-espera',
    loadComponent: () => import('./componentes/lista-espera/lista-espera.component').then(m => m.ListaEsperaComponent)
  },
  {
    path: 'encuestas',
    loadComponent: () => import('./componentes/encuestas/encuestas.component').then(m => m.EncuestasComponent)
  },
];


export const appConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient()
  ]};
