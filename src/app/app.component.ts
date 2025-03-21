import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ConfigService } from './services/config.service';
import { LoggerService } from './services/logger.service';
import { LoadingComponent } from './components/loading/loading.component';
import { AuthService } from './services/auth.service';
import { UserProfileService, UserProfile } from './services/user-profile.service';
import { Subject, takeUntil } from 'rxjs';

// Import ng-zorro-antd components
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, 
    RouterOutlet, 
    RouterLink, 
    RouterLinkActive, 
    LoadingComponent,
    // Add ng-zorro-antd modules
    NzLayoutModule,
    NzMenuModule,
    NzButtonModule,
    NzIconModule,
    NzAvatarModule,
    NzDropDownModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'angular-config-msal-example';
  config: any;
  isLoggedIn = false;
  loginInProgress = false;
  isAuthenticating = false;
  userInfo: UserProfile | null = null;
  private readonly _destroying$ = new Subject<void>();

  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
    private readonly logger: LoggerService,
    private readonly userProfileService: UserProfileService
  ) {}

  ngOnInit(): void {
    this.logger.info('App component initializing');
    this.config = this.configService.getConfig();

    // Subscribe to auth state changes
    this.authService.isLoggedIn$.subscribe((isLoggedIn: boolean) => {
      this.isLoggedIn = isLoggedIn;
      if (!isLoggedIn) {
        this.userInfo = null;
      }
    });

    this.authService.loginInProgress$.subscribe((inProgress: boolean) => {
      this.loginInProgress = inProgress;
    });

    this.authService.isAuthenticating$.subscribe((isAuthenticating: boolean) => {
      this.isAuthenticating = isAuthenticating;
    });

    // Subscribe to user profile changes
    this.userProfileService.profile$.pipe(
      takeUntil(this._destroying$)
    ).subscribe((profile: UserProfile | null) => {
      this.userInfo = profile;
    });
  }

  login(): void {
    this.authService.login();
  }

  logout(): void {
    this.authService.logout();
  }

  ngOnDestroy(): void {
    this._destroying$.next(undefined);
    this._destroying$.complete();
  }
}
