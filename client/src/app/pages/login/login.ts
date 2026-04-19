import { Component } from '@angular/core'; 
// Import Component decorator to define Angular component

import { CommonModule } from '@angular/common'; 
// Provides common Angular directives like ngIf, ngFor

import { FormsModule } from '@angular/forms'; 
// Used for two-way data binding (ngModel)

import { RouterLink, Router } from '@angular/router'; 
// RouterLink for navigation in HTML, Router for navigation in TypeScript

import { HttpClient } from '@angular/common/http'; 
// Used to make HTTP requests to backend

import { API_BASE } from '../../api.config'; 
// Import base API URL


@Component({
  selector: 'app-login', 
  // Component selector used in HTML

  standalone: true, 
  // Defines this as a standalone component (no module required)

  imports: [CommonModule, FormsModule, RouterLink], 
  // Required modules for this component

  templateUrl: './login.html', 
  // HTML file for UI

  styleUrl: './login.css' 
  // CSS file for styling
})

export class LoginComponent {

  email = ''; 
  // Variable to store user email input

  password = ''; 
  // Variable to store user password input

  errorMsg = ''; 
  // Stores error messages to display

  loading = false; 
  // Indicates loading state during API call


  constructor(private http: HttpClient, private router: Router) { }
  // Inject HttpClient for API calls and Router for navigation


  login() {

    // Check if fields are empty
    if (!this.email || !this.password) {
      this.errorMsg = 'Please enter your email and password.';
      return;
    }

    this.loading = true; 
    // Start loading

    this.errorMsg = ''; 
    // Clear previous errors


    // Send POST request to backend login API
    this.http.post<{ token: string }>(`${API_BASE}/auth/login`, {

      email: this.email, 
      // Send email to server

      password: this.password 
      // Send password to server

    }).subscribe({

      // If login is successful
      next: (res) => {

        localStorage.setItem('token', res.token); 
        // Store JWT token in browser storage

        this.router.navigate(['/dashboard']); 
        // Redirect user to dashboard

      },

      // If login fails
      error: (err) => {

        this.loading = false; 
        // Stop loading

        this.errorMsg = err.error?.error ?? 'Login failed. Please try again.'; 
        // Show error message

      }
    });
  }
}