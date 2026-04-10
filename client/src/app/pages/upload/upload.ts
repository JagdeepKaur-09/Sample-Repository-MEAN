import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './upload.html',
  styleUrl: './upload.css'
})
export class UploadComponent {
  selectedFiles: File[] = [];
  uploading = false;
  uploadedCount = 0;
  errorMsg = '';
  roomId = '';

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    public router: Router
  ) {
    this.roomId = this.route.snapshot.paramMap.get('roomId') || '';
  }

  getHeaders() {
    const token = localStorage.getItem('token');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  onFilesSelected(event: any) {
    this.selectedFiles = Array.from(event.target.files);
  }

  async uploadPhotos() {
    if (this.selectedFiles.length === 0) {
      this.errorMsg = 'Please select at least one photo!';
      return;
    }

    this.uploading = true;
    this.uploadedCount = 0;

    for (const file of this.selectedFiles) {
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('roomId', this.roomId);

      await new Promise((resolve, reject) => {
        this.http.post('http://localhost:5000/api/photos/upload', formData, {
          headers: new HttpHeaders({
            Authorization: `Bearer ${localStorage.getItem('token')}`
          })
        }).subscribe({
          next: () => {
            this.uploadedCount++;
            resolve(true);
          },
          error: (err) => {
            this.errorMsg = err.error.error;
            reject(err);
          }
        });
      });
    }

    this.uploading = false;
    alert(`Successfully uploaded ${this.uploadedCount} photos!`);
    this.router.navigate(['/dashboard']);
  }
}