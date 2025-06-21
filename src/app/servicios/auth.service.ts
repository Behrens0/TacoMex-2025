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
      console.error('Error al inicializar notificaciones push:', error);
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

  puedeAccederARegistro() {
    return this.esAdmin || this.esMaitre;
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
      console.error('Error al obtener usuario actual:', error);
      // Si hay error de token, limpiar y redirigir al login
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
      console.error('Error al limpiar notificaciones:', error);
    }
    */

    // Limpiar sesión de Supabase
    await this.sb.supabase.auth.signOut();
    
    // Limpiar variables locales
    this.usuarioActual = null;
    this.esAdmin = false;
    this.esMaitre = false;
    this.perfilUsuario = '';

    // Redirigir al login
    this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}
