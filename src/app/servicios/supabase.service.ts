import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  public supabase: SupabaseClient;

  constructor() { 
    this.supabase = createClient(
      environment.supabaseUrl, 
      environment.supabaseKey
    );
  }

  async subirImagenPerfil(archivo: File): Promise<string> {
    const { data, error } = await this.supabase.storage
      .from('usuarios.img')
      .upload(`perfil-${archivo.name}`, archivo, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      throw new Error(`Error al subir la imagen: ${error.message}`);
    }

    return data.path;
  }

  async getCurrentUser() {
    return await this.supabase.auth.getUser();
  }

  async signOut() {
    return await this.supabase.auth.signOut();
  }
}
