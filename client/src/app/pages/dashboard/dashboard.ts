import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent implements OnInit {
  rooms: any[] = [];
  errorMsg = '';

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.getRooms();
  }

  getHeaders() {
    const token = localStorage.getItem('token');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  getRooms() {
    this.http.get<any>('http://localhost:5000/api/rooms/my-rooms', {
      headers: this.getHeaders()
    }).subscribe({
      next: (res) => this.rooms = res,
      error: (err) => this.errorMsg = err.error.error
    });
  }

  createRoom(eventName: string) {
    this.http.post<any>('http://localhost:5000/api/rooms/create',
      { eventName },
      { headers: this.getHeaders() }
    ).subscribe({
      next: (res) => {
        alert('Room created! Code: ' + res.roomCode);
        this.getRooms();
      },
      error: (err) => this.errorMsg = err.error.error
    });
  }

  logout() {
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }
}