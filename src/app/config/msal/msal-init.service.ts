import { Router } from '@angular/router';
import { MsalService } from '@azure/msal-angular';
import { PublicClientApplication, BrowserCacheLocation, AuthenticationResult } from '@azure/msal-browser';
import { ConfigService } from '../../services/config.service';
import { CustomNavigationClient } from './custom-navigation.client';

const isIE = window.navigator.userAgent.indexOf('MSIE ') > -1 
  || window.navigator.userAgent.indexOf('Trident/') > -1;

export function initializeApp(
  configService: ConfigService,
  msalService: MsalService,
  router: Router
) {
  return async () => {
    try {
      await configService.loadConfig();
      const config = await configService.getConfig();
      
      const navigationClient = new CustomNavigationClient(router);
      
      const msalInstance = new PublicClientApplication({
        auth: {
          clientId: config.entraIdAuth.clientId,
          authority: `https://login.microsoftonline.com/${config.entraIdAuth.tenantId}`,
          redirectUri: window.location.origin,
          postLogoutRedirectUri: window.location.origin,
          navigateToLoginRequestUrl: true
        },
        cache: {
          cacheLocation: BrowserCacheLocation.LocalStorage,
          storeAuthStateInCookie: isIE,
        },
        system: {
          navigationClient
        }
      });

      await msalInstance.initialize();
      (msalService as any).instance = msalInstance;

      // Handle the redirect flow and navigation
      await msalInstance.handleRedirectPromise().then((authResult: AuthenticationResult | null) => {
        if (authResult) {
          const redirectUrl = sessionStorage.getItem('redirectUrl');
          if (redirectUrl) {
            console.log('DEBUG: MSAL navigating to stored path:', redirectUrl);
            sessionStorage.removeItem('redirectUrl');
            router.navigate([redirectUrl]);
          }
        }
      }).catch((error) => {
        console.error('Error handling redirect:', error);
      });
      
    } catch (error) {
      console.error('Failed to initialize the application:', error);
      throw error;
    }
  };
} 