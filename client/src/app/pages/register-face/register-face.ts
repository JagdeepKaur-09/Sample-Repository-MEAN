import { Component, ElementRef, ViewChild, OnInit } from '@angular/core';
import * as faceapi from 'face-api.js';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register-face',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './register-face.component.html'
})
export class RegisterFaceComponent implements OnInit {
  @ViewChild('video') video!: ElementRef;
  
  loading = true;
  statusMessage = "Initializing AI models...";

  constructor(private http: HttpClient) {}

  async ngOnInit() {
    await this.loadModels();
    this.startVideo();
  }

  async loadModels() {
    // These models must be in your src/assets/models folder
    const MODEL_URL = '/assets/models';
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
    ]);
    this.loading = false;
    this.statusMessage = "AI Ready. Center your face in the camera.";
  }

  startVideo() {
    navigator.mediaDevices.getUserMedia({ video: {} })
      .then(stream => {
        this.video.nativeElement.srcObject = stream;
      })
      .catch(err => {
        this.statusMessage = "Webcam error: " + err;
      });
  }

  async captureAndSave() {
    this.statusMessage = "Scanning face...";
    
    // Detect face, landmarks, and generate the 128-bit descriptor
    const detection = await faceapi.detectSingleFace(
      this.video.nativeElement, 
      new faceapi.TinyFaceDetectorOptions()
    ).withFaceLandmarks().withFaceDescriptor();

    if (detection) {
      const descriptorArray = Array.from(detection.descriptor);
      this.saveToDatabase(descriptorArray);
    } else {
      alert("Face not detected clearly. Please try again.");
    }
  }

  saveToDatabase(descriptor: number[]) {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.post('http://localhost:5000/api/auth/register-face', 
      { faceDescriptor: descriptor }, 
      { headers }
    ).subscribe({
      next: () => alert("Face registered successfully!"),
      error: (err) => alert("Failed to save: " + err.error.message)
    });
  }
}