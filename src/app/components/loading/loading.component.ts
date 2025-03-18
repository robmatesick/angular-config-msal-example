import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzCardModule } from 'ng-zorro-antd/card';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [CommonModule, NzSpinModule, NzCardModule],
  template: `
    <div class="loading-overlay">
      <nz-card class="loading-card">
        <div class="loading-content">
          <nz-spin nzSize="large"></nz-spin>
          <div class="loading-text">
            <h3>Authenticating</h3>
            <p>Please wait while we secure your session...</p>
          </div>
        </div>
      </nz-card>
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
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
      max-width: 90%;
      width: 400px;
    }

    .loading-content {
      display: flex;
      align-items: center;
      padding: 10px;
    }

    .loading-text {
      margin-left: 25px;
      
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

    @media (max-width: 768px) {
      .loading-content {
        padding: 10px;
      }
      
      .loading-text {
        margin-left: 20px;
      }
    }
  `]
})
export class LoadingComponent {} 