import { Component, OnInit, ViewChild } from '@angular/core';
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
  imports: [CommonModule, IonicModule, ReactiveFormsModule, FormsModule,IonCheckbox],
  templateUrl: './registro.component.html',
  styleUrls: ['./registro.component.scss']
})
export class RegistroComponent implements OnInit {
  @ViewChild(QRCodeComponent, { static: false }) qrMesaComponent!: QRCodeComponent;

  clienteForm: FormGroup;
  empleadoForm: FormGroup;
  supervisorForm: FormGroup;
  mesaForm: FormGroup;
  mensajeExito: string = '';
  mensajeError: string = '';
  mensajeExitoMesa: string = '';
  mensajeErrorMesa: string = '';
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
      anonimo: [false],
      nombre: ['', [Validators.required, Validators.pattern(/^[A-Za-zÀ-ÿ\s]+$/)]],
      apellido: ['', [Validators.required, Validators.pattern(/^[A-Za-zÀ-ÿ\s]+$/)]],
      correo: ['', [Validators.required, Validators.email]],
      contrasenia: ['', [Validators.required, Validators.minLength(6)]],
      dni: ['', [Validators.required, Validators.pattern(/^\d{7,8}$/)]],
      imagenPerfil: [null, Validators.required]
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
      perfil: ['supervisor', Validators.required]
    });
    this.mesaForm = this.fb.group({
      numero: ['', Validators.required],
      comensales: ['', Validators.required],
      tipo: ['', Validators.required],
      imagen: [null, Validators.required]
    });
  }

  ngOnInit() {
    this.esAdmin = this.authService.esUsuarioAdmin();

    this.clienteForm.get('anonimo')?.valueChanges.subscribe((anonimo) => {
      if (anonimo) {
        this.clienteForm.patchValue({
          correo: '',
          contrasenia: '',
          dni: '',
          imagenPerfil: null
        });
      }
    });
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
    this.mensajeExito = '';
    this.mensajeError = '';

    if (this.empleadoForm.invalid) {
      this.mensajeError = 'Por favor completa todos los campos requeridos correctamente.';
      return;
    }

    try {
      const { nombre, apellido, correo, contrasenia, dni, cuil, perfil } = this.empleadoForm.value;
      const archivo: File = this.empleadoForm.value.imagenPerfil;

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
          this.emailEnUso = true;
          this.mensajeError = '';
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
  

  async registrarMesa() {
  this.mensajeExitoMesa = '';
  this.mensajeErrorMesa = '';
  this.qrMesaURL = null;

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