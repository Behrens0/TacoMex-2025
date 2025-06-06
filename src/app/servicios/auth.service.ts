import { inject, Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { User } from '@supabase/supabase-js';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  sb = inject(SupabaseService);
  router = inject(Router);
  usuarioActual: User | null = null;
  esAdmin: boolean = false;

  constructor() { }

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

    // if (empleado) {
    //   if (empleado.validado === false) {
    //     throw new Error('Su cuenta fue rechazada por un administrador');
    //   }
    //   if (!this.usuarioActual.email_confirmed_at) {
    //     throw new Error('Debe validar su correo electrónico para ingresar');
    //   }
    // }

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

  async signOut() {
    await this.sb.supabase.auth.signOut();
    this.usuarioActual = null;
    this.esAdmin = false;
  }
}
