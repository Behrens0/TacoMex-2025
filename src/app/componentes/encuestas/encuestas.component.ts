import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonContent, IonButton, IonIcon, IonHeader, IonToolbar, IonTitle, IonItem, IonLabel, IonInput, IonRange, IonRadioGroup, IonRadio, IonCheckbox, IonSelect, IonSelectOption, IonTextarea, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonGrid, IonRow, IonCol, IonImg, IonAlert, IonBackButton, IonButtons, IonSpinner, AlertController } from '@ionic/angular/standalone';
import { SupabaseService } from '../../servicios/supabase.service';
import { LoadingService } from '../../servicios/loading.service';
import { Router } from '@angular/router';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface Encuesta {
  id?: number;
  nombre: string;
  apellido: string;
  correo: string;
  satisfaccion_general: number;
  calidad_comida: number;
  calidad_servicio: number;
  ambiente: number;
  recomendacion: string;
  volverias: boolean;
  tipo_visita: string;
  comentario: string;
  imagenes: string[];
}

@Component({
  selector: 'app-encuestas',
  templateUrl: './encuestas.component.html',
  styleUrls: ['./encuestas.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonContent,
    IonButton,
    IonIcon,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonItem,
    IonLabel,
    IonInput,
    IonRange,
    IonRadioGroup,
    IonRadio,
    IonCheckbox,
    IonSelect,
    IonSelectOption,
    IonTextarea,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonGrid,
    IonRow,
    IonCol,
    IonImg,
    IonAlert,
    IonBackButton,
    IonButtons,
    IonSpinner
  ],
  standalone: true
})
export class EncuestasComponent implements OnInit {
  encuestaForm: FormGroup;
  fotos: string[] = [];
  maxFotos = 3;
  encuestas: Encuesta[] = [];
  mostrarGraficos = false;
  loading = false;
  user: any = null;
  clientInfo: any = null;
  mensajeExito = '';
  mostrarMensajeExito = false;
  encuestaEnviada = false;

  constructor(
    private fb: FormBuilder,
    private supabase: SupabaseService,
    private loadingService: LoadingService,
    private router: Router,
    private alertController: AlertController
  ) {
    this.encuestaForm = this.fb.group({
      satisfaccion_general: [5, [Validators.required, Validators.min(1), Validators.max(10)]],
      calidad_comida: [5, [Validators.required, Validators.min(1), Validators.max(10)]],
      calidad_servicio: [5, [Validators.required, Validators.min(1), Validators.max(10)]],
      ambiente: [5, [Validators.required, Validators.min(1), Validators.max(10)]],
      recomendacion: ['', Validators.required],
      volverias: [true, Validators.required],
      tipo_visita: ['', Validators.required],
      comentario: ['', Validators.maxLength(500)]
    });
  }

  ngOnInit() {
    this.cargarUsuario();
  }

  async cargarUsuario() {
    try {
      const { data } = await this.supabase.supabase.auth.getUser();
      this.user = data?.user;
      
      if (!this.user) {
        await this.mostrarAlerta('Error', 'No se pudo obtener la información del usuario. Por favor, inicie sesión nuevamente.');
        this.router.navigate(['/login']);
        return;
      }

      const { data: clientData, error: clientError } = await this.supabase.supabase
        .from('clientes')
        .select('*')
        .eq('correo', this.user.email)
        .single();

      if (clientError) {
        console.error('Error al cargar información del cliente:', clientError);
        await this.mostrarAlerta('Error', 'No se pudo obtener la información del cliente.');
        this.router.navigate(['/login']);
        return;
      }

      if (clientData) {
        this.clientInfo = clientData;
      } else {
        await this.mostrarAlerta('Error', 'No se encontró información del cliente.');
        this.router.navigate(['/login']);
        return;
      }
    } catch (error) {
      console.error('Error al cargar usuario:', error);
      await this.mostrarAlerta('Error', 'Error al cargar la información del usuario.');
    }
  }

  async cargarEncuestas() {
    this.loading = true;
    try {
      const { data, error } = await this.supabase.supabase
        .from('encuesta_satisfaccion')
        .select('nombre, apellido, correo, satisfaccion_general, calidad_comida, calidad_servicio, ambiente, recomendacion, volverias, tipo_visita, comentario, imagenes')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error al cargar encuestas:', error);
        await this.mostrarAlerta('Error', 'No se pudieron cargar las encuestas existentes.');
      } else {
        this.encuestas = data || [];
      }
    } catch (error) {
      console.error('Error inesperado:', error);
      await this.mostrarAlerta('Error', 'Error inesperado al cargar las encuestas.');
    } finally {
      this.loading = false;
    }
  }

  async tomarFoto() {
    if (this.fotos.length >= this.maxFotos) {
      await this.mostrarAlerta('Límite alcanzado', 'Ya has agregado el máximo de 3 fotos permitidas.');
      return;
    }

    try {
      const imagen = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera
      });

      if (imagen.base64String) {
        this.fotos.push(`data:image/jpeg;base64,${imagen.base64String}`);
      }
    } catch (error) {
      console.error('Error al tomar foto:', error);
      await this.mostrarAlerta('Error', 'No se pudo tomar la foto. Verifique los permisos de cámara.');
    }
  }

  eliminarFoto(index: number) {
    this.fotos.splice(index, 1);
  }

  async subirImagenesAStorage(): Promise<string[]> {
    const urls: string[] = [];
    
    for (let i = 0; i < this.fotos.length; i++) {
      try {
        if (!this.fotos[i].startsWith('data:image/')) {
          throw new Error('Formato de imagen inválido');
        }

        const base64String = this.fotos[i].split(',')[1];
        
        if (!base64String) {
          throw new Error('Datos Base64 inválidos');
        }

        const byteCharacters = atob(base64String);
        const byteNumbers = new Array(byteCharacters.length);
        
        for (let j = 0; j < byteCharacters.length; j++) {
          byteNumbers[j] = byteCharacters.charCodeAt(j);
        }
        
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'image/jpeg' });
        const archivo = new File([blob], `encuesta_${i}.jpg`, { type: 'image/jpeg' });
        
        const url = await this.supabase.subirImagenEncuesta(archivo, this.clientInfo.correo, i);
        urls.push(url);
      } catch (error) {
        console.error(`Error al procesar imagen ${i + 1}:`, error);
        if (error instanceof Error) {
          throw new Error(`Error al subir la imagen ${i + 1}: ${error.message}`);
        } else {
          throw new Error(`Error al subir la imagen ${i + 1}: Error desconocido`);
        }
      }
    }
    
    return urls;
  }

  async enviarEncuesta() {
    if (!this.encuestaForm.valid) {
      await this.mostrarAlerta('Formulario incompleto', 'Por favor complete todos los campos requeridos.');
      return;
    }

    if (!this.user) {
      await this.mostrarAlerta('Error', 'No se pudo obtener la información del usuario.');
      return;
    }

    if (!this.clientInfo) {
      await this.mostrarAlerta('Error', 'No se pudo obtener la información del cliente.');
      return;
    }

    this.loadingService.show();
    
    try {
      const formData = this.encuestaForm.value;

      let urlsImagenes: string[] = [];
      if (this.fotos.length > 0) {
        try {
          urlsImagenes = await this.subirImagenesAStorage();
        } catch (error) {
          await this.mostrarAlerta('Error', `Error al subir las imágenes: ${error}`);
          this.loadingService.hide();
          return;
        }
      }

      const encuestaData = {
        nombre: this.clientInfo.nombre,
        apellido: this.clientInfo.apellido,
        correo: this.clientInfo.correo,
        satisfaccion_general: formData.satisfaccion_general,
        calidad_comida: formData.calidad_comida,
        calidad_servicio: formData.calidad_servicio,
        ambiente: formData.ambiente,
        recomendacion: formData.recomendacion,
        volverias: formData.volverias,
        tipo_visita: formData.tipo_visita,
        comentario: formData.comentario,
        imagenes: urlsImagenes
      };

      const { error } = await this.supabase.supabase
        .from('encuesta_satisfaccion')
        .insert([encuestaData]);

      if (error) {
        console.error('Error al enviar encuesta:', error);
        const errorMessage = error.message || 'Error desconocido';
        await this.mostrarAlerta('Error al enviar encuesta', `Detalles del error: ${errorMessage}`);
      } else {
        this.mensajeExito = '¡Encuesta enviada exitosamente!';
        this.mostrarMensajeExito = true;
        
        setTimeout(() => {
          this.mostrarMensajeExito = false;
          this.mensajeExito = '';
        }, 6000);

        this.encuestaForm.reset({
          satisfaccion_general: 5,
          calidad_comida: 5,
          calidad_servicio: 5,
          ambiente: 5,
          volverias: true
        });
        this.fotos = [];
        this.mostrarGraficos = true;
        this.encuestaEnviada = true;
      }
    } catch (error) {
      console.error('Error inesperado:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      await this.mostrarAlerta('Error inesperado', `Error al enviar la encuesta: ${errorMessage}`);
    } finally {
      this.loadingService.hide();
    }
  }

  async mostrarAlerta(titulo: string, mensaje: string) {
    const alert = await this.alertController.create({
      header: titulo,
      message: mensaje,
      buttons: ['OK']
    });
    await alert.present();
  }

  async mostrarEstadisticas() {
    this.mostrarGraficos = true;
    await this.cargarEncuestas();
    setTimeout(() => {
      this.crearGraficos();
    }, 100);
  }

  crearGraficos() {
    if (this.encuestas.length === 0) return;

    const ctx1 = document.getElementById('satisfaccionChart') as HTMLCanvasElement;
    if (ctx1) {
      new Chart(ctx1, {
        type: 'bar',
        data: {
          labels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
          datasets: [{
            label: 'Satisfacción General',
            data: this.calcularDistribucion('satisfaccion_general'),
            backgroundColor: 'rgba(76, 175, 80, 0.8)'
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true
            }
          }
        }
      });
    }

    const ctx2 = document.getElementById('recomendacionChart') as HTMLCanvasElement;
    if (ctx2) {
      const recomendaciones = this.encuestas.map(e => e.recomendacion);
      const distribucion = {
        'Definitivamente sí': recomendaciones.filter(r => r === 'Definitivamente sí').length,
        'Probablemente sí': recomendaciones.filter(r => r === 'Probablemente sí').length,
        'No estoy seguro': recomendaciones.filter(r => r === 'No estoy seguro').length,
        'Probablemente no': recomendaciones.filter(r => r === 'Probablemente no').length,
        'Definitivamente no': recomendaciones.filter(r => r === 'Definitivamente no').length
      };

      new Chart(ctx2, {
        type: 'doughnut',
        data: {
          labels: Object.keys(distribucion),
          datasets: [{
            data: Object.values(distribucion),
            backgroundColor: [
              'rgba(76, 175, 80, 0.8)',
              'rgba(139, 195, 74, 0.8)',
              'rgba(255, 193, 7, 0.8)',
              'rgba(255, 152, 0, 0.8)',
              'rgba(244, 67, 54, 0.8)'
            ]
          }]
        },
        options: {
          responsive: true
        }
      });
    }

    const ctx3 = document.getElementById('volveriaChart') as HTMLCanvasElement;
    if (ctx3) {
      const volveria = this.encuestas.map(e => e.volverias);
      const distribucion = {
        'Sí': volveria.filter(v => v).length,
        'No': volveria.filter(v => !v).length
      };

      new Chart(ctx3, {
        type: 'pie',
        data: {
          labels: Object.keys(distribucion),
          datasets: [{
            data: Object.values(distribucion),
            backgroundColor: [
              'rgba(76, 175, 80, 0.8)',
              'rgba(244, 67, 54, 0.8)'
            ]
          }]
        },
        options: {
          responsive: true
        }
      });
    }
  }

  calcularDistribucion(campo: string): number[] {
    const distribucion = new Array(10).fill(0);
    this.encuestas.forEach(encuesta => {
      const valor = encuesta[campo as keyof Encuesta] as number;
      if (valor >= 1 && valor <= 10) {
        distribucion[valor - 1]++;
      }
    });
    return distribucion;
  }

  volverAHome() {
    this.router.navigate(['/home']);
  }

  nuevaEncuesta() {
    this.encuestaEnviada = false;
    this.mostrarGraficos = false;
    this.encuestaForm.reset({
      satisfaccion_general: 5,
      calidad_comida: 5,
      calidad_servicio: 5,
      ambiente: 5,
      volverias: true
    });
    this.fotos = [];
    this.mensajeExito = '';
    this.mostrarMensajeExito = false;
  }
}
