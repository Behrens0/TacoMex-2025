import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { LoadingSpinnerComponent } from './componentes/loading-spinner/loading-spinner.component';
import { LoadingService } from './servicios/loading.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet, LoadingSpinnerComponent],
  providers: [LoadingService]
})
export class AppComponent {
  constructor() {}
}
