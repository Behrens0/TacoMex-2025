import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from 'src/app/servicios/supabase.service';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonPopover,
  IonItem,
  IonIcon,
  IonList,
  IonFooter,
  IonLabel
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  imports: [
    IonContent,
    IonLabel,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonPopover,
    IonItem,
    IonIcon,
    IonList,
    IonFooter,
    FormsModule,
    RouterModule,
    CommonModule
  ],
})
export class HomePage {
  userName: string = 'Usuario';
  avatarUrl: string = '';

  constructor(private supabase: SupabaseService, private router: Router) {}

  ionViewWillEnter() {
    this.loadUser();
  }

  async loadUser() {
    const { data, error } = await this.supabase.getCurrentUser();
    const user = data?.user;

    if (user) {
      this.userName = user.email?.split('@')[0] ?? 'Usuario';
      this.avatarUrl = this.generateAvatarUrl(user.email ?? 'default');
    } else {
      this.router.navigateByUrl('/login');
    }
  }

  generateAvatarUrl(seed: string): string {
    return `https://robohash.org/${encodeURIComponent(seed)}.png?set=set5`;
  }

  changeAvatar() {
    const randomSeed = Math.random().toString(36).substring(2, 10);
    this.avatarUrl = this.generateAvatarUrl(randomSeed);
  }

  async logout() {
    const popovers = document.querySelectorAll('ion-popover');
    popovers.forEach((popover) => (popover as HTMLIonPopoverElement).dismiss());

    await this.supabase.signOut();
    this.userName = '';
    this.avatarUrl = '';
    this.router.navigateByUrl('/login', { replaceUrl: true });
  }

  goTo(route: string) {
    this.router.navigate([route]);
  }

  escondePopOver(event: Event) {
  const popover = (event.target as HTMLElement).closest('ion-popover');
  if (popover) {
    (popover as any).dismiss();
  }
}
}
