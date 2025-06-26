import { inject, Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { User } from '@supabase/supabase-js';
import { Router } from '@angular/router';
// import { PushNotificationService } from './push-notification.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  sb = inject(SupabaseService);
  router = inject(Router);
  usuarioActual: User | null = null;
  esAdmin: boolean = false;
  esMaitre: boolean = false;
  perfilUsuario: string = '';

  constructor(
    // private pushNotificationService: PushNotificationService
  ) { }

  async logIn(correo: string, contrasenia: string) {
    const { data, error } = await this.sb.supabase.auth.signInWithPassword({
      email: correo,
      password: contrasenia
    });

    if (error) throw error;

    this.usuarioActual = data?.user || null;

    const { data: empleado } = await this.sb.supabase
      .from('empleados')
      .select('*')
      .eq('correo', correo)
      .single();

    const { data: cliente } = await this.sb.supabase
      .from('clientes')
      .select('id')
      .eq('correo', correo)
      .single();

    const { data: supervisor } = await this.sb.supabase
      .from('supervisores')
      .select('id')
      .eq('correo', correo)
      .single();

    this.esAdmin = !!supervisor;
    
    if (empleado && empleado.perfil === 'maitre') {
      this.esMaitre = true;
      this.perfilUsuario = 'maitre';
    } else if (supervisor) {
      this.perfilUsuario = 'supervisor';
    } else if (empleado) {
      this.perfilUsuario = empleado.perfil;
    } else if (cliente) {
      this.perfilUsuario = 'cliente';
    }

    // Inicializar notificaciones push después del login exitoso
    // TEMPORALMENTE DESHABILITADO
    /*
    try {
      await this.pushNotificationService.initializePushNotifications();
    } catch (error) {
      // No bloquear la app si fallan las notificaciones
    }
    */

    return this.usuarioActual;
  }

  async registro(correo: string, contrasenia: string) {
    const { data, error } = await this.sb.supabase.auth.signUp({
      email: correo,
      password: contrasenia
    });

    if (error) {
      return null;
    }

    this.usuarioActual = data?.user || null;
    return this.usuarioActual;
  }

  esUsuarioAdmin() {
    return this.esAdmin;
  }

  esUsuarioMaitre() {
    return this.esMaitre;
  }

  esUsuarioBartender() {
    return this.perfilUsuario === 'bartender';
  }

  esUsuarioCocinero() {
    return this.perfilUsuario === 'cocinero';
  }

  puedeAccederARegistro() {
    return this.esAdmin || this.esMaitre || this.esUsuarioBartender() || this.esUsuarioCocinero();
  }

  getPerfilUsuario() {
    return this.perfilUsuario;
  }

  async signOut() {
    // Limpiar notificaciones push antes del logout
    // TEMPORALMENTE DESHABILITADO
    /*
    try {
      await this.pushNotificationService.cleanup();
    } catch (error) {
      console.error('Error al limpiar notificaciones:', error);
    }
    */
    
    await this.sb.supabase.auth.signOut();
    this.usuarioActual = null;
    this.esAdmin = false;
    this.esMaitre = false;
    this.perfilUsuario = '';
  }

  async getCurrentUser() {
    try {
      return await this.sb.supabase.auth.getUser();
    } catch (error) {
      await this.clearAuthAndRedirect();
      return { data: { user: null }, error };
    }
  }

  async clearAuthAndRedirect() {
    // Limpiar notificaciones
    // TEMPORALMENTE DESHABILITADO
    /*
    try {
      await this.pushNotificationService.cleanup();
    } catch (error) {
      // No bloquear la app si fallan las notificaciones
    }
    */

    await this.sb.supabase.auth.signOut();
    
    this.usuarioActual = null;
    this.esAdmin = false;
    this.esMaitre = false;
    this.perfilUsuario = '';

    this.router.navigateByUrl('/login', { replaceUrl: true });
  }

  async guardarPushToken(userId: string, token: string) {
    try {
      const { data: user } = await this.sb.supabase.auth.getUser();
      
      if (!user?.user) {
        console.log('No hay usuario autenticado');
        return;
      }

      const email = user.user.email;

      const { data: supervisor } = await this.sb.supabase
        .from('supervisores')
        .select('id')
        .eq('correo', email)
        .single();

      const { data: empleado } = await this.sb.supabase
        .from('empleados')
        .select('id')
        .eq('correo', email)
        .single();

      const { data: cliente } = await this.sb.supabase
        .from('clientes')
        .select('id')
        .eq('correo', email)
        .single();

      let tableName = '';
      let updateData = { fcm_token: token };

      if (supervisor) {
        tableName = 'supervisores';
      } else if (empleado) {
        tableName = 'empleados';
      } else if (cliente) {
        tableName = 'clientes';
      } else {
        console.log('Usuario no encontrado en ninguna tabla');
        return;
      }

      const { error } = await this.sb.supabase
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
}
