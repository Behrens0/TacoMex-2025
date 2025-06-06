import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, LoadingController } from '@ionic/angular';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../servicios/supabase.service';
import { AuthService } from 'src/app/servicios/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule, FormsModule],
  templateUrl: './registro.component.html',
  styleUrls: ['./registro.component.scss']
})
export class RegistroComponent {
  clienteForm: FormGroup;
  empleadoForm: FormGroup;
  supervisorForm: FormGroup;
  mensajeExito: string = '';
  mensajeError: string = '';
  esAnonimo = false;
  imagenURL: string | null = null;
  emailEnUso: boolean = false;
  tipoRegistro: 'cliente' | 'empleado' | 'supervisor' = 'cliente';
  esAdmin: boolean = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private sb: SupabaseService,
    private authService: AuthService,
    private loadingCtrl: LoadingController
  ) {
    this.clienteForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.pattern(/^[A-Za-zÀ-ÿ\s]+$/)]],
      apellido: ['', [Validators.required, Validators.pattern(/^[A-Za-zÀ-ÿ\s]+$/)]],
      correo: ['', [Validators.required, Validators.email]],
      contrasenia: ['', [Validators.required, Validators.minLength(6)]],
      dni: ['', [Validators.required, Validators.pattern(/^\d{7,8}$/)]],
      imagenPerfil: [null, Validators.required]
    })
    this.empleadoForm = this.fb.group({
    });
    this.supervisorForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.pattern(/^[A-Za-zÀ-ÿ\s]+$/)]],
      apellido: ['', [Validators.required, Validators.pattern(/^[A-Za-zÀ-ÿ\s]+$/)]],
      correo: ['', [Validators.required, Validators.email]],
      contrasenia: ['', [Validators.required, Validators.minLength(6)]],
      dni: ['', [Validators.required, Validators.pattern(/^\d{7,8}$/)]],
      cuil: ['', [Validators.required, Validators.pattern(/^\d{11}$/)]],
      imagenPerfil: [null, Validators.required],
      perfil: ['supervisor', Validators.required]
    });

    this.esAdmin = this.authService.esUsuarioAdmin();
  }

  async registrarCliente() {
    this.emailEnUso = false;
    this.mensajeExito = '';
    this.mensajeError = '';

    if (this.clienteForm.invalid) {
      this.mensajeError = 'Por favor completa todos los campos requeridos correctamente.';
      return;
    }

    if (this.esAnonimo) {
      this.router.navigate(['/login']);
      return;
    }

    try {
      const { nombre, apellido, correo, contrasenia, dni } = this.clienteForm.value;
      const archivo: File = this.clienteForm.value.imagenPerfil;

      const usuario = await this.authService.registro(correo, contrasenia);
      if (!usuario) {
        this.emailEnUso = true;
        return;
      }

      let imagenPerfil = '';
      if (archivo) {
        const path = await this.sb.subirImagenPerfil(archivo);
        imagenPerfil = this.sb.supabase.storage.from('usuarios.img').getPublicUrl(path).data.publicUrl;
      }

      const nuevoCliente = {
        nombre,
        apellido,
        correo,
        dni,
        imagenPerfil
      };

      const { error } = await this.sb.supabase.from('clientes').insert([nuevoCliente]);
      if (error) {
        if (error.message && error.message.toLowerCase().includes('already')) {
          this.emailEnUso = true;
          this.mensajeError = '';
        } else {
          this.mensajeError = `Error al registrarse`;
        }
        return;
      }

      this.mensajeExito = 'Registro exitoso. Bienvenido!';
      this.clienteForm.reset();
      this.imagenURL = null;
      this.router.navigate(['/home']);
    } catch (e) {
      this.mensajeError = 'Error inesperado: ' + (e as Error).message;
      console.error(e);
    } finally {
      const loading = await this.loadingCtrl.getTop();
      if (loading) {
        loading.dismiss();
      }
    }
  }

  async registrarEmpleado() {
  }
  async registrarSupervisor() {
    this.mensajeExito = '';
    this.mensajeError = '';

    if (this.supervisorForm.invalid) {
      this.mensajeError = 'Por favor completa todos los campos requeridos correctamente.';
      return;
    }

    try {
      const { nombre, apellido, correo, contrasenia, dni, cuil, perfil } = this.supervisorForm.value;
      const archivo: File = this.supervisorForm.value.imagenPerfil;

      const usuario = await this.authService.registro(correo, contrasenia);
      if (!usuario) {
        this.emailEnUso = true;
        return;
      }

      let imagenPerfil = '';
      if (archivo) {
        const path = await this.sb.subirImagenPerfil(archivo);
        imagenPerfil = this.sb.supabase.storage.from('usuarios.img').getPublicUrl(path).data.publicUrl;
      }

      const nuevoSupervisor = {
        nombre,
        apellido,
        correo,
        dni,
        cuil,
        imagenPerfil,
        perfil
      };

      const { error } = await this.sb.supabase.from('supervisores').insert([nuevoSupervisor]);
      if (error) {
        if (error.message && error.message.toLowerCase().includes('already')) {
          this.emailEnUso = true;
          this.mensajeError = '';
        } else {
          this.mensajeError = `Error al registrarse`;
        }
        return;
      }

      this.mensajeExito = 'Registro exitoso de supervisor.';
      this.supervisorForm.reset();
      this.imagenURL = null;
    } catch (e) {
      this.mensajeError = 'Error inesperado: ' + (e as Error).message;
      console.error(e);
    } finally {
      const loading = await this.loadingCtrl.getTop();
      if (loading) {
        loading.dismiss();
      }
    }
  }

  alternarAnonimato() {
  if (this.esAnonimo) {
    this.clienteForm.get('correo')?.disable();
    this.clienteForm.get('contrasenia')?.disable();
    this.clienteForm.get('dni')?.disable();
  } else {
    this.clienteForm.get('correo')?.enable();
    this.clienteForm.get('contrasenia')?.enable();
    this.clienteForm.get('dni')?.enable();
  }
}
  irAlLogin() {
    this.router.navigate(['/login']);
  }

  onImagenSeleccionada(event: any) {
    const archivo = event.target.files[0];
    if (archivo) {
      this.clienteForm.patchValue({ imagenPerfil: archivo });
      this.clienteForm.get('imagenPerfil')?.updateValueAndValidity();
      const reader = new FileReader();
      reader.onload = () => {
        this.imagenURL = reader.result as string;
      };
      reader.readAsDataURL(archivo);
    }
  }

  tomarFoto() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';

    input.onchange = (event: any) => {
      const archivo = event.target.files[0];
      if (archivo) {
        this.clienteForm.patchValue({ imagenPerfil: archivo });
        this.clienteForm.get('imagenPerfil')?.updateValueAndValidity();
        const reader = new FileReader();
        reader.onload = () => {
          this.imagenURL = reader.result as string;
        };
        reader.readAsDataURL(archivo);
      }
    };

    input.click();
  }

  escanearDNI() {
  }
}