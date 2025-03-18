import { Injectable } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
import { LoggerService } from './logger.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

export interface UserProfile {
  displayName?: string;
  email?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  jobTitle?: string;
  roles?: string[];
  idToken?: any;
  accessToken?: any;
  photoUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserProfileService {
  private currentProfile: UserProfile | null = null;
  private readonly _profile$ = new BehaviorSubject<UserProfile | null>(null);
  readonly profile$ = this._profile$.asObservable();

  constructor(
    private readonly msalService: MsalService,
    private readonly logger: LoggerService,
    private readonly http: HttpClient
  ) {}

  getCurrentProfile(): UserProfile | null {
    return this.currentProfile;
  }

  loadUserProfile(): UserProfile | null {
    try {
      const currentAccount = this.msalService.instance.getActiveAccount();
      
      if (!currentAccount) {
        this.logger.warn('No active account found');
        this.currentProfile = null;
        this._profile$.next(null);
        return null;
      }
      
      this.logger.debug('Loading profile for account', currentAccount);
      
      this.currentProfile = {
        displayName: currentAccount.name,
        email: currentAccount.username,
        username: currentAccount.username,
        firstName: currentAccount.idTokenClaims?.['given_name'] as string,
        lastName: currentAccount.idTokenClaims?.['family_name'] as string,
        jobTitle: currentAccount.idTokenClaims?.['jobTitle'] as string,
        roles: currentAccount.idTokenClaims?.['roles'] as string[] || [],
        idToken: currentAccount.idTokenClaims,
        accessToken: currentAccount.idTokenClaims
      };

      this._profile$.next(this.currentProfile);
      this.loadUserPhoto();
      return this.currentProfile;
    } catch (error) {
      this.logger.error('Error loading user profile', error);
      this.currentProfile = null;
      this._profile$.next(null);
      return null;
    }
  }

  private loadUserPhoto(): void {
    if (!this.currentProfile?.email) return;

    this.getUserPhoto().subscribe({
      next: (photoUrl: string) => {
        if (this.currentProfile) {
          this.currentProfile.photoUrl = photoUrl;
          this._profile$.next(this.currentProfile);
        }
      },
      error: (error) => {
        this.logger.error('Error loading user photo', error);
      }
    });
  }

  getUserPhoto(): Observable<string> {
    return new Observable(subscriber => {
      const currentAccount = this.msalService.instance.getActiveAccount();
      if (!currentAccount) {
        subscriber.error('No active account');
        return;
      }

      this.msalService.acquireTokenSilent({
        scopes: ['User.Read.All']
      }).subscribe({
        next: (response) => {
          const photoUrl = `https://graph.microsoft.com/v1.0/me/photo/$value`;
          this.http.get(photoUrl, { responseType: 'blob' }).subscribe({
            next: (blob) => {
              const reader = new FileReader();
              reader.onloadend = () => {
                subscriber.next(reader.result as string);
                subscriber.complete();
              };
              reader.readAsDataURL(blob);
            },
            error: (error) => {
              subscriber.error(error);
            }
          });
        },
        error: (error) => {
          if (error.name === 'InteractionRequiredAuthError') {
            this.msalService.acquireTokenPopup({
              scopes: ['User.Read.All']
            }).subscribe({
              next: (response) => {
                const photoUrl = `https://graph.microsoft.com/v1.0/me/photo/$value`;
                this.http.get(photoUrl, { responseType: 'blob' }).subscribe({
                  next: (blob) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      subscriber.next(reader.result as string);
                      subscriber.complete();
                    };
                    reader.readAsDataURL(blob);
                  },
                  error: (error) => {
                    subscriber.error(error);
                  }
                });
              },
              error: (error) => {
                subscriber.error(error);
              }
            });
          } else {
            subscriber.error(error);
          }
        }
      });
    });
  }

  getAccountClaims(): { name: string; value: string }[] {
    const currentAccount = this.msalService.instance.getActiveAccount();
    if (!currentAccount?.idTokenClaims) {
      return [];
    }

    const formatClaimValue = (value: any): string => {
      if (value === null) return 'null';
      if (Array.isArray(value)) return JSON.stringify(value);
      if (typeof value === 'object') return JSON.stringify(value);
      return String(value);
    };

    return Object.entries(currentAccount.idTokenClaims)
      .filter(([key]) => !['nonce', 'aud', 'iss'].includes(key))
      .map(([key, value]) => ({ 
        name: key, 
        value: formatClaimValue(value)
      }));
  }

  clearProfile(): void {
    this.currentProfile = null;
    this._profile$.next(null);
  }
} 