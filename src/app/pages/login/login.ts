import { Component, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UserService } from '../../services/user.service';
import { AUTH_EXPIRED_NOTICE_KEY } from '../../shared/auth/auth.interceptor';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {

  selectedRole: 'user' | 'admin' = 'user';
  loginError = signal('');
  isLoggingIn = signal(false);

  loginForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private router: Router
  ) {
    if (sessionStorage.getItem(AUTH_EXPIRED_NOTICE_KEY) === 'true') {
      this.loginError.set('Your login has expired. Please sign in again.');
      sessionStorage.removeItem(AUTH_EXPIRED_NOTICE_KEY);
    }

    this.loginForm = this.fb.group({

      username: ['', Validators.required],

      password: ['', Validators.required]

    });

  }

  selectRole(role: 'user' | 'admin') {
    this.selectedRole = role;
  }

  login(): void {

    if (this.loginForm.valid) {
      this.loginError.set('');
      this.isLoggingIn.set(true);

      const { username, password } = this.loginForm.getRawValue();
      this.userService.login({
        username,
        password,
        role: this.selectedRole,
      }).subscribe({
        next: user => {
          sessionStorage.removeItem(AUTH_EXPIRED_NOTICE_KEY);
          localStorage.setItem('userdetails', JSON.stringify(user));
          this.isLoggingIn.set(false);
          void this.router.navigate(['/dashboard']);
        },
        error: error => {
          console.error('Login failed:', error);
          this.isLoggingIn.set(false);
          this.loginError.set('Login failed. Check your credentials and try again.');
        },
      });

    } else {

      this.loginError.set('');
      this.loginForm.markAllAsTouched();

    }

  }

}