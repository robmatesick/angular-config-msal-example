import { Router } from '@angular/router';
import {
  IPublicClientApplication,
  PublicClientApplication,
  InteractionType,
  BrowserCacheLocation
} from '@azure/msal-browser';
import { MsalGuardConfiguration, MsalInterceptorConfiguration } from '@azure/msal-angular';
import { CustomNavigationClient } from './custom-navigation.client';

const isIE = window.navigator.userAgent.indexOf('MSIE ') > -1 
  || window.navigator.userAgent.indexOf('Trident/') > -1;

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

export function MSALGuardConfigFactory(): MsalGuardConfiguration {
  return {
    interactionType: InteractionType.Redirect,
    authRequest: {
      scopes: ['user.read', 'User.Read.All']
    },
    loginFailedRoute: '/'
  };
}

export function MSALInterceptorConfigFactory(): MsalInterceptorConfiguration {
  const protectedResourceMap = new Map<string, Array<string>>();
  protectedResourceMap.set('https://graph.microsoft.com/v1.0/*', ['user.read', 'User.Read.All']);
  
  return {
    interactionType: InteractionType.Redirect,
    protectedResourceMap,
  };
} 