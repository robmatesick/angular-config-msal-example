import { Injectable } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
import { LoggingService } from './logging.service';

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
}

@Injectable({
  providedIn: 'root'
})
export class UserProfileService {
  private currentProfile: UserProfile | null = null;

  constructor(
    private readonly msalService: MsalService,
    private readonly logger: LoggingService
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

      return this.currentProfile;
    } catch (error) {
      this.logger.error('Error loading user profile', error);
      this.currentProfile = null;
      return null;
    }
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
  }
} 