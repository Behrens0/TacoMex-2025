import { Component, OnInit } from '@angular/core';
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
export class ListaEsperaComponent implements OnInit {
  listaEspera: ClienteEnLista[] = [];
  loading: boolean = false;

  constructor(
    private supabase: SupabaseService,
    private loadingService: LoadingService,
    private router: Router
  ) { }

  ngOnInit() {
    this.cargarListaEspera();
  }

  ionViewWillEnter() {
    this.cargarListaEspera();
  }

  async cargarListaEspera() {
    this.loading = true;
    this.loadingService.show();

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
      this.loading = false;
      this.loadingService.hide();
    }
  }

  volverAHome() {
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
