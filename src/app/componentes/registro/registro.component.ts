import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Form, FormsModule } from '@angular/forms';
import { FormBuilder, ReactiveFormsModule, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from 'src/app/servicios/supabase.service';

@Component({
  selector: 'app-registro',
  imports: [ CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './registro.component.html',
  styleUrls: ['./registro.component.scss'],
})
export class RegistroComponent{
  // supervisorForm: FormGroup;

  constructor(private router: Router, private fb: FormBuilder, private sb: SupabaseService) { }


}
