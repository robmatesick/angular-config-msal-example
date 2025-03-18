import { Injectable, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { MsalService, MsalBroadcastService } from '@azure/msal-angular';
import { 
  AuthenticationResult, 
  EventMessage, 
  EventType, 
  InteractionStatus,
  BrowserAuthError,
  AuthError
} from '@azure/msal-browser';
import { BehaviorSubject, Subject, filter, takeUntil } from 'rxjs';
import { LoggerService } from './logger.service';
import { UserProfileService } from './user-profile.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService implements OnDestroy {
  private readonly _destroying$ = new Subject<void>();
  private readonly _isLoggedIn$ = new BehaviorSubject<boolean>(false);
  private readonly _isAuthenticating$ = new BehaviorSubject<boolean>(false);
  private readonly _loginInProgress$ = new BehaviorSubject<boolean>(false);

  // Public observables
  readonly isLoggedIn$ = this._isLoggedIn$.asObservable();
  readonly isAuthenticating$ = this._isAuthenticating$.asObservable();
  readonly loginInProgress$ = this._loginInProgress$.asObservable();

  constructor(
    private readonly msalService: MsalService,
    private readonly msalBroadcastService: MsalBroadcastService,
    private readonly router: Router,
    private readonly logger: LoggerService,
    private readonly userProfileService: UserProfileService
  ) {
    this.initializeAuth();
  }

  private initializeAuth(): void {
    this.logger.info('Initializing authentication service');
    this._isAuthenticating$.next(true);

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
      this._isAuthenticating$.next(false);
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
        this._loginInProgress$.next(status === InteractionStatus.Login);
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

  private checkAndSetActiveAccount(): void {
    let activeAccount = this.msalService.instance.getActiveAccount();
    
    if (!activeAccount) {
      const accounts = this.msalService.instance.getAllAccounts();
      if (accounts.length > 0) {
        activeAccount = accounts[0];
        this.msalService.instance.setActiveAccount(activeAccount);
        this.logger.debug(`Setting active account: ${activeAccount.username}`);
      }
    }

    if (activeAccount) {
      this._isLoggedIn$.next(true);
      this.userProfileService.loadUserProfile();
      this.logger.info(`User logged in: ${activeAccount.username}`);
    } else {
      this._isLoggedIn$.next(false);
      this.userProfileService.clearProfile();
      this.logger.info('No active user account found');
    }

    const accounts = this.msalService.instance.getAllAccounts();
    if (this._isLoggedIn$.value && accounts.length === 0) {
      this._isLoggedIn$.next(false);
      this.userProfileService.clearProfile();
      this.logger.warn('Login state inconsistency detected and corrected');
    }
  }

  login(): void {
    if (this._loginInProgress$.value) {
      this.logger.info('Login already in progress');
      return;
    }

    this._loginInProgress$.next(true);

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
        this._loginInProgress$.next(false);
      }
    });
  }

  logout(): void {
    if (this._loginInProgress$.value) {
      this.logger.warn('Cannot logout while login is in progress');
      return;
    }

    this._loginInProgress$.next(true);

    try {
      this.logger.info('Initiating logout process');
      sessionStorage.removeItem('redirectUrl');
      
      const accounts = this.msalService.instance.getAllAccounts();
      this.msalService.instance.setActiveAccount(null);
      this.logger.debug('Active account cleared');

      accounts.forEach(account => {
        this.msalService.instance.clearCache({
          account: account,
          correlationId: account.homeAccountId
        });
        this.logger.debug(`Cache cleared for account: ${account.username}`);
      });
      
      this._isLoggedIn$.next(false);
      this.userProfileService.clearProfile();
      this.checkAndSetActiveAccount();
      this.router.navigate(['/']);
      this.logger.info('Logout completed successfully');
    } catch (error) {
      this.logger.error('Error during logout:', error);
      this.checkAndSetActiveAccount();
    } finally {
      this._loginInProgress$.next(false);
    }
  }

  ngOnDestroy(): void {
    this.logger.debug('Auth service destroying');
    this._destroying$.next(undefined);
    this._destroying$.complete();
  }
} 