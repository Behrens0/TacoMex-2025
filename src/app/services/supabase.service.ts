import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      'https://mficerecckvozdhndecj.supabase.co', 
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1maWNlcmVjY2t2b3pkaG5kZWNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNTkzODMsImV4cCI6MjA2NDYzNTM4M30.5wB2Dcct3w1qfYHJUKrFm-1bVnoooMc8GP3NtUiMURo'
    );
  }

  signIn(email: string, password: string) {
    return this.supabase.auth.signInWithPassword({ email, password });
  }

  signUp(email: string, password: string) {
    return this.supabase.auth.signUp({ email, password });
  }

  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    if (error) {
      console.error('Error al cerrar sesión:', error.message);
    }
  }

  getUser() {
    return this.supabase.auth.getUser();
  }

  insertUser(user: { nombre: string, apellido: string, correo: string, password: string }) {
    return this.supabase.from('usuarios').insert(user);
  }

  getCurrentUser() {
    return this.supabase.auth.getUser();
  }

  getPublicUrl(path: string): string {
  return this.supabase.storage.from('sonidos').getPublicUrl(path).data.publicUrl;
}
}