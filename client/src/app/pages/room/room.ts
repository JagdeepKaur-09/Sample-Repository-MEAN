import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-room',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './room.html',
  styleUrl: './room.css'
})
export class RoomComponent implements OnInit {
  room: any = null;
  photos: any[] = [];
  errorMsg = '';
  isOrganizer = false;

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    public router: Router
  ) {}

  ngOnInit() {
    const roomCode = this.route.snapshot.paramMap.get('roomCode');
    const token = localStorage.getItem('token');

    // Must be logged in to access room
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    // Get room details
    this.http.get<any>(`http://localhost:5000/api/rooms/${roomCode}`, {
      headers: new HttpHeaders({ Authorization: `Bearer ${token}` })
    }).subscribe({
      next: (res) => {
        this.room = res;
        this.loadPhotos(res._id);
      },
      error: () => this.errorMsg = 'Room not found or invalid room code!'
    });
  }

  getHeaders() {
    const token = localStorage.getItem('token');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  loadPhotos(roomId: string) {
    this.http.get<any[]>(`http://localhost:5000/api/photos/${roomId}`, {
      headers: this.getHeaders()
    }).subscribe({
      next: (res) => this.photos = res,
      error: (err) => this.errorMsg = err.error?.error
    });
  }
}