import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import {
  IonContent,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-splash',
  templateUrl: './splash.page.html',
  styleUrls: ['./splash.page.scss'],
  imports: [
    IonContent,
  ],
})
export class SplashPage implements OnInit {
  constructor(private router: Router) {}

  ngOnInit() {
    setTimeout(() => {
      this.router.navigateByUrl('/login');
    }, 3800);
  }
}
