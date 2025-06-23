import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonList, IonItem, IonLabel, IonHeader, IonToolbar, IonTitle, IonButton, IonIcon, IonBackButton, IonButtons } from '@ionic/angular/standalone';
import { SupabaseService } from '../../servicios/supabase.service';
import { LoadingService } from '../../servicios/loading.service';
import { Router } from '@angular/router';

interface ClienteEnLista {
  id: number;
  nombre: string;
  apellido: string;
  correo: string;
  fecha_ingreso: string;
}

@Component({
  selector: 'app-lista-espera',
  templateUrl: './lista-espera.component.html',
  styleUrls: ['./lista-espera.component.scss'],
  imports: [
    CommonModule,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButton,
    IonIcon,
    IonBackButton,
    IonButtons
  ],
  standalone: true
})
export class ListaEsperaComponent implements OnInit, OnDestroy {
  listaEspera: ClienteEnLista[] = [];
  cargando: boolean = false;
  private intervaloId: any;

  constructor(
    private supabase: SupabaseService,
    private loadingService: LoadingService,
    private router: Router
  ) { }

  ngOnInit() {
    this.cargarListaEspera();
    this.iniciarActualizacionAutomatica();
  }

  ngOnDestroy() {
    this.detenerActualizacionAutomatica();
  }

  ionViewWillEnter() {
    this.cargarListaEspera();
    this.iniciarActualizacionAutomatica();
  }

  ionViewWillLeave() {
    this.detenerActualizacionAutomatica();
  }

  private iniciarActualizacionAutomatica() {
    this.intervaloId = setInterval(() => {
      this.cargarListaEspera(false);
    }, 10000);
  }

  private detenerActualizacionAutomatica() {
    if (this.intervaloId) {
      clearInterval(this.intervaloId);
      this.intervaloId = null;
    }
  }

  async cargarListaEspera(mostrarCargando: boolean = true) {
    if (mostrarCargando) {
      this.cargando = true;
      this.loadingService.show();
    }

    try {
      const { data, error } = await this.supabase.supabase
        .from('lista_espera')
        .select('id, nombre, apellido, correo, fecha_ingreso')
        .order('fecha_ingreso', { ascending: true });

      if (error) {
        console.error('Error al cargar lista de espera:', error);
        this.listaEspera = [];
      } else {
        this.listaEspera = data || [];
      }
    } catch (error) {
      console.error('Error inesperado:', error);
      this.listaEspera = [];
    } finally {
      if (mostrarCargando) {
        this.cargando = false;
        this.loadingService.hide();
      }
    }
  }

  volverAHome() {
    this.detenerActualizacionAutomatica();
    this.router.navigate(['/home']);
  }

  formatearFecha(fecha: string): string {
    try {
      const fechaObj = new Date(fecha);
      return fechaObj.toLocaleString('es-AR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'America/Argentina/Buenos_Aires'
      });
    } catch (error) {
      return fecha;
    }
  }
}
