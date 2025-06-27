import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { LoadingSpinnerComponent } from './componentes/loading-spinner/loading-spinner.component';
import { LoadingService } from './servicios/loading.service';
import { SplashScreen } from '@capacitor/splash-screen';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet, LoadingSpinnerComponent, HttpClientModule],
  providers: [LoadingService]
})
export class AppComponent {
  constructor() {
    SplashScreen.hide();
    this.setupBarcodeScanner();
  }

  private async setupBarcodeScanner() {
    try {
      await BarcodeScanner.installGoogleBarcodeScannerModule();
      console.log('Google Barcode Scanner Module instalado correctamente');
    } catch (error) {
      console.error('Error al instalar el módulo de escaneo:', error);
    }
  }
}