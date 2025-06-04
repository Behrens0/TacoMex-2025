import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, LoadingController } from '@ionic/angular';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../servicios/supabase.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule, FormsModule],
  templateUrl: './registro.component.html',
  styleUrls: ['./registro.component.scss']
})
export class RegistroComponent {
  registerForm: FormGroup;
  mensajeError: string = '';
  esAnonimo = false;
  fotoBase64: string | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private supabaseService: SupabaseService,
    private loadingCtrl: LoadingController
  ) {
    this.registerForm = this.fb.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      correo: ['', [Validators.required, Validators.email]],
      contraseña: ['', Validators.required],
      dni: ['']
    });
  }

  async registrar() {
    this.mensajeError = '';

    if (this.esAnonimo) {
      this.router.navigateByUrl('/home');
      return;
    }

    if (this.registerForm.invalid) {
      this.mensajeError = 'Por favor completa todos los campos requeridos correctamente.';
      return;
    }

    const { nombre, apellido, correo, contraseña, dni } = this.registerForm.value;

    const loading = await this.loadingCtrl.create({ message: 'Registrando...' });
    await loading.present();

    try {
      const { data, error } = await this.supabaseService.signUp(correo, contraseña);
      if (error) {
        this.mensajeError = error.message;
        await loading.dismiss();
        return;
      }

      const { error: errorInsertar } = await this.supabaseService.insertUser({
        nombre,
        apellido,
        correo,
        dni,
      });

      if (errorInsertar) {
        this.mensajeError = errorInsertar.message;
        await loading.dismiss();
        return;
      }

      await loading.dismiss();
      this.router.navigateByUrl('/home');
    } catch (error: any) {
      this.mensajeError = error.message || 'Error inesperado';
      await loading.dismiss();
    }
  }

alternarAnonimato() {
  if (this.esAnonimo) {
    this.registerForm.get('correo')?.disable();
    this.registerForm.get('contraseña')?.disable();
    this.registerForm.get('dni')?.disable();
  } else {
    this.registerForm.get('correo')?.enable();
    this.registerForm.get('contraseña')?.enable();
    this.registerForm.get('dni')?.enable();
  }
}
  irAlLogin() {
    this.router.navigate(['/login']);
  }

  tomarFoto(){
  }

  subirFoto(){
  }

  escanearDNI() {
  }
}