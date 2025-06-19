import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, LoadingController } from '@ionic/angular';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../servicios/supabase.service';
import { AuthService } from 'src/app/servicios/auth.service';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { QRCodeComponent } from 'angularx-qrcode';
import { IonCheckbox } from '@ionic/angular/standalone';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule, FormsModule, QRCodeComponent, IonCheckbox],
  templateUrl: './registro.component.html',
  styleUrls: ['./registro.component.scss']
})
export class RegistroComponent {
  @ViewChild('qrMesa', { static: false }) qrMesaComponent!: QRCodeComponent;
  clienteForm: FormGroup;
  empleadoForm: FormGroup;
  supervisorForm: FormGroup;
  mesaForm: FormGroup;

  mensajeExito: string = '';
  mensajeError: string = '';
  mensajeExitoMesa: string = '';
  mensajeErrorMesa: string = '';

  clienteNombreError: string = '';
  clienteApellidoError: string = '';
  clienteCorreoError: string = '';
  clienteContraseniaError: string = '';
  clienteDniError: string = '';
  clienteImagenError: string = '';

  empleadoNombreError: string = '';
  empleadoApellidoError: string = '';
  empleadoCorreoError: string = '';
  empleadoContraseniaError: string = '';
  empleadoDniError: string = '';
  empleadoCuilError: string = '';
  empleadoImagenError: string = '';
  empleadoPerfilError: string = '';

  supervisorNombreError: string = '';
  supervisorApellidoError: string = '';
  supervisorCorreoError: string = '';
  supervisorContraseniaError: string = '';
  supervisorDniError: string = '';
  supervisorCuilError: string = '';
  supervisorImagenError: string = '';
  supervisorPerfilError: string = '';

  mesaNumeroError: string = '';
  mesaComensalesError: string = '';
  mesaTipoError: string = '';
  mesaImagenError: string = '';

  esAnonimo = false;
  imagenURL: string | null = null;
  imagenMesaURL: string | null = null;
  qrMesaURL: string | null = null;

  emailEnUso: boolean = false;
  tipoRegistro: 'cliente' | 'empleado' | 'supervisor' | 'mesa' = 'cliente';
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
      imagenPerfil: [null, Validators.required],
      anonimo: [false]
    });
    this.empleadoForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.pattern(/^[A-Za-zÀ-ÿ\s]+$/)]],
      apellido: ['', [Validators.required, Validators.pattern(/^[A-Za-zÀ-ÿ\s]+$/)]],
      correo: ['', [Validators.required, Validators.email]],
      contrasenia: ['', [Validators.required, Validators.minLength(6)]],
      dni: ['', [Validators.required, Validators.pattern(/^\d{7,8}$/)]],
      cuil: ['', [Validators.required, Validators.pattern(/^\d{11}$/)]],
      imagenPerfil: [null, Validators.required],
      perfil: ['', Validators.required]
    });
    this.supervisorForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.pattern(/^[A-Za-zÀ-ÿ\s]+$/)]],
      apellido: ['', [Validators.required, Validators.pattern(/^[A-Za-zÀ-ÿ\s]+$/)]],
      correo: ['', [Validators.required, Validators.email]],
      contrasenia: ['', [Validators.required, Validators.minLength(6)]],
      dni: ['', [Validators.required, Validators.pattern(/^\d{7,8}$/)]],
      cuil: ['', [Validators.required, Validators.pattern(/^\d{11}$/)]],
      imagenPerfil: [null, Validators.required],
      perfil: ['', Validators.required]
    });
    this.mesaForm = this.fb.group({
      numero: ['', [Validators.required, Validators.pattern(/^\d+$/)]],
      comensales: ['', [Validators.required, Validators.min(1), Validators.max(20)]],
      tipo: ['', Validators.required],
      imagen: [null, Validators.required]
    });

    this.esAdmin = this.authService.esUsuarioAdmin();

    this.setupFormValidation();
  }

  setupFormValidation() {
    this.clienteForm.get('nombre')?.valueChanges.subscribe(() => this.validarCampoCliente('nombre'));
    this.clienteForm.get('apellido')?.valueChanges.subscribe(() => this.validarCampoCliente('apellido'));
    this.clienteForm.get('correo')?.valueChanges.subscribe(() => this.validarCampoCliente('correo'));
    this.clienteForm.get('contrasenia')?.valueChanges.subscribe(() => this.validarCampoCliente('contrasenia'));
    this.clienteForm.get('dni')?.valueChanges.subscribe(() => this.validarCampoCliente('dni'));

    this.empleadoForm.get('nombre')?.valueChanges.subscribe(() => this.validarCampoEmpleado('nombre'));
    this.empleadoForm.get('apellido')?.valueChanges.subscribe(() => this.validarCampoEmpleado('apellido'));
    this.empleadoForm.get('correo')?.valueChanges.subscribe(() => this.validarCampoEmpleado('correo'));
    this.empleadoForm.get('contrasenia')?.valueChanges.subscribe(() => this.validarCampoEmpleado('contrasenia'));
    this.empleadoForm.get('dni')?.valueChanges.subscribe(() => this.validarCampoEmpleado('dni'));
    this.empleadoForm.get('cuil')?.valueChanges.subscribe(() => this.validarCampoEmpleado('cuil'));

    this.supervisorForm.get('nombre')?.valueChanges.subscribe(() => this.validarCampoSupervisor('nombre'));
    this.supervisorForm.get('apellido')?.valueChanges.subscribe(() => this.validarCampoSupervisor('apellido'));
    this.supervisorForm.get('correo')?.valueChanges.subscribe(() => this.validarCampoSupervisor('correo'));
    this.supervisorForm.get('contrasenia')?.valueChanges.subscribe(() => this.validarCampoSupervisor('contrasenia'));
    this.supervisorForm.get('dni')?.valueChanges.subscribe(() => this.validarCampoSupervisor('dni'));
    this.supervisorForm.get('cuil')?.valueChanges.subscribe(() => this.validarCampoSupervisor('cuil'));

    this.mesaForm.get('numero')?.valueChanges.subscribe(() => this.validarCampoMesa('numero'));
    this.mesaForm.get('comensales')?.valueChanges.subscribe(() => this.validarCampoMesa('comensales'));
    this.mesaForm.get('tipo')?.valueChanges.subscribe(() => this.validarCampoMesa('tipo'));
  }

  validarCampoCliente(campo: string) {
    const control = this.clienteForm.get(campo);
    if (!control) return;

    switch(campo) {
      case 'nombre': this.clienteNombreError = ''; break;
      case 'apellido': this.clienteApellidoError = ''; break;
      case 'correo': this.clienteCorreoError = ''; break;
      case 'contrasenia': this.clienteContraseniaError = ''; break;
      case 'dni': this.clienteDniError = ''; break;
    }

    if (control.value || control.touched) {
      switch(campo) {
        case 'nombre':
          if (control.errors?.['required']) {
            this.clienteNombreError = 'El nombre es requerido';
          } else if (control.errors?.['pattern']) {
            this.clienteNombreError = 'El nombre solo puede contener letras';
          }
          break;
        case 'apellido':
          if (control.errors?.['required']) {
            this.clienteApellidoError = 'El apellido es requerido';
          } else if (control.errors?.['pattern']) {
            this.clienteApellidoError = 'El apellido solo puede contener letras';
          }
          break;
        case 'correo':
          if (control.errors?.['required']) {
            this.clienteCorreoError = 'El correo electrónico es requerido';
          } else if (control.errors?.['email']) {
            this.clienteCorreoError = 'Ingrese un correo electrónico válido';
          }
          break;
        case 'contrasenia':
          if (control.errors?.['required']) {
            this.clienteContraseniaError = 'La contraseña es requerida';
          } else if (control.errors?.['minlength']) {
            this.clienteContraseniaError = 'La contraseña debe tener al menos 6 caracteres';
          }
          break;
        case 'dni':
          if (control.errors?.['required']) {
            this.clienteDniError = 'El DNI es requerido';
          } else if (control.errors?.['pattern']) {
            this.clienteDniError = 'El DNI debe tener 7 u 8 dígitos';
          }
          break;
      }
    }
  }

  validarCampoEmpleado(campo: string) {
    const control = this.empleadoForm.get(campo);
    if (!control) return;

    switch(campo) {
      case 'nombre': this.empleadoNombreError = ''; break;
      case 'apellido': this.empleadoApellidoError = ''; break;
      case 'correo': this.empleadoCorreoError = ''; break;
      case 'contrasenia': this.empleadoContraseniaError = ''; break;
      case 'dni': this.empleadoDniError = ''; break;
      case 'cuil': this.empleadoCuilError = ''; break;
    }

    if (control.value || control.touched) {
      switch(campo) {
        case 'nombre':
          if (control.errors?.['required']) {
            this.empleadoNombreError = 'El nombre es requerido';
          } else if (control.errors?.['pattern']) {
            this.empleadoNombreError = 'El nombre solo puede contener letras';
          }
          break;
        case 'apellido':
          if (control.errors?.['required']) {
            this.empleadoApellidoError = 'El apellido es requerido';
          } else if (control.errors?.['pattern']) {
            this.empleadoApellidoError = 'El apellido solo puede contener letras';
          }
          break;
        case 'correo':
          if (control.errors?.['required']) {
            this.empleadoCorreoError = 'El correo electrónico es requerido';
          } else if (control.errors?.['email']) {
            this.empleadoCorreoError = 'Ingrese un correo electrónico válido';
          }
          break;
        case 'contrasenia':
          if (control.errors?.['required']) {
            this.empleadoContraseniaError = 'La contraseña es requerida';
          } else if (control.errors?.['minlength']) {
            this.empleadoContraseniaError = 'La contraseña debe tener al menos 6 caracteres';
          }
          break;
        case 'dni':
          if (control.errors?.['required']) {
            this.empleadoDniError = 'El DNI es requerido';
          } else if (control.errors?.['pattern']) {
            this.empleadoDniError = 'El DNI debe tener 7 u 8 dígitos';
          }
          break;
        case 'cuil':
          if (control.errors?.['required']) {
            this.empleadoCuilError = 'El CUIL es requerido';
          } else if (control.errors?.['pattern']) {
            this.empleadoCuilError = 'El CUIL debe tener 11 dígitos';
          }
          break;
      }
    }
  }

  validarCampoSupervisor(campo: string) {
    const control = this.supervisorForm.get(campo);
    if (!control) return;

    switch(campo) {
      case 'nombre': this.supervisorNombreError = ''; break;
      case 'apellido': this.supervisorApellidoError = ''; break;
      case 'correo': this.supervisorCorreoError = ''; break;
      case 'contrasenia': this.supervisorContraseniaError = ''; break;
      case 'dni': this.supervisorDniError = ''; break;
      case 'cuil': this.supervisorCuilError = ''; break;
    }

    if (control.value || control.touched) {
      switch(campo) {
        case 'nombre':
          if (control.errors?.['required']) {
            this.supervisorNombreError = 'El nombre es requerido';
          } else if (control.errors?.['pattern']) {
            this.supervisorNombreError = 'El nombre solo puede contener letras';
          }
          break;
        case 'apellido':
          if (control.errors?.['required']) {
            this.supervisorApellidoError = 'El apellido es requerido';
          } else if (control.errors?.['pattern']) {
            this.supervisorApellidoError = 'El apellido solo puede contener letras';
          }
          break;
        case 'correo':
          if (control.errors?.['required']) {
            this.supervisorCorreoError = 'El correo electrónico es requerido';
          } else if (control.errors?.['email']) {
            this.supervisorCorreoError = 'Ingrese un correo electrónico válido';
          }
          break;
        case 'contrasenia':
          if (control.errors?.['required']) {
            this.supervisorContraseniaError = 'La contraseña es requerida';
          } else if (control.errors?.['minlength']) {
            this.supervisorContraseniaError = 'La contraseña debe tener al menos 6 caracteres';
          }
          break;
        case 'dni':
          if (control.errors?.['required']) {
            this.supervisorDniError = 'El DNI es requerido';
          } else if (control.errors?.['pattern']) {
            this.supervisorDniError = 'El DNI debe tener 7 u 8 dígitos';
          }
          break;
        case 'cuil':
          if (control.errors?.['required']) {
            this.supervisorCuilError = 'El CUIL es requerido';
          } else if (control.errors?.['pattern']) {
            this.supervisorCuilError = 'El CUIL debe tener 11 dígitos';
          }
          break;
      }
    }
  }

  validarCampoMesa(campo: string) {
    const control = this.mesaForm.get(campo);
    if (!control) return;

    switch(campo) {
      case 'numero': this.mesaNumeroError = ''; break;
      case 'comensales': this.mesaComensalesError = ''; break;
      case 'tipo': this.mesaTipoError = ''; break;
    }

    if (control.value || control.touched) {
      switch(campo) {
        case 'numero':
          if (control.errors?.['required']) {
            this.mesaNumeroError = 'El número de mesa es requerido';
          } else if (control.errors?.['pattern']) {
            this.mesaNumeroError = 'El número debe ser un valor numérico';
          }
          break;
        case 'comensales':
          if (control.errors?.['required']) {
            this.mesaComensalesError = 'La cantidad de comensales es requerida';
          } else if (control.errors?.['min']) {
            this.mesaComensalesError = 'Debe haber al menos 1 comensal';
          } else if (control.errors?.['max']) {
            this.mesaComensalesError = 'La cantidad máxima de comensales es 20';
          }
          break;
        case 'tipo':
          if (control.errors?.['required']) {
            this.mesaTipoError = 'El tipo de mesa es requerido';
          }
          break;
      }
    }
  }

  limpiarErroresCliente() {
    this.mensajeError = '';
    this.clienteNombreError = '';
    this.clienteApellidoError = '';
    this.clienteCorreoError = '';
    this.clienteContraseniaError = '';
    this.clienteDniError = '';
    this.clienteImagenError = '';
  }

  limpiarErroresEmpleado() {
    this.mensajeError = '';
    this.empleadoNombreError = '';
    this.empleadoApellidoError = '';
    this.empleadoCorreoError = '';
    this.empleadoContraseniaError = '';
    this.empleadoDniError = '';
    this.empleadoCuilError = '';
    this.empleadoImagenError = '';
    this.empleadoPerfilError = '';
  }

  limpiarErroresSupervisor() {
    this.mensajeError = '';
    this.supervisorNombreError = '';
    this.supervisorApellidoError = '';
    this.supervisorCorreoError = '';
    this.supervisorContraseniaError = '';
    this.supervisorDniError = '';
    this.supervisorCuilError = '';
    this.supervisorImagenError = '';
    this.supervisorPerfilError = '';
  }

  limpiarErroresMesa() {
    this.mensajeErrorMesa = '';
    this.mesaNumeroError = '';
    this.mesaComensalesError = '';
    this.mesaTipoError = '';
    this.mesaImagenError = '';
  }

  async registrarCliente() {
    this.limpiarErroresCliente();

    this.validarCampoCliente('nombre');
    this.validarCampoCliente('apellido');
    this.validarCampoCliente('correo');
    this.validarCampoCliente('contrasenia');
    this.validarCampoCliente('dni');

    if (this.clienteNombreError || this.clienteApellidoError || this.clienteCorreoError || 
        this.clienteContraseniaError || this.clienteDniError) {
      return;
    }

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
        this.clienteCorreoError = 'Este correo electrónico ya está en uso';
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
          this.clienteCorreoError = 'Este correo electrónico ya está en uso';
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
    this.limpiarErroresEmpleado();

    this.validarCampoEmpleado('nombre');
    this.validarCampoEmpleado('apellido');
    this.validarCampoEmpleado('correo');
    this.validarCampoEmpleado('contrasenia');
    this.validarCampoEmpleado('dni');
    this.validarCampoEmpleado('cuil');

    if (this.empleadoNombreError || this.empleadoApellidoError || this.empleadoCorreoError || 
        this.empleadoContraseniaError || this.empleadoDniError || this.empleadoCuilError) {
      return;
    }

    if (this.empleadoForm.invalid) {
      this.mensajeError = 'Por favor completa todos los campos requeridos correctamente.';
      return;
    }

    try {
      const { nombre, apellido, correo, contrasenia, dni, cuil, perfil } = this.empleadoForm.value;
      const archivo: File = this.empleadoForm.value.imagenPerfil;

      const usuario = await this.authService.registro(correo, contrasenia);
      if (!usuario) {
        this.empleadoCorreoError = 'Este correo electrónico ya está en uso';
        return;
      }

      let imagenPerfil = '';
      if (archivo) {
        const path = await this.sb.subirImagenPerfil(archivo);
        imagenPerfil = this.sb.supabase.storage.from('usuarios.img').getPublicUrl(path).data.publicUrl;
      }

      const nuevoEmpleado = {
        nombre,
        apellido,
        correo,
        dni,
        cuil,
        imagenPerfil,
        perfil
      };

      const { error } = await this.sb.supabase.from('empleados').insert([nuevoEmpleado]);
      if (error) {
        if (error.message && error.message.toLowerCase().includes('already')) {
          this.empleadoCorreoError = 'Este correo electrónico ya está en uso';
        } else {
          this.mensajeError = `Error al registrarse`;
        }
        return;
      }

      this.mensajeExito = 'Registro exitoso de empleado.';
      this.empleadoForm.reset();
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

  async registrarSupervisor() {
    this.limpiarErroresSupervisor();

    this.validarCampoSupervisor('nombre');
    this.validarCampoSupervisor('apellido');
    this.validarCampoSupervisor('correo');
    this.validarCampoSupervisor('contrasenia');
    this.validarCampoSupervisor('dni');
    this.validarCampoSupervisor('cuil');

    if (this.supervisorNombreError || this.supervisorApellidoError || this.supervisorCorreoError || 
        this.supervisorContraseniaError || this.supervisorDniError || this.supervisorCuilError) {
      return;
    }

    if (this.supervisorForm.invalid) {
      this.mensajeError = 'Por favor completa todos los campos requeridos correctamente.';
      return;
    }

    try {
      const { nombre, apellido, correo, contrasenia, dni, cuil, perfil } = this.supervisorForm.value;
      const archivo: File = this.supervisorForm.value.imagenPerfil;

      const usuario = await this.authService.registro(correo, contrasenia);
      if (!usuario) {
        this.supervisorCorreoError = 'Este correo electrónico ya está en uso';
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
          this.supervisorCorreoError = 'Este correo electrónico ya está en uso';
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

  async registrarMesa() {
    this.limpiarErroresMesa();
    this.qrMesaURL = null;

    this.validarCampoMesa('numero');
    this.validarCampoMesa('comensales');
    this.validarCampoMesa('tipo');

    if (this.mesaNumeroError || this.mesaComensalesError || this.mesaTipoError) {
      return;
    }

    if (this.mesaForm.invalid) {
      this.mensajeErrorMesa = 'Por favor completa todos los campos requeridos correctamente.';
      return;
    }

    try {
      const { numero, comensales, tipo } = this.mesaForm.value;
      const archivo: File = this.mesaForm.value.imagen;

      let imagenMesa = '';
      if (archivo) {
        const { data, error } = await this.sb.supabase.storage
          .from('usuarios.img')
          .upload(`mesa-${numero}-${archivo.name}`, archivo, { upsert: true });

        if (error) throw new Error(error.message);

        imagenMesa = this.sb.supabase.storage
          .from('usuarios.img')
          .getPublicUrl(data.path).data.publicUrl;
      }

      const canvas: HTMLCanvasElement | null = this.qrMesaComponent.qrcElement.nativeElement.querySelector('canvas');
      if (!canvas) {
        throw new Error('No se pudo generar el código QR.');
      }

      this.qrMesaURL = canvas.toDataURL('image/png');

      const nuevaMesa = {
        numero,
        comensales,
        tipo,
        imagen: imagenMesa,
        qr: this.qrMesaURL
      };

      const { error } = await this.sb.supabase.from('mesas').insert([nuevaMesa]);
      if (error) {
        this.mensajeErrorMesa = 'Error al registrar la mesa: ' + error.message;
        return;
      }

      this.mensajeExitoMesa = 'Mesa registrada correctamente.';
      this.mesaForm.reset();
      this.imagenMesaURL = null;
    } catch (e: any) {
      this.mensajeErrorMesa = 'Error inesperado: ' + e.message;
      console.error(e);
    }
  }

  alternarAnonimato() {
    this.esAnonimo = this.clienteForm.get('anonimo')?.value;
    if (this.esAnonimo) {
      this.clienteForm.get('correo')?.disable();
      this.clienteForm.get('contrasenia')?.disable();
      this.clienteForm.get('dni')?.disable();
      this.clienteForm.get('imagenPerfil')?.disable();
    } else {
      this.clienteForm.get('correo')?.enable();
      this.clienteForm.get('contrasenia')?.enable();
      this.clienteForm.get('dni')?.enable();
      this.clienteForm.get('imagenPerfil')?.enable();
    }
  }

  irAlLogin() {
    this.router.navigate(['/login']);
  }

  onImagenSeleccionada(event: any) {
    const archivo = event.target.files[0];
    if (archivo) {
      switch(this.tipoRegistro) {
        case 'cliente':
          this.clienteForm.patchValue({ imagenPerfil: archivo });
          this.clienteForm.get('imagenPerfil')?.updateValueAndValidity();
          break;
        case 'empleado':
          this.empleadoForm.patchValue({ imagenPerfil: archivo });
          this.empleadoForm.get('imagenPerfil')?.updateValueAndValidity();
          break;
        case 'supervisor':
          this.supervisorForm.patchValue({ imagenPerfil: archivo });
          this.supervisorForm.get('imagenPerfil')?.updateValueAndValidity();
          break;
        case 'mesa':
          this.mesaForm.patchValue({ imagen: archivo });
          this.mesaForm.get('imagen')?.updateValueAndValidity();
          break;
      }
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
        switch(this.tipoRegistro) {
          case 'cliente':
            this.clienteForm.patchValue({ imagenPerfil: archivo });
            this.clienteForm.get('imagenPerfil')?.updateValueAndValidity();
            break;
          case 'empleado':
            this.empleadoForm.patchValue({ imagenPerfil: archivo });
            this.empleadoForm.get('imagenPerfil')?.updateValueAndValidity();
            break;
          case 'supervisor':
            this.supervisorForm.patchValue({ imagenPerfil: archivo });
            this.supervisorForm.get('imagenPerfil')?.updateValueAndValidity();
            break;
          case 'mesa':
            this.mesaForm.patchValue({ imagen: archivo });
            this.mesaForm.get('imagen')?.updateValueAndValidity();
            break;
        }
        const reader = new FileReader();
        reader.onload = () => {
          this.imagenURL = reader.result as string;
        };
        reader.readAsDataURL(archivo);
      }
    };

    input.click();
  }

  async escanearDNI() {
    try {
      const result = await BarcodeScanner.scan();

      if (result.barcodes.length > 0) {
        const codigo = result.barcodes[0].rawValue;

        this.procesarDatosDNI(codigo);
      } else {
        this.mensajeError = 'No se detectó ningún código.';
      }
    } catch (error) {
      this.mensajeError = 'Error al escanear: ' + error;
    }
  }

  procesarDatosDNI(codigo: string) {
    const partes = codigo.split('@');
    if (partes.length > 5) {
      const apellido = this.capitalizar(partes[1]);
      const nombre = this.capitalizar(partes[2]);
      const dni = this.capitalizar(partes[4]);

      if (this.tipoRegistro === 'cliente') {
        this.clienteForm.patchValue({ nombre, apellido, dni });
      } else if (this.tipoRegistro === 'empleado') {
        this.empleadoForm.patchValue({ nombre, apellido, dni });
      } else if (this.tipoRegistro === 'supervisor') {
        this.supervisorForm.patchValue({ nombre, apellido, dni });
      }
    } else {
      this.mensajeError = 'El formato del DNI no es válido.';
    }
  }

  private capitalizar(str: string): string {
    return str
      .toLowerCase()
      .replace(/(^|\s)\S/g, l => l.toUpperCase());
  }

  setTipoRegistro(tipo: 'cliente' | 'empleado' | 'supervisor' | 'mesa') {
    this.tipoRegistro = tipo;
    this.mensajeError = '';
    this.mensajeExito = '';
    this.imagenURL = null;
    this.mensajeErrorMesa = '';
    this.mensajeExitoMesa = '';
    this.imagenMesaURL = null;
    this.qrMesaURL = null;

    if (tipo !== 'cliente') this.clienteForm.reset();
    if (tipo !== 'empleado') this.empleadoForm.reset();
    if (tipo !== 'supervisor') this.supervisorForm.reset();
    if (tipo !== 'mesa') this.mesaForm.reset();
  }
}