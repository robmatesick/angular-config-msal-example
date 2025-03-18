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
  // Max number of redirects to prevent infinite loops
  private static readonly MAX_REDIRECT_COUNT = 10;
  // Key for storing redirect URL in session storage
  private static readonly REDIRECT_URL_KEY = 'redirectUrl';
  // Key for tracking redirect count to prevent loops
  private static readonly REDIRECT_COUNT_KEY = 'msalRedirectCount';

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
      // Parse the URL to extract path and query parameters
      const parsedUrl = new URL(url);
      const path = parsedUrl.pathname;
      const queryParams = parsedUrl.search;
      
      // Check for potential redirect loops
      this.checkForRedirectLoop();
      
      // Only store paths that are not home or root paths
      if (this.shouldStoreRedirectUrl(path)) {
        // Include query parameters in the stored URL if they exist
        const redirectPath = queryParams ? `${path}${queryParams}` : path;
        
        console.log(`📌 Storing navigation path for post-authentication redirect: ${redirectPath}`);
        sessionStorage.setItem(CustomNavigationClient.REDIRECT_URL_KEY, redirectPath);
        
        // Increment redirect count to track potential loops
        this.incrementRedirectCount();
      } else {
        console.log(`🏠 Not storing redirect for path: ${path} (home or root path)`);
      }

      // Return false to let MSAL handle token processing immediately after navigation.
      // The actual navigation to the stored path happens in msal-init.service.ts after 
      // authentication completes (via handleRedirectPromise).
      return false;
    } catch (e) {
      console.error('❌ Navigation error:', e);
      // If there's an error with URL parsing, we should still continue with auth flow
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
    console.log(`🔄 Redirecting to external URL: ${this.sanitizeUrlForLogging(url)}`);
    window.location.assign(url);
    return true;
  }

  /**
   * Determines if the current path should be stored for post-authentication redirect.
   * Excludes home page and root paths.
   * 
   * @param path The current path
   * @returns True if the path should be stored
   */
  private shouldStoreRedirectUrl(path: string): boolean {
    return !!(path && 
           path !== '/' && 
           !path.includes('/home') && 
           !path.includes('/auth') &&
           !path.includes('/login'));
  }

  /**
   * Checks for potential redirect loops and clears redirect data if a loop is detected.
   * This prevents users from getting stuck in authentication redirect loops.
   */
  private checkForRedirectLoop(): void {
    const redirectCount = parseInt(sessionStorage.getItem(CustomNavigationClient.REDIRECT_COUNT_KEY) || '0', 10);
    
    if (redirectCount > CustomNavigationClient.MAX_REDIRECT_COUNT) {
      console.warn('⚠️ Detected potential redirect loop! Clearing redirect URL and count.');
      sessionStorage.removeItem(CustomNavigationClient.REDIRECT_URL_KEY);
      sessionStorage.removeItem(CustomNavigationClient.REDIRECT_COUNT_KEY);
    }
  }

  /**
   * Increments the redirect count to help detect redirect loops.
   */
  private incrementRedirectCount(): void {
    const currentCount = parseInt(sessionStorage.getItem(CustomNavigationClient.REDIRECT_COUNT_KEY) || '0', 10);
    sessionStorage.setItem(CustomNavigationClient.REDIRECT_COUNT_KEY, (currentCount + 1).toString());
  }

  /**
   * Sanitizes a URL for logging purposes by removing tokens and other sensitive information.
   * 
   * @param url The URL to sanitize
   * @returns A sanitized version of the URL safe for logging
   */
  private sanitizeUrlForLogging(url: string): string {
    try {
      const parsedUrl = new URL(url);
      // Remove potential tokens or sensitive info from query params
      if (parsedUrl.search.includes('token') || 
          parsedUrl.search.includes('code') || 
          parsedUrl.search.includes('id_token')) {
        return `${parsedUrl.origin}${parsedUrl.pathname}[...sensitive params removed]`;
      }
      return url;
    } catch {
      // If URL parsing fails, just return a placeholder
      return 'external URL';
    }
  }
} 