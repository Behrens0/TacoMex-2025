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
      user: { correo: 'supervisor@prueba.com', contrasenia: '123456' },
      guest: { correo: 'guest@prueba.com', contrasenia: '123456' },
      supervisor: { correo: 'supervisor@prueba.com', contrasenia: '123456' },
      dueno: { correo: 'tomasbehrens0@gmail.com', contrasenia: '123456' },
      maitre: { correo: 'maitre@prueba.com', contrasenia: '123456' },
      mozo: { correo: 'mozo@prueba.com', contrasenia: '123456' },
      cocinero: { correo: 'cocinero@prueba.com', contrasenia: '123456' },
      bartender: { correo: 'bartender@prueba.com', contrasenia: '123456' },
      cliente_registrado: { correo: 'cliente@prueba.com', contrasenia: '123456' },
      cliente_anonimo: { correo: 'anonimo@prueba.com', contrasenia: '123456' }
    };

    if (presets[type]) {
      this.loginForm.patchValue({
        correo: presets[type].correo,
        contrasenia: presets[type].contrasenia
      });
    }
  }
}
