// Login Page
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

import {
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonIcon,
  IonList,
  IonPopover
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonContent,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonIcon,
    IonPopover,
    IonList
  ],
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss']
})
export class LoginPage {
  loginForm: FormGroup;
  errorMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private supabaseService: SupabaseService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  async login() {
    const { email, password } = this.loginForm.value;
    const { error } = await this.supabaseService.signIn(email, password);

    if (error) {
      this.errorMessage = error.message;
    } else {
      this.router.navigateByUrl('/home', { replaceUrl: true });
    }
  }

  goToRegister() {
    this.router.navigateByUrl('/register');
  }

  autofill(type: string) {
    const presets: { [key: string]: { email: string; password: string } } = {
      admin: { email: 'admin@test.com', password: 'admin123' },
      user: { email: 'user@test.com', password: 'user123' },
      guest: { email: 'guest@test.com', password: 'guest123' },
      supervisor: { email: 'supervisor@test.com', password: 'super123' },
      dueno: { email: 'dueno@test.com', password: 'dueno123' },
      maitre: { email: 'maitre@test.com', password: 'maitre123' },
      mozo: { email: 'mozo@test.com', password: 'mozo123' },
      cocinero: { email: 'cocinero@test.com', password: 'cocinero123' },
      bartender: { email: 'bartender@test.com', password: 'bartender123' },
      cliente_registrado: { email: 'cliente@test.com', password: 'cliente123' },
      cliente_anonimo: { email: 'anonimo@test.com', password: 'anonimo123' }
    };

    if (presets[type]) {
      const { email, password } = presets[type];
      this.loginForm.patchValue({ email, password });
    } else {
      this.errorMessage = 'Tipo de acceso no reconocido.';
    }
  }
}