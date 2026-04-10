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

constructor(public http: HttpClient, public router: Router) {}

  ngOnInit() {
  const token = localStorage.getItem('token');
  if (!token) {
    this.router.navigate(['/login']);
    return;
  }
  this.getRooms();
}

  getHeaders() {
    const token = localStorage.getItem('token');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  getRooms() {
  this.http.get<any[]>('http://localhost:5000/api/rooms/my-rooms', {
    headers: this.getHeaders()
  }).subscribe({
    next: (res) => {
      this.rooms = res;
      this.errorMsg = '';
    },
    error: (err) => {
      this.errorMsg = err.error?.error || 'Failed to load rooms';
    }
  });
}

  createRoom(eventName: string) {
  // Fix 1 — prevent empty room name
  if (!eventName.trim()) {
    this.errorMsg = 'Please enter an event name!';
    return;
  }

  // Fix 2 — prevent duplicate room names
  const duplicate = this.rooms.find(r => r.eventName.toLowerCase() === eventName.toLowerCase());
  if (duplicate) {
    this.errorMsg = 'A room with this name already exists!';
    return;
  }

  this.errorMsg = '';

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