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
  roomId: string = ''; 
  matchedPhotos: any[] = [];
maybePhotos: any[] = [];

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    public router: Router
  ) {}

 ngOnInit() {
    const roomCode = this.route.snapshot.paramMap.get('roomCode');
    const token = localStorage.getItem('token');

    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    this.http.get<any>(`http://localhost:5000/api/rooms/${roomCode}`, {
      headers: new HttpHeaders({ Authorization: `Bearer ${token}` })
    }).subscribe({
      next: (res) => {
        this.room = res;
        this.roomId = res._id; // ADD THIS LINE: Save the database ID
        this.loadPhotos(res._id);
      },
      error: () => this.errorMsg = 'Room not found!'
    });
  }

  // Your findMyPhotos function will now work because this.roomId is set!
findMyPhotos() {
  this.isMatching = true;
  const token = localStorage.getItem('token');
  const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

  this.http.get<any>(`http://localhost:5000/api/photos/match/${this.roomId}`, { headers })
    .subscribe({
      next: (data) => {
        this.matchedPhotos = data.matches; // Matches high confidence
        this.maybePhotos = data.maybe;     // Matches lower confidence
        this.isMatching = false;
      },
      error: () => {
        this.isMatching = false;
        alert("Error matching photos.");
      }
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

  // Add this method inside the RoomComponent class
downloadImage(imageUrl: string, fileName: string) {
  // We fetch the image as a blob to bypass browser 'open in new tab' behavior
  this.http.get(imageUrl, { responseType: 'blob' }).subscribe((blob) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName; // This forces the download with a specific name
    link.click();
    window.URL.revokeObjectURL(url);
  });
}

downloadAll() {
  this.photos.forEach((photo, index) => {
    // Adding a slight delay to prevent browser download blocking
    setTimeout(() => {
      this.downloadImage(photo.cloudinaryUrl, `Event-${this.room.eventName}-${index + 1}.jpg`);
    }, index * 200); 
  });
}

isMatching = false;

}