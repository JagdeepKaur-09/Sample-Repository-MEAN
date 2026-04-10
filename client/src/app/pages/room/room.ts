import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { PhotoService } from '../../services/photo';
import { API_BASE } from '../../api.config';

interface Photo {
  _id: string;
  cloudinaryUrl: string;
  status: string;
  roomId: string;
}

interface Room {
  _id: string;
  eventName: string;
  roomCode: string;
  status: string;
  organizerId: string;
}

interface MatchResult {
  matches: Photo[];
  maybe: Photo[];
}

@Component({
  selector: 'app-room',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './room.html',
  styleUrl: './room.css'
})
export class RoomComponent implements OnInit, OnDestroy {
  room: Room | null = null;
  photos: Photo[] = [];
  errorMsg = '';
  roomId = '';
  matchedPhotos: Photo[] = [];
  maybePhotos: Photo[] = [];
  isMatching = false;
  isProcessing = false;
  processingPercentage = 0;

  private pollInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private photoService: PhotoService,
    public router: Router
  ) { }

  ngOnInit(): void {
    const roomCode = this.route.snapshot.paramMap.get('roomCode');
    const token = localStorage.getItem('token');

    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    this.http.get<Room>(`${API_BASE}/rooms/${roomCode}`, {
      headers: this.getHeaders()
    }).subscribe({
      next: (res: Room) => {
        this.room = res;
        this.roomId = res._id;
        this.loadPhotos(res._id);
      },
      error: () => { this.errorMsg = 'Room not found!'; }
    });
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  loadPhotos(roomId: string): void {
    this.http.get<Photo[]>(`${API_BASE}/photos/${roomId}`, {
      headers: this.getHeaders()
    }).subscribe({
      next: (res: Photo[]) => {
        this.photos = res;
        const processing = res.some(p => p.status === 'processing');
        if (processing) {
          this.isProcessing = true;
          this.startPolling();
        } else {
          this.isProcessing = false;
          this.processingPercentage = 100;
          this.stopPolling();
        }
      },
      error: (err: { error?: { error?: string } }) => {
        this.errorMsg = err.error?.error ?? 'Failed to load photos';
      }
    });
  }

  private startPolling(): void {
    if (this.pollInterval) return;
    this.pollInterval = setInterval(() => this.loadPhotos(this.roomId), 4000);
  }

  private stopPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  get processingCount(): number {
    return this.photos.filter(p => p.status === 'processing').length;
  }

  get processedCount(): number {
    return this.photos.filter(p => p.status !== 'processing').length;
  }

  findMyPhotos(): void {
    this.isMatching = true;
    this.matchedPhotos = [];
    this.maybePhotos = [];

    this.http.get<MatchResult>(`${API_BASE}/photos/match/${this.roomId}`, {
      headers: this.getHeaders()
    }).subscribe({
      next: (data: MatchResult) => {
        this.matchedPhotos = data.matches;
        this.maybePhotos = data.maybe;
        this.isMatching = false;
      },
      error: () => {
        this.isMatching = false;
        this.errorMsg = 'Error matching photos. Make sure you have registered your face first.';
      }
    });
  }

  downloadImage(imageUrl: string, fileName: string): void {
    this.http.get(imageUrl, { responseType: 'blob' }).subscribe((blob: Blob) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      window.URL.revokeObjectURL(url);
    });
  }

  downloadAsPDF(): void {
    const urls = this.matchedPhotos.map(p => p.cloudinaryUrl);
    this.photoService.downloadPdf(urls);
  }

  downloadAll(): void {
    this.photos.forEach((photo, index) => {
      setTimeout(() => {
        this.downloadImage(photo.cloudinaryUrl, `Event-${this.room?.eventName}-${index + 1}.jpg`);
      }, index * 200);
    });
  }

  goToUpload(): void {
    this.router.navigate(['/upload', this.roomId]);
  }
}
