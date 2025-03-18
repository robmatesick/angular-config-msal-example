import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserProfileService, UserProfile } from '../../services/user-profile.service';
import { LoggerService } from '../../services/logger.service';

// Import ng-zorro components
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzTagModule } from 'ng-zorro-antd/tag';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    NzCardModule,
    NzDividerModule,
    NzGridModule,
    NzDescriptionsModule,
    NzAvatarModule,
    NzTypographyModule,
    NzIconModule,
    NzTabsModule,
    NzTagModule
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  userProfile: UserProfile = {};
  accountClaims: any[] = [];
  isLoading = true;

  constructor(
    private readonly userProfileService: UserProfileService,
    private readonly logger: LoggerService
  ) {}

  ngOnInit(): void {
    this.loadUserProfile();
  }

  private loadUserProfile(): void {
    try {
      const profile = this.userProfileService.loadUserProfile();
      
      if (!profile) {
        this.logger.warn('No active account found for profile page');
        this.isLoading = false;
        return;
      }
      
      this.userProfile = profile;
      this.accountClaims = this.userProfileService.getAccountClaims();
      this.isLoading = false;
    } catch (error) {
      this.logger.error('Error loading user profile', error);
      this.isLoading = false;
    }
  }
}
