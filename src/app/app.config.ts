import { APP_INITIALIZER, ApplicationConfig, importProvidersFrom, inject } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { routes } from './app.routes';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import {
  MSAL_INSTANCE,
  MSAL_GUARD_CONFIG,
  MSAL_INTERCEPTOR_CONFIG,
  MsalGuardConfiguration,
  MsalInterceptorConfiguration,
  MsalModule,
  MsalService,
  MsalGuard,
  MsalInterceptor,
  MsalBroadcastService
} from '@azure/msal-angular';
import {
  IPublicClientApplication,
  PublicClientApplication,
  InteractionType,
  BrowserCacheLocation,
  NavigationClient,
  NavigationOptions
} from '@azure/msal-browser';
import { ConfigService } from './services/config.service';

const isIE = window.navigator.userAgent.indexOf('MSIE ') > -1 
  || window.navigator.userAgent.indexOf('Trident/') > -1;

// Custom navigation client
class CustomNavigationClient extends NavigationClient {
  constructor(private router: Router) {
    super();
  }

  override async navigateInternal(url: string, options: NavigationOptions): Promise<boolean> {
    try {
      // Store the URL for post-login navigation
      const parsedUrl = new URL(url);
      const path = parsedUrl.pathname;
      
      if (path && path !== '/' && !path.includes('/home')) {
        console.log('DEBUG: MSAL storing navigation path:', path);
        sessionStorage.setItem('redirectUrl', path);
      }

      // Let MSAL handle the navigation
      return false;
    } catch (e) {
      console.error('Navigation error:', e);
      return false;
    }
  }

  override async navigateExternal(url: string, options: NavigationOptions): Promise<boolean> {
    window.location.assign(url);
    return true;
  }
}

// Create initial MSAL instance with placeholder values
export function MSALInstanceFactory(router: Router): IPublicClientApplication {
  const navigationClient = new CustomNavigationClient(router);
  
  return new PublicClientApplication({
    auth: {
      clientId: 'placeholder',
      authority: 'https://login.microsoftonline.com/placeholder',
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
}

// Initialize the application and update MSAL config after loading
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
      
      // Update MSAL configuration
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

      // Initialize the new instance
      await msalInstance.initialize();
      
      // Replace the instance in the service
      (msalService as any).instance = msalInstance;
    } catch (error) {
      console.error('Failed to initialize the application:', error);
      throw error;
    }
  };
}

export function MSALGuardConfigFactory(): MsalGuardConfiguration {
  return {
    interactionType: InteractionType.Redirect,
    authRequest: {
      scopes: ['user.read']
    },
    loginFailedRoute: '/'
  };
}

export function MSALInterceptorConfigFactory(): MsalInterceptorConfiguration {
  const protectedResourceMap = new Map<string, Array<string>>();
  protectedResourceMap.set('https://graph.microsoft.com/v1.0/*', ['user.read']);
  
  return {
    interactionType: InteractionType.Redirect,
    protectedResourceMap,
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    ConfigService,
    {
      provide: MSAL_INSTANCE,
      useFactory: MSALInstanceFactory,
      deps: [Router]
    },
    MsalService,
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [ConfigService, MsalService, Router],
      multi: true
    },
    provideRouter(routes),
    importProvidersFrom(HttpClientModule, MsalModule),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: MsalInterceptor,
      multi: true
    },
    {
      provide: MSAL_GUARD_CONFIG,
      useFactory: MSALGuardConfigFactory
    },
    {
      provide: MSAL_INTERCEPTOR_CONFIG,
      useFactory: MSALInterceptorConfigFactory
    },
    MsalGuard,
    MsalBroadcastService
  ]
};
