import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from 'src/app/servicios/supabase.service';
import { AuthService } from 'src/app/servicios/auth.service';
import { LoadingService } from 'src/app/servicios/loading.service';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonButton,
  IonIcon
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  imports: [
    IonButton,
    FormsModule,
    RouterModule,
    CommonModule,
    IonContent,
    IonIcon
],
})
export class HomePage {
  mostrarBotonRegistro: boolean = false;

  constructor(
    private authService: AuthService,
    private supabase: SupabaseService,
    private router: Router,
    private loadingService: LoadingService
  ) {}

  ngOnInit() {
    this.mostrarBotonRegistro = this.authService.esUsuarioAdmin() && this.router.url !== '/registro';
  }

  irARegistro() {
    this.loadingService.show();
    this.router.navigate(['/registro']);
    this.loadingService.hide();
  }

  ionViewWillEnter() {
    this.loadUser();
  }

  async loadUser() {
    const { data, error } = await this.authService.getCurrentUser();
    const user = data?.user;

    if (!user) {
      this.router.navigateByUrl('/login');
    }
  }

  async logout() {
    this.loadingService.show();
    await this.authService.signOut();
    this.router.navigateByUrl('/login', { replaceUrl: true });
    this.loadingService.hide();
  }

  goTo(route: string) {
    this.router.navigate([route]);
  }
}
