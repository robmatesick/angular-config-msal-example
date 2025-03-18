import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfigService } from '../../services/config.service';

// Import ng-zorro-antd components
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    // Add ng-zorro-antd modules
    NzCardModule,
    NzDividerModule,
    NzGridModule,
    NzIconModule
  ],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss'
})
export class AdminComponent implements OnInit {
  config: any;

  constructor(private readonly configService: ConfigService) {}

  ngOnInit(): void {
    (async () => {
      try {
        this.config = await this.configService.getConfig();
      } catch (error) {
        console.error('Error loading configuration in admin component:', error);
      }
    })();
  }
} 