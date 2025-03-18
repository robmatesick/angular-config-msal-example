import { Router } from '@angular/router';
import { NavigationClient, NavigationOptions } from '@azure/msal-browser';

/**
 * Custom navigation client that extends MSAL's NavigationClient.
 * 
 * This class is responsible for handling navigation during the authentication process.
 * It integrates with Angular's Router and MSAL's authentication flow by:
 * 1. Storing the current path in sessionStorage before authentication redirects
 * 2. Letting MSAL handle the actual redirect to/from the identity provider
 * 3. Later, the stored path is used to redirect the user back after authentication completes
 */
export class CustomNavigationClient extends NavigationClient {
  constructor(private router: Router) {
    super();
  }

  /**
   * This method is called by MSAL when it needs to navigate within the application.
   * 
   * The return value of this method tells MSAL how to handle token processing:
   * - When it returns FALSE: MSAL will process tokens immediately after navigation
   * - When it returns TRUE: MSAL will process tokens as part of a component re-render
   * 
   * In this implementation:
   * - We store the current path in sessionStorage but don't perform actual navigation
   * - We return FALSE to let MSAL handle token processing immediately
   * - After authentication completes, msal-init.service.ts will retrieve this stored URL
   *   and perform the actual navigation using Angular Router
   * 
   * @param url The URL MSAL wants to navigate to
   * @param options Navigation options
   * @returns Always returns false to let MSAL process tokens immediately
   */
  override async navigateInternal(url: string, options: NavigationOptions): Promise<boolean> {
    try {
      const parsedUrl = new URL(url);
      const path = parsedUrl.pathname;
      
      if (path && path !== '/' && !path.includes('/home')) {
        console.log('DEBUG: MSAL storing navigation path:', path);
        sessionStorage.setItem('redirectUrl', path);
      }

      // Return false to let MSAL handle token processing immediately after navigation.
      // The actual navigation to the stored path happens in msal-init.service.ts after 
      // authentication completes (via handleRedirectPromise).
      return false;
    } catch (e) {
      console.error('Navigation error:', e);
      return false;
    }
  }

  /**
   * Handles navigation to external URLs (outside the application).
   * Called by MSAL during the authentication flow to redirect to the identity provider.
   * 
   * @param url External URL to navigate to
   * @param options Navigation options
   * @returns Always returns true to indicate the navigation was handled
   */
  override async navigateExternal(url: string, options: NavigationOptions): Promise<boolean> {
    window.location.assign(url);
    return true;
  }
} 