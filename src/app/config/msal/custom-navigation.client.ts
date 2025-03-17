import { Router } from '@angular/router';
import { NavigationClient, NavigationOptions } from '@azure/msal-browser';

export class CustomNavigationClient extends NavigationClient {
  constructor(private router: Router) {
    super();
  }

  override async navigateInternal(url: string, options: NavigationOptions): Promise<boolean> {
    try {
      const parsedUrl = new URL(url);
      const path = parsedUrl.pathname;
      
      if (path && path !== '/' && !path.includes('/home')) {
        console.log('DEBUG: MSAL storing navigation path:', path);
        sessionStorage.setItem('redirectUrl', path);
      }

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