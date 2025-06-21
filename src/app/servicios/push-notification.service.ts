import { Injectable } from '@angular/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root'
})
export class PushNotificationService {

  constructor(
    private supabase: SupabaseService
  ) {}

  async initializePushNotifications() {
    try {
      // Verificar si el plugin está disponible
      if (!PushNotifications) {
        console.log('PushNotifications plugin no disponible');
        return;
      }

      // Solicitar permisos
      const permission = await PushNotifications.requestPermissions();
      
      if (permission.receive === 'granted') {
        // Registrar para recibir notificaciones
        await PushNotifications.register();
        
        // Escuchar cuando se recibe el token
        PushNotifications.addListener('registration', (token) => {
          console.log('FCM Token recibido:', token.value);
          this.saveTokenToDatabase(token.value);
        });

        // Escuchar cuando se recibe una notificación
        PushNotifications.addListener('pushNotificationReceived', (notification) => {
          console.log('Notificación recibida:', notification);
        });

        // Escuchar cuando se hace clic en una notificación
        PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
          console.log('Notificación clickeada:', notification);
        });

      } else {
        console.log('Permisos de notificación denegados');
      }
    } catch (error) {
      console.error('Error al inicializar notificaciones push:', error);
      // No lanzar el error para no romper la app
    }
  }

  private async saveTokenToDatabase(token: string) {
    try {
      const { data: user } = await this.supabase.supabase.auth.getUser();
      
      if (!user?.user) {
        console.log('No hay usuario autenticado');
        return;
      }

      const email = user.user.email;
      
      // Determinar el perfil del usuario consultando las tablas
      const { data: supervisor } = await this.supabase.supabase
        .from('supervisores')
        .select('perfil')
        .eq('correo', email)
        .single();

      const { data: empleado } = await this.supabase.supabase
        .from('empleados')
        .select('perfil')
        .eq('correo', email)
        .single();

      // Determinar en qué tabla guardar el token según el perfil
      let tableName = '';
      let updateData = { fcm_token: token };

      if (supervisor) {
        tableName = 'supervisores';
      } else if (empleado) {
        tableName = 'empleados';
      } else {
        tableName = 'clientes';
      }

      // Actualizar el token en la base de datos
      const { error } = await this.supabase.supabase
        .from(tableName)
        .update(updateData)
        .eq('correo', email);

      if (error) {
        console.error('Error al guardar FCM token:', error);
      } else {
        console.log('FCM token guardado exitosamente en', tableName);
      }

    } catch (error) {
      console.error('Error al guardar token en base de datos:', error);
    }
  }

  async removeTokenFromDatabase() {
    try {
      const { data: user } = await this.supabase.supabase.auth.getUser();
      
      if (!user?.user) {
        console.log('No hay usuario autenticado');
        return;
      }

      const email = user.user.email;
      
      // Determinar el perfil del usuario consultando las tablas
      const { data: supervisor } = await this.supabase.supabase
        .from('supervisores')
        .select('perfil')
        .eq('correo', email)
        .single();

      const { data: empleado } = await this.supabase.supabase
        .from('empleados')
        .select('perfil')
        .eq('correo', email)
        .single();

      // Determinar en qué tabla eliminar el token según el perfil
      let tableName = '';
      let updateData = { fcm_token: null };

      if (supervisor) {
        tableName = 'supervisores';
      } else if (empleado) {
        tableName = 'empleados';
      } else {
        tableName = 'clientes';
      }

      // Eliminar el token de la base de datos
      const { error } = await this.supabase.supabase
        .from(tableName)
        .update(updateData)
        .eq('correo', email);

      if (error) {
        console.error('Error al eliminar FCM token:', error);
      } else {
        console.log('FCM token eliminado exitosamente de', tableName);
      }

    } catch (error) {
      console.error('Error al eliminar token de base de datos:', error);
    }
  }

  async cleanup() {
    try {
      // Remover listeners
      await PushNotifications.removeAllListeners();
      
      // Eliminar token de la base de datos
      await this.removeTokenFromDatabase();
      
    } catch (error) {
      console.error('Error en cleanup de notificaciones:', error);
    }
  }
} 