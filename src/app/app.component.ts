import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ConfigService } from './services/config.service';
import { LoggingService } from './services/logging.service';
import { MsalService, MsalBroadcastService } from '@azure/msal-angular';
import { 
  AuthenticationResult, 
  EventMessage, 
  EventType, 
  InteractionStatus,
  BrowserAuthError,
  AuthError
} from '@azure/msal-browser';
import { Subject, filter, takeUntil } from 'rxjs';
import { LoadingComponent } from './components/loading/loading.component';
import { UserProfileService } from './services/user-profile.service';

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
  userInfo: any = null;
  private readonly _destroying$ = new Subject<void>();
  private readonly redirectUrl: string | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly msalService: MsalService,
    private readonly msalBroadcastService: MsalBroadcastService,
    private readonly router: Router,
    private readonly logger: LoggingService,
    private readonly userProfileService: UserProfileService
  ) {
    // Config will be loaded by APP_INITIALIZER before constructor runs
    // Moving config initialization to ngOnInit
  }

  ngOnInit(): void {
    this.logger.info('App component initializing');
    // Load the config
    this.config = this.configService.getConfig();
    // Set authenticating state to true initially
    this.isAuthenticating = true;

    // Handle the redirect response
    this.msalService.instance.handleRedirectPromise().then(
      (response: AuthenticationResult | null) => {
        if (response) {
          this.logger.debug('Received authentication result from redirect');
          this.checkAndSetActiveAccount();
        }
      }
    ).catch((error: Error) => {
      this.logger.error('Error handling redirect:', error);
    }).finally(() => {
      this.isAuthenticating = false;
      this.checkAndSetActiveAccount();
    });

    // Subscribe to login/logout events
    this.msalBroadcastService.inProgress$
      .pipe(
        filter((status: InteractionStatus) => status === InteractionStatus.None || status === InteractionStatus.Login),
        takeUntil(this._destroying$)
      )
      .subscribe((status) => {
        this.logger.debug(`Auth interaction status changed: ${status}`);
        this.loginInProgress = status === InteractionStatus.Login;
        this.checkAndSetActiveAccount();
      });

    // Handle login success and other auth events
    this.msalBroadcastService.msalSubject$
      .pipe(
        filter((msg: EventMessage) => 
          msg.eventType === EventType.LOGIN_SUCCESS || 
          msg.eventType === EventType.LOGOUT_SUCCESS ||
          msg.eventType === EventType.ACQUIRE_TOKEN_SUCCESS
        ),
        takeUntil(this._destroying$)
      )
      .subscribe((result: EventMessage) => {
        this.logger.debug(`Auth event received: ${result.eventType}`);
        if (result.eventType === EventType.LOGIN_SUCCESS || result.eventType === EventType.ACQUIRE_TOKEN_SUCCESS) {
          const payload = result.payload as AuthenticationResult;
          this.msalService.instance.setActiveAccount(payload.account);
          this.checkAndSetActiveAccount();
        }
      });
  }

  ngOnDestroy(): void {
    this.logger.debug('App component destroying');
    this._destroying$.next(undefined);
    this._destroying$.complete();
  }

  private checkAndSetActiveAccount(): void {
    // First check for active account
    let activeAccount = this.msalService.instance.getActiveAccount();
    
    // If no active account, try to get the first account
    if (!activeAccount) {
      const accounts = this.msalService.instance.getAllAccounts();
      if (accounts.length > 0) {
        activeAccount = accounts[0];
        this.msalService.instance.setActiveAccount(activeAccount);
        this.logger.debug(`Setting active account: ${activeAccount.username}`);
      }
    }

    // Update login state and user info
    if (activeAccount) {
      this.isLoggedIn = true;
      this.userInfo = this.userProfileService.loadUserProfile();
      this.logger.info(`User logged in: ${activeAccount.username}`);
    } else {
      this.isLoggedIn = false;
      this.userInfo = null;
      this.userProfileService.clearProfile();
      this.logger.info('No active user account found');
    }

    // Double check login state against accounts
    const accounts = this.msalService.instance.getAllAccounts();
    if (this.isLoggedIn && accounts.length === 0) {
      this.isLoggedIn = false;
      this.userInfo = null;
      this.userProfileService.clearProfile();
      this.logger.warn('Login state inconsistency detected and corrected');
    }
  }

  login() {
    if (this.loginInProgress) {
      this.logger.info('Login already in progress');
      return;
    }

    // Set loginInProgress to true immediately
    this.loginInProgress = true;

    // Store current URL before login redirect if it's not the home page
    if (this.router.url !== '/' && this.router.url !== '/home') {
      this.logger.debug(`Storing URL before login: ${this.router.url}`);
      sessionStorage.setItem('redirectUrl', this.router.url);
    }

    this.logger.info('Initiating login redirect');
    this.msalService.loginRedirect().subscribe({
      error: (error: AuthError) => {
        if (error instanceof BrowserAuthError && error.errorCode === 'interaction_in_progress') {
          this.logger.warn('Login interaction already in progress');
        } else {
          this.logger.error('Error during login:', error);
        }
        // Reset loginInProgress if there's an error
        this.loginInProgress = false;
      }
    });
  }

  logout() {
    if (this.loginInProgress) {
      this.logger.warn('Cannot logout while login is in progress');
      return;
    }

    // Set loginInProgress to true during logout
    this.loginInProgress = true;

    try {
      this.logger.info('Initiating logout process');
      // Clear any stored redirect URL
      sessionStorage.removeItem('redirectUrl');
      
      // Get all accounts and remove them from cache
      const accounts = this.msalService.instance.getAllAccounts();
      
      // Clear active account first
      this.msalService.instance.setActiveAccount(null);
      this.logger.debug('Active account cleared');

      // Then clear the cache for each account
      accounts.forEach(account => {
        this.msalService.instance.clearCache({
          account: account,
          correlationId: account.homeAccountId
        });
        this.logger.debug(`Cache cleared for account: ${account.username}`);
      });
      
      // Clear local state
      this.isLoggedIn = false;
      this.userInfo = null;
      this.userProfileService.clearProfile();
      
      // Update state one final time
      this.checkAndSetActiveAccount();

      // Navigate to home using Angular router
      this.router.navigate(['/']);
      this.logger.info('Logout completed successfully');
    } catch (error) {
      this.logger.error('Error during logout:', error);
      // Try to recover state
      this.checkAndSetActiveAccount();
    } finally {
      // Reset loginInProgress after logout attempts
      this.loginInProgress = false;
    }
  }
}
