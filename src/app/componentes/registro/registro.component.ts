import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, LoadingController } from '@ionic/angular';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../servicios/supabase.service';
import { AuthService } from 'src/app/servicios/auth.service';
import { LoadingService } from 'src/app/servicios/loading.service';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { toDataURL } from 'qrcode';
import { IonCheckbox, IonTextarea } from '@ionic/angular/standalone';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule, FormsModule, IonCheckbox, IonTextarea],
  templateUrl: './registro.component.html',
  styleUrls: ['./registro.component.scss']
})
export class RegistroComponent {
  clienteForm: FormGroup;
  empleadoForm: FormGroup;
  supervisorForm: FormGroup;
  mesaForm: FormGroup;
  productoForm: FormGroup;

  mensajeExito: string = '';
  mensajeError: string = '';
  mensajeExitoMesa: string = '';
  mensajeErrorMesa: string = '';
  mensajeExitoProducto: string = '';
  mensajeErrorProducto: string = '';

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

  productoNombreError: string = '';
  productoDescripcionError: string = '';
  productoTiempoError: string = '';
  productoPrecioError: string = '';
  productoImagenesError: string = '';
  productoTipoError: string = '';

  esAnonimo = false;
  imagenURL: string | null = null; // Cliente
  imagenURLEmpleado: string | null = null; // Empleado
  imagenURLSupervisor: string | null = null; // Supervisor
  imagenURLCliente: string | null = null; // Supervisor

  imagenMesaURL: string | null = null;
  qrMesaURL: string | null = null;
  qrProductoURL: string | null = null;
  imagenesProductoURLs: string[] = [];
  imagenesProductoArchivos: File[] = [];

  emailEnUso: boolean = false;
  tipoRegistro: 'cliente' | 'empleado' | 'supervisor' | 'mesa' | 'producto' = 'cliente';
  esAdmin: boolean = false;
  esMaitre: boolean = false;
  esBartender: boolean = false;
  esCocinero: boolean = false;
  perfilUsuario: string = '';

  imagenesMesaURLs: string[] = [];
  imagenesMesaArchivos: File[] = [];

  imagenSupervisorArchivo: File | null = null;
  imagenSupervisorURL: string | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private sb: SupabaseService,
    private authService: AuthService,
    private loadingCtrl: LoadingController,
    private loadingService: LoadingService,
    private http: HttpClient
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
    this.productoForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.pattern(/^[A-Za-zÀ-ÿ\s]+$/)]],
      descripcion: ['', [Validators.required, Validators.minLength(10)]],
      tiempoElaboracion: ['', [Validators.required]],
      precio: ['', [Validators.required, Validators.min(0.01)]],
      tipo: ['', Validators.required],
      imagenes: [null, [Validators.required, this.validarTresImagenes.bind(this)]]
    });

    this.esAdmin = this.authService.esUsuarioAdmin();
    this.esMaitre = this.authService.esUsuarioMaitre();
    this.perfilUsuario = this.authService.getPerfilUsuario();
    this.esBartender = this.perfilUsuario === 'bartender';
    this.esCocinero = this.perfilUsuario === 'cocinero';

    if (this.esMaitre && !this.esAdmin) {
      this.tipoRegistro = 'cliente';
    }
  
    if (this.esAdmin && (this.perfilUsuario === 'dueño' || this.perfilUsuario === 'supervisor')) {
      this.tipoRegistro = 'supervisor';
    }

    if (this.esBartender || this.esCocinero) {
      this.tipoRegistro = 'producto';
    }

    this.setupFormValidation();
  }

  
  setupFormValidation() {
    this.clienteForm.get('nombre')?.valueChanges.subscribe(() => this.validarCampoCliente('nombre'));
    this.clienteForm.get('apellido')?.valueChanges.subscribe(() => this.validarCampoCliente('apellido'));
    this.clienteForm.get('correo')?.valueChanges.subscribe(() => this.validarCampoCliente('correo'));
    this.clienteForm.get('contrasenia')?.valueChanges.subscribe(() => this.validarCampoCliente('contrasenia'));
    this.clienteForm.get('dni')?.valueChanges.subscribe(() => this.validarCampoCliente('dni'));
    this.clienteForm.get('imagenPerfil')?.valueChanges.subscribe(() => this.validarCampoCliente('imagenPerfil'));

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

    this.productoForm.get('nombre')?.valueChanges.subscribe(() => this.validarCampoProducto('nombre'));
    this.productoForm.get('descripcion')?.valueChanges.subscribe(() => this.validarCampoProducto('descripcion'));
    this.productoForm.get('tiempoElaboracion')?.valueChanges.subscribe((valor: string) => {
      if (typeof valor === 'string') {
        let soloNumeros = valor.replace(/\D/g, '').slice(0, 4);
        let formateado = '';
        if (soloNumeros.length === 1) {
          formateado = `00:0${soloNumeros}`;
        } else if (soloNumeros.length === 2) {
          formateado = `00:${soloNumeros}`;
        } else if (soloNumeros.length === 3) {
          formateado = `0${soloNumeros[0]}:${soloNumeros.slice(1, 3)}`;
        } else if (soloNumeros.length === 4) {
          formateado = `${soloNumeros.slice(0, 2)}:${soloNumeros.slice(2, 4)}`;
        } else {
          formateado = soloNumeros;
        }
        if (valor !== formateado) {
          this.productoForm.get('tiempoElaboracion')?.setValue(formateado, { emitEvent: false });
        }
      }
      this.validarCampoProducto('tiempoElaboracion');
    });
    this.productoForm.get('precio')?.valueChanges.subscribe(() => this.validarCampoProducto('precio'));
    this.productoForm.get('tipo')?.valueChanges.subscribe(() => this.validarCampoProducto('tipo'));
    this.productoForm.get('imagenes')?.valueChanges.subscribe(() => this.validarCampoProducto('imagenes'));
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
      case 'imagenPerfil': this.clienteImagenError = ''; break;
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
        case 'imagenPerfil':
          if (control.errors?.['required']) {
            this.clienteImagenError = 'La imagen de perfil es requerida';
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

  validarCampoProducto(campo: string) {
    const control = this.productoForm.get(campo);
    if (!control) return;

    switch(campo) {
      case 'nombre': this.productoNombreError = ''; break;
      case 'descripcion': this.productoDescripcionError = ''; break;
      case 'tiempoElaboracion': this.productoTiempoError = ''; break;
      case 'precio': this.productoPrecioError = ''; break;
      case 'tipo': this.productoTipoError = ''; break;
      case 'imagenes': this.productoImagenesError = ''; break;
    }

    if (control.value || control.touched) {
      switch(campo) {
        case 'nombre':
          if (control.errors?.['required']) {
            this.productoNombreError = 'El nombre del producto es requerido';
          } else if (control.errors?.['pattern']) {
            this.productoNombreError = 'El nombre solo puede contener letras';
          }
          break;
        case 'descripcion':
          if (control.errors?.['required']) {
            this.productoDescripcionError = 'La descripción es requerida';
          } else if (control.errors?.['minlength']) {
            this.productoDescripcionError = 'La descripción debe tener al menos 10 caracteres';
          }
          break;
        case 'tiempoElaboracion': {
          const valor = control.value;
          if (!valor || isNaN(valor)) {
            this.productoTiempoError = 'El tiempo de elaboración es requerido';
          } else if (valor < 1 || valor > 60) {
            this.productoTiempoError = 'El tiempo debe ser entre 1 y 60 minutos';
          }
          break;
        }
        case 'precio':
          if (control.errors?.['required']) {
            this.productoPrecioError = 'El precio es requerido';
          } else if (control.errors?.['min']) {
            this.productoPrecioError = 'El precio debe ser mayor a 0';
          }
          break;
        case 'tipo':
          if (control.errors?.['required']) {
            this.productoTipoError = 'El tipo de producto es requerido';
          }
          break;
        case 'imagenes':
          if (control.errors?.['required']) {
            this.productoImagenesError = 'Las imágenes son requeridas';
          } else if (control.errors?.['validarTresImagenes']) {
            this.productoImagenesError = 'Debe seleccionar exactamente 3 imágenes';
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

  limpiarErroresProducto() {
    this.mensajeErrorProducto = '';
    this.productoNombreError = '';
    this.productoDescripcionError = '';
    this.productoTiempoError = '';
    this.productoPrecioError = '';
    this.productoImagenesError = '';
    this.productoTipoError = '';
  }

  limpiarMensajeErrorMesa() {
    this.mensajeErrorMesa = '';
    this.mensajeExitoMesa = '';
  }

  async registrarCliente() {
    this.limpiarErroresCliente();

    if (this.esAnonimo) {
      this.validarCampoCliente('nombre');
      this.validarCampoCliente('imagenPerfil');
      
      if (this.clienteNombreError || this.clienteImagenError) {
        return;
      }
    } else {
      this.validarCampoCliente('nombre');
      this.validarCampoCliente('apellido');
      this.validarCampoCliente('correo');
      this.validarCampoCliente('contrasenia');
      this.validarCampoCliente('dni');
      this.validarCampoCliente('imagenPerfil');

      if (this.clienteNombreError || this.clienteApellidoError || this.clienteCorreoError || 
          this.clienteContraseniaError || this.clienteDniError || this.clienteImagenError) {
        return;
      }
    }

    if (this.clienteForm.invalid) {
      this.mensajeError = 'Por favor completa todos los campos requeridos correctamente';
      return;
    }

    if (this.esAnonimo) {
      this.loadingService.show();
      
      try {
        const { nombre, apellido } = this.clienteForm.value;
        const archivo: File = this.clienteForm.value.imagenPerfil;

        let imagenPerfil = '';
        if (archivo) {
          const path = await this.sb.subirImagenPerfil(archivo);
          imagenPerfil = this.sb.supabase.storage.from('usuarios.img').getPublicUrl(path).data.publicUrl;
        }

        const nuevoClienteAnonimo = {
          nombre,
          apellido: apellido || '',
          correo: `anonimo${Math.floor(Math.random() * 1000000000000)}@tacomex.com`,
          dni: '00000000',
          imagenPerfil,
          anonimo: true
        };

        const { error } = await this.sb.supabase.from('clientes').insert([nuevoClienteAnonimo]);
        if (error) {
          this.mensajeError = 'Error al registrar cliente anónimo' + error.message;
          this.loadingService.hide();
          return;
        }

        const contraseniaAnonimo = '123456';
        await this.authService.registro(nuevoClienteAnonimo.correo, contraseniaAnonimo);

        await this.authService.logIn(nuevoClienteAnonimo.correo, contraseniaAnonimo);
        this.loadingService.show();
        this.router.navigate(['/home']);
        this.loadingService.hide();
        return;
      } catch (e) {
        this.mensajeError = 'Error inesperado: ' + (e as Error).message;
        console.error(e);
        this.loadingService.hide();
      }
      return;
    }

    this.loadingService.show();

    try {
      const { nombre, apellido, correo, contrasenia, dni } = this.clienteForm.value;
      const archivo: File = this.clienteForm.value.imagenPerfil;

      const usuario = await this.authService.registro(correo, contrasenia);
      if (!usuario) {
        this.clienteCorreoError = 'Este correo electrónico ya está en uso';
        this.loadingService.hide();
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
        this.loadingService.hide();
        return;
      }

      // TEMPORALMENTE DESHABILITADO - Notificaciones push
      /*
      this.http.post('https://tacomex-2025.onrender.com/notify-owner', {
        title: 'Nuevo Cliente Registrado',
        body: `El cliente ${nuevoCliente.nombre} ${nuevoCliente.apellido} se ha registrado.`
      }).subscribe({
        next: (res) => console.log('Notification request sent', res),
        error: (err) => console.error('Error sending notification request', err)
      });
      */

      this.mensajeExito = 'Registro exitoso. Bienvenido!';
      this.clienteForm.reset();
      this.imagenURL = null;
      this.loadingService.hide();
      
      setTimeout(() => {
        this.mensajeExito = '';
      }, 6000);
    } catch (e) {
      this.mensajeError = 'Error inesperado: ' + (e as Error).message;
      console.error(e);
      this.loadingService.hide();
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
      this.mensajeError = 'Por favor completa todos los campos requeridos correctamente';
      return;
    }

    this.loadingService.show();

    try {
      const { nombre, apellido, correo, contrasenia, dni, cuil, perfil } = this.empleadoForm.value;
      const archivo: File = this.empleadoForm.value.imagenPerfil;

      const usuario = await this.authService.registro(correo, contrasenia);
      if (!usuario) {
        this.empleadoCorreoError = 'Este correo electrónico ya está en uso';
        this.loadingService.hide();
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
        this.loadingService.hide();
        return;
      }

      this.mensajeExito = 'Empleado registrado!';
      this.empleadoForm.reset();
      this.imagenURLEmpleado = null;
      this.loadingService.hide();
      
      setTimeout(() => {
        this.mensajeExito = '';
      }, 6000);
    } catch (e) {
      this.mensajeError = 'Error inesperado: ' + (e as Error).message;
      console.error(e);
      this.loadingService.hide();
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
      this.mensajeError = 'Por favor completa todos los campos requeridos correctamente';
      return;
    }

    this.loadingService.show();

    try {
      const { nombre, apellido, correo, contrasenia, dni, cuil, perfil } = this.supervisorForm.value;
      const archivo: File = this.supervisorForm.value.imagenPerfil;

      const usuario = await this.authService.registro(correo, contrasenia);
      if (!usuario) {
        this.supervisorCorreoError = 'Este correo electrónico ya está en uso';
        this.loadingService.hide();
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
        this.loadingService.hide();
        return;
      }

      this.mensajeExito = 'Supervisor registrado!';
      this.supervisorForm.reset();
      this.imagenSupervisorURL = null;
      this.loadingService.hide();
      
      setTimeout(() => {
        this.mensajeExito = '';
      }, 6000);
    } catch (e) {
      this.mensajeError = 'Error inesperado: ' + (e as Error).message;
      console.error(e);
      this.loadingService.hide();
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
      this.mensajeErrorMesa = 'Por favor completa todos los campos requeridos correctamente';
      return;
    }

    this.loadingService.show();

    try {
      const { numero, comensales, tipo } = this.mesaForm.value;
      const archivo: File = this.mesaForm.value.imagen;

      const { data: mesaExistente } = await this.sb.supabase
        .from('mesas')
        .select('id')
        .eq('numero', numero)
        .single();
      if (mesaExistente) {
        this.mensajeErrorMesa = 'Número de mesa ya registrada';
        this.loadingService.hide();
        return;
      }

      let imagenMesa = '';
      if (archivo) {
        const { data, error } = await this.sb.supabase.storage
          .from('imagenes')
          .upload(`mesa-${numero}-${archivo.name}`, archivo, { upsert: true });

        if (error) throw new Error(error.message);

        imagenMesa = this.sb.supabase.storage
          .from('imagenes')
          .getPublicUrl(data.path).data.publicUrl;
      }

      try {
        const qrData = JSON.stringify({ numeroMesa: numero });
        const qrDataUrl = await toDataURL(qrData, { width: 512 });
        const qrBlob = dataURLtoBlob(qrDataUrl);
        const qrFileName = `mesa-${numero}-qr.png`;
        const { data: qrUpload, error: qrError } = await this.sb.supabase.storage
          .from('qrs')
          .upload(qrFileName, qrBlob, { upsert: true });
        if (qrError) throw new Error(qrError.message);
        const qrUrl = this.sb.supabase.storage.from('qrs').getPublicUrl(qrFileName).data.publicUrl;
        this.qrMesaURL = qrUrl;
      } catch (err) {
        console.error(err);
        throw new Error('No se pudo generar el código QR.');
      }

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
        this.loadingService.hide();
        return;
      }

      this.mensajeExitoMesa = 'Mesa registrada correctamente';
      this.mesaForm.reset();
      this.imagenMesaURL = null;
      this.imagenesMesaURLs = [];
      this.imagenesMesaArchivos = [];
      this.loadingService.hide();
      
      setTimeout(() => {
        this.mensajeExitoMesa = '';
      }, 6000);
    } catch (e: any) {
      this.mensajeErrorMesa = 'Error inesperado: ' + e.message;
      console.error(e);
      this.loadingService.hide();
    }
  }

  async registrarProducto() {
    this.limpiarErroresProducto();
    this.qrProductoURL = null;

    this.validarCampoProducto('nombre');
    this.validarCampoProducto('descripcion');
    this.validarCampoProducto('tiempoElaboracion');
    this.validarCampoProducto('precio');
    this.validarCampoProducto('tipo');
    this.validarCampoProducto('imagenes');

    if (this.productoNombreError || this.productoDescripcionError || this.productoTiempoError || 
        this.productoPrecioError || this.productoImagenesError || this.productoTipoError) {
      return;
    }

    if (this.productoForm.invalid) {
      this.mensajeErrorProducto = 'Por favor completa todos los campos requeridos correctamente';
      return;
    }

    this.loadingService.show();

    try {
      const { nombre, descripcion, tiempoElaboracion, precio, tipo } = this.productoForm.value;

      if (this.imagenesProductoArchivos.length !== 3) {
        this.productoImagenesError = 'Debe seleccionar exactamente 3 imágenes';
        this.loadingService.hide();
        return;
      }

      const imagenesURLs: string[] = [];
      for (let i = 0; i < 3; i++) {
        const archivo = this.imagenesProductoArchivos[i];
        const { data, error } = await this.sb.supabase.storage
          .from('imagenes')
          .upload(`producto-${nombre}-${i}-${archivo.name}`, archivo, { upsert: true });

        if (error) {
          throw new Error(error.message);
        }

        const imagenURL = this.sb.supabase.storage
          .from('imagenes')
          .getPublicUrl(data.path).data.publicUrl;
        
        imagenesURLs.push(imagenURL);
      }

      try {
        const qrData = JSON.stringify({ 
          nombreProducto: nombre,
          precio: precio,
          tiempoElaboracion: tiempoElaboracion,
        });
        const qrDataUrl = await toDataURL(qrData, { width: 512 });
        const qrBlob = dataURLtoBlob(qrDataUrl);
        const qrFileName = `producto-${nombre}-qr.png`;
        const { data: qrUpload, error: qrError } = await this.sb.supabase.storage
          .from('qrs')
          .upload(qrFileName, qrBlob, { upsert: true });
        if (qrError) throw new Error(qrError.message);
        const qrUrl = this.sb.supabase.storage.from('qrs').getPublicUrl(qrFileName).data.publicUrl;
        this.qrProductoURL = qrUrl;
      } catch (err) {
        console.error(err);
        throw new Error('No se pudo generar el código QR del producto.');
      }

      const nuevoProducto = {
        nombre,
        descripcion,
        tiempo_elaboracion: tiempoElaboracion,
        precio: parseFloat(precio),
        tipo,
        imagenes: imagenesURLs,
        qr: this.qrProductoURL
      };

      const { error } = await this.sb.supabase.from('productos').insert([nuevoProducto]);
      if (error) {
        this.mensajeErrorProducto = 'Error al registrar el producto: ' + error.message;
        this.loadingService.hide();
        return;
      }

      this.mensajeExitoProducto = 'Producto registrado correctamente';
      this.productoForm.reset();
      this.imagenesProductoURLs = [];
      this.imagenesProductoArchivos = [];
      this.loadingService.hide();
      
      setTimeout(() => {
        this.mensajeExitoProducto = '';
      }, 6000);
    } catch (e: any) {
      this.mensajeErrorProducto = 'Error inesperado: ' + e.message;
      console.error(e);
      this.loadingService.hide();
    }
  }

  alternarAnonimato() {
    this.esAnonimo = this.clienteForm.get('anonimo')?.value;
    if (this.esAnonimo) {
      this.clienteForm.get('apellido')?.disable();
      this.clienteForm.get('apellido')?.setValue('');
      this.clienteForm.get('correo')?.disable();
      this.clienteForm.get('contrasenia')?.disable();
      this.clienteForm.get('dni')?.disable();
      this.clienteForm.get('imagenPerfil')?.enable();
    } else {
      this.clienteForm.get('apellido')?.enable();
      this.clienteForm.get('correo')?.enable();
      this.clienteForm.get('contrasenia')?.enable();
      this.clienteForm.get('dni')?.enable();
      this.clienteForm.get('imagenPerfil')?.enable();
    }
  }

  irAlLogin() {
    this.loadingService.show();
    this.router.navigate(['/login']);
    this.loadingService.hide();
  }

  volverAlHome() {
    this.loadingService.show();
    this.router.navigate(['/home']);
    this.loadingService.hide();
  }

  onImagenSeleccionada(event: any) {
    if (this.tipoRegistro === 'producto') {
      const files: FileList = event.target.files;
      if (files && files.length > 0) {
        for (let i = 0; i < files.length && this.imagenesProductoArchivos.length < 3; i++) {
          this.agregarFotoProducto(files[i]);
        }
      }
      return;
    }
    const archivo = event.target.files[0];
    if (archivo) {
      let reader = new FileReader();
      reader.onload = () => {
        switch(this.tipoRegistro) {
          case 'mesa':
            this.imagenMesaURL = reader.result as string;
            break;
          case 'empleado':
            this.imagenURLEmpleado = reader.result as string;
            break;
          case 'supervisor':
            this.imagenSupervisorURL = reader.result as string;
            break;
          case 'cliente':
            this.imagenURL = reader.result as string;
            break;
        }
      };
      reader.readAsDataURL(archivo);

      switch(this.tipoRegistro) {
        case 'mesa':
          this.mesaForm.patchValue({ imagen: archivo });
          this.mesaForm.get('imagen')?.updateValueAndValidity();
          break;
        case 'empleado':
          this.empleadoForm.patchValue({ imagenPerfil: archivo });
          this.empleadoForm.get('imagenPerfil')?.updateValueAndValidity();
          break;
        case 'supervisor':
          this.supervisorForm.patchValue({ imagenPerfil: archivo });
          this.supervisorForm.get('imagenPerfil')?.updateValueAndValidity();
          break;
        case 'cliente':
          this.clienteForm.patchValue({ imagenPerfil: archivo });
          this.clienteForm.get('imagenPerfil')?.updateValueAndValidity();
          break;
      }
    }
  }

  tomarFoto() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';

    if (this.tipoRegistro === 'producto') {
      input.multiple = false;
    }

    input.onchange = (event: any) => {
      if (this.tipoRegistro === 'producto') {
        const archivo = event.target.files[0];
        if (archivo) {
          this.agregarFotoProducto(archivo);
        }
      } else {
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
            switch(this.tipoRegistro) {
              case 'cliente':
                this.imagenURL = reader.result as string;
                break;
              case 'empleado':
                this.imagenURLEmpleado = reader.result as string;
                break;
              case 'supervisor':
                this.imagenSupervisorURL = reader.result as string;
                break;
              case 'mesa':
                this.imagenMesaURL = reader.result as string;
                break;
            }
          };
          reader.readAsDataURL(archivo);
        }
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
      this.mensajeError = 'Error al escanear DNI';
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

  validarTresImagenes(control: any) {
    const imagenes = control.value;
    if (imagenes && imagenes.length !== 3) {
      return { validarTresImagenes: true };
    }
    return null;
  }

  agregarFotoProducto(archivo: File) {
    if (this.imagenesProductoArchivos.length >= 3) {
      this.productoImagenesError = 'Ya tienes 3 imágenes seleccionadas';
      return;
    }

    this.imagenesProductoArchivos.push(archivo);
    this.actualizarPreviewProducto();
    this.actualizarFormularioProducto();
  }

  eliminarFotoProducto(index: number) {
    this.imagenesProductoArchivos.splice(index, 1);
    this.actualizarPreviewProducto();
    this.actualizarFormularioProducto();
  }

  eliminarFotoCliente() {
    this.imagenURL = null;
    this.clienteForm.patchValue({ imagenPerfil: null });
    this.clienteForm.get('imagenPerfil')?.updateValueAndValidity();
  }

  eliminarFotoEmpleado() {
    this.imagenURLEmpleado = null;
    this.empleadoForm.patchValue({ imagenPerfil: null });
    this.empleadoForm.get('imagenPerfil')?.updateValueAndValidity();
  }

  actualizarPreviewProducto() {
    this.imagenesProductoURLs = [];
    this.imagenesProductoArchivos.forEach((archivo, index) => {
      const reader = new FileReader();
      reader.onload = () => {
        this.imagenesProductoURLs[index] = reader.result as string;
      };
      reader.readAsDataURL(archivo);
    });
  }

  actualizarFormularioProducto() {
    const dataTransfer = new DataTransfer();
    this.imagenesProductoArchivos.forEach(archivo => {
      dataTransfer.items.add(archivo);
    });
    
    this.productoForm.patchValue({ imagenes: dataTransfer.files });
    this.productoForm.get('imagenes')?.updateValueAndValidity();
  }

  setTipoRegistro(tipo: 'cliente' | 'empleado' | 'supervisor' | 'mesa' | 'producto') {
    if (this.esMaitre && !this.esAdmin && tipo !== 'cliente') {
      this.tipoRegistro = 'cliente';
      return;
    }
    
    if (this.esAdmin && (this.perfilUsuario === 'dueño' || this.perfilUsuario === 'supervisor') && tipo === 'cliente') {
      this.tipoRegistro = 'supervisor';
      return;
    }

    if ((this.esBartender || this.esCocinero) && tipo !== 'producto') {
      this.tipoRegistro = 'producto';
      return;
    }
    
    this.tipoRegistro = tipo;
    this.mensajeError = '';
    this.mensajeExito = '';
    this.imagenURL = null;
    this.mensajeErrorMesa = '';
    this.mensajeExitoMesa = '';
    this.imagenMesaURL = null;
    this.qrMesaURL = null;
    this.mensajeErrorProducto = '';
    this.mensajeExitoProducto = '';
    this.qrProductoURL = null;
    this.imagenesProductoURLs = [];
    this.imagenesProductoArchivos = [];

    if (tipo !== 'cliente') this.clienteForm.reset();
    if (tipo !== 'empleado') this.empleadoForm.reset();
    if (tipo !== 'supervisor') this.supervisorForm.reset();
    if (tipo !== 'mesa') this.mesaForm.reset();
    if (tipo !== 'producto') this.productoForm.reset();
  }

  onImagenSupervisorSeleccionada(event: any) {
    const file = event.target.files && event.target.files[0];
    if (!file) {
      this.supervisorImagenError = 'No se seleccionó ninguna imagen.';
      return;
    }

    this.imagenSupervisorArchivo = file;

    const reader = new FileReader();
    reader.onload = () => {
      this.imagenSupervisorURL = reader.result as string;
      console.log('Imagen cargada:', this.imagenSupervisorURL); // Debug
    };
    reader.readAsDataURL(file);
  }

  eliminarFotoSupervisor() {
    this.imagenSupervisorArchivo = null;
    this.imagenSupervisorURL = null;
  }

  onImagenMesaSeleccionada(event: any) {
    const files = event.target.files;
    for (let i = 0; i < files.length; i++) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagenesMesaURLs.push(e.target.result);
      };
      reader.readAsDataURL(files[i]);
      this.imagenesMesaArchivos.push(files[i]);
    }
  }

  eliminarFotoMesa() {
    this.imagenMesaURL = null;
    this.mesaForm.patchValue({ imagen: null });
    this.mesaForm.get('imagen')?.updateValueAndValidity();
  }

}

function dataURLtoBlob(dataurl: string) {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

