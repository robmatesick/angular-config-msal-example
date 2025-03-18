import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="loading-overlay">
      <div class="loading-card">
        <div class="loading-spinner"></div>
        <div class="loading-text">
          <h3>Authenticating</h3>
          <p>Please wait while we secure your session...</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      background-color: rgba(250, 250, 250, 0.95);
      backdrop-filter: blur(5px);
      z-index: 9999;
    }

    .loading-card {
      background-color: white;
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
      padding: 30px 40px;
      display: flex;
      align-items: center;
      max-width: 90%;
      width: 400px;
    }

    .loading-spinner {
      width: 50px;
      height: 50px;
      border: 3px solid #f3f3f3;
      border-top: 3px solid #4285f4;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-right: 25px;
      flex-shrink: 0;
    }

    .loading-text {
      h3 {
        font-size: 1.2rem;
        color: #333;
        margin: 0 0 10px 0;
        font-weight: 600;
      }

      p {
        font-size: 0.9rem;
        color: #666;
        margin: 0;
      }
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    @media (max-width: 768px) {
      .loading-card {
        padding: 25px;
      }
      
      .loading-spinner {
        width: 40px;
        height: 40px;
        margin-right: 20px;
      }
    }
  `]
})
export class LoadingComponent {} 