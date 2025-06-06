import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/servicios/auth.service';

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
  correo: string = '';
  contrasenia: string = '';
  mensajeError: string = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
    this.loginForm = this.fb.group({
      correo: ['', [Validators.required, Validators.email]],
      contrasenia: ['', Validators.required],
    });
  }

  async ingresar() {
    this.mensajeError = '';

    try {
      const correo = this.loginForm.get('correo')?.value;
      const contrasenia = this.loginForm.get('contrasenia')?.value;

      if (!correo || !contrasenia) {
        throw new Error('Debe completar todos los campos');
      }

      if (contrasenia.length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres');
      }

      let usuario;
      try {
        usuario = await this.authService.logIn(correo, contrasenia);
      } catch (error: any) {
        if (error?.message) {
          throw new Error(error.message);
        }
        throw new Error('Correo electrónico o contraseña inválidos');
      }

      if (!usuario) {
        throw new Error('Correo electrónico o contraseña inválidos');
      }

      this.router.navigate(['/home']);
    } catch (e: any) {
      this.mensajeError = e.message || 'Ocurrió un error al iniciar sesión';
    } finally {
      this.loginForm.reset();
    }
  }

  goToRegister() {
    this.router.navigateByUrl('/registro');
  }

  accesoRapido(type: string) {
    const presets: { [key: string]: { correo: string; contrasenia: string } } = {
      admin: { correo: 'admin@test.com', contrasenia: 'admin123' },
      user: { correo: 'user@test.com', contrasenia: 'user123' },
      guest: { correo: 'guest@test.com', contrasenia: 'guest123' },
      supervisor: { correo: 'supervisor@test.com', contrasenia: 'super123' },
      dueno: { correo: 'dueno@test.com', contrasenia: 'dueno123' },
      maitre: { correo: 'maitre@test.com', contrasenia: 'maitre123' },
      mozo: { correo: 'mozo@test.com', contrasenia: 'mozo123' },
      cocinero: { correo: 'cocinero@test.com', contrasenia: 'cocinero123' },
      bartender: { correo: 'bartender@test.com', contrasenia: 'bartender123' },
      cliente_registrado: { correo: 'cliente@test.com', contrasenia: 'cliente123' },
      cliente_anonimo: { correo: 'anonimo@test.com', contrasenia: 'anonimo123' }
    };
  }
}
