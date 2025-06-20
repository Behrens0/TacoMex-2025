import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from 'src/app/servicios/supabase.service';
import { AuthService } from 'src/app/servicios/auth.service';
import { LoadingService } from 'src/app/servicios/loading.service';
import { PushNotificationService } from 'src/app/servicios/push-notification.service';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonContent, IonButton, IonIcon, AlertController } from '@ionic/angular/standalone';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';

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
  isSupported = false;
  perfilUsuario: string = '';
  user: any = null;

  constructor(
    private authService: AuthService,
    private supabase: SupabaseService,
    private router: Router,
    private loadingService: LoadingService,
    private alertController: AlertController,
    private pushNotificationService: PushNotificationService
  ) {}

  ngOnInit() {
    this.mostrarBotonRegistro = this.authService.puedeAccederARegistro() && this.router.url !== '/registro';
    this.perfilUsuario = this.authService.getPerfilUsuario();

    BarcodeScanner.isSupported().then((result) => {
      this.isSupported = result.supported;
    });
  }

  irARegistro() {
    this.loadingService.show();
    this.router.navigate(['/registro']);
    this.loadingService.hide();
  }

  irAListaEspera() {
    this.loadingService.show();
    this.router.navigate(['/lista-espera']);
    this.loadingService.hide();
  }

  ionViewWillEnter() {
    this.loadUser();
  }

  async loadUser() {
    const { data, error } = await this.authService.getCurrentUser();
    this.user = data?.user;

    if (!this.user) {
      this.router.navigateByUrl('/login');
    } else {
      // Inicializar notificaciones push si el usuario ya está logueado
      await this.pushNotificationService.initializePushNotifications();
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

  async scanQR() {
    this.loadingService.show();
    
    try {
      const { barcodes } = await BarcodeScanner.scan();
      
      if (barcodes.length > 0) {
        const scannedCode = barcodes[0].displayValue;
        await this.processScannedCode(scannedCode);
      } else {
        await this.showAlert('Error', 'No se detectó ningún código QR.');
      }
    } catch (error) {
      console.error('Error al escanear:', error);
      await this.showAlert('Error', 'Error al escanear el código QR.');
    } finally {
      this.loadingService.hide();
    }
  }

  async processScannedCode(code: string) {
    const expectedCode = 'b71c9d3a4e1f5a62c3340b87df0e8a129cab6e3d';
    
    if (code === expectedCode) {
      await this.agregarAListaEspera();
    } else {
      await this.showAlert('Código inválido', 'El código QR escaneado no es válido para la lista de espera.');
    }
  }

  async agregarAListaEspera() {
    try {
      if (!this.user) {
        await this.showAlert('Error', 'No se pudo obtener la información del usuario.');
        return;
      }

      const { data: clienteEnLista } = await this.supabase.supabase
        .from('lista_espera')
        .select('*')
        .eq('correo', this.user.email)
        .single();

      if (clienteEnLista) {
        await this.showAlert('Ya en Lista', 'Ya estás en la lista de espera.');
        return;
      }

      const { data: cliente, error: errorCliente } = await this.supabase.supabase
        .from('clientes')
        .select('nombre, apellido, correo')
        .eq('correo', this.user.email)
        .single();

      if (errorCliente || !cliente) {
        await this.showAlert('Error', 'No se pudo obtener la información del cliente.');
        return;
      }

      const now = new Date();
      const fechaFormateada = now.toLocaleString('es-AR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'America/Argentina/Buenos_Aires'
      });

      const [fecha, hora] = fechaFormateada.replace(',', '').split(' ');
      const [dia, mes, anio] = fecha.split('/');
      const fechaFinal = `${anio}-${mes}-${dia} ${hora}:00`;

      const { error: errorInsert } = await this.supabase.supabase
        .from('lista_espera')
        .insert([{
          nombre: cliente.nombre,
          apellido: cliente.apellido,
          correo: cliente.correo,
          fecha_ingreso: fechaFinal
        }]);

      if (errorInsert) {
        await this.showAlert('Error', 'No se pudo agregar a la lista de espera: ' + errorInsert.message);
        return;
      }

      await this.showAlert('Éxito', 'Has sido agregado exitosamente a la lista de espera.');
      
    } catch (error) {
      console.error('Error al agregar a lista de espera:', error);
      await this.showAlert('Error', 'Error inesperado al agregar a la lista de espera.');
    }
  }

  async showAlert(titulo: string, mensaje: string) {
    const alert = await this.alertController.create({
      header: titulo,
      message: mensaje,
      buttons: ['OK']
    });
    await alert.present();
  }
}
