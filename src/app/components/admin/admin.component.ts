import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfigService } from '../../services/config.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss'
})
export class AdminComponent implements OnInit {
  config: any;

  constructor(private configService: ConfigService) {}

  async ngOnInit() {
    try {
      this.config = await this.configService.getConfig();
    } catch (error) {
      console.error('Error loading configuration in admin component:', error);
    }
  }
} 