import { Component } from '@angular/core';

import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { Router } from '@angular/router';

import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {

  registerForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private userService: UserService
  ) {

    this.registerForm = this.fb.group({

      name: ['', Validators.required],

      username: ['', Validators.required],

      email: ['', [
        Validators.required,
        Validators.email
      ]],

      mobileNumber: ['', [
        Validators.required,
        Validators.pattern('^[0-9]{10}$')
      ]]

    });

  }

  submitForm() {

    console.log('Button clicked');

    if (this.registerForm.valid) {

      const userData = {
        fullName: this.registerForm.value.name,
        username: this.registerForm.value.username,
        email: this.registerForm.value.email,
        mobileNumber: this.registerForm.value.mobileNumber
      };

      console.log('Sending data:', userData);

      this.userService.registerUser(userData).subscribe({

        next: (response) => {

          console.log('Registration successful:', response);

          alert('Account created successfully!');

          this.router.navigate(['/dashboard']);

        },

        error: (error) => {

          console.error('Registration failed:', error);

          alert('Registration failed. Please try again.');

        }

      });

    } else {

      console.log('Form is invalid');

      this.registerForm.markAllAsTouched();

    }

  }

}