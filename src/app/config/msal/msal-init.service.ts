import { Router } from '@angular/router';
import { MsalService } from '@azure/msal-angular';
import { PublicClientApplication, BrowserCacheLocation, AuthenticationResult } from '@azure/msal-browser';
import { ConfigService } from '../../services/config.service';
import { LoggingService } from '../../services/logging.service';
import { CustomNavigationClient } from './custom-navigation.client';

const isIE = window.navigator.userAgent.indexOf('MSIE ') > -1 
  || window.navigator.userAgent.indexOf('Trident/') > -1;

/**
 * Factory function that initializes the MSAL configuration for the application.
 * 
 * This function:
 * 1. Loads application configuration
 * 2. Sets up the MSAL PublicClientApplication with the custom navigation client
 * 3. Initializes MSAL and handles the authentication redirect flow
 * 4. Navigates back to the stored URL after successful authentication
 * 
 * The navigation flow works as follows:
 * - When navigating to a protected route, the app redirects to the login page
 * - Before redirecting, CustomNavigationClient.navigateInternal stores the current URL
 * - After authentication completes, this function retrieves that stored URL and navigates to it
 * 
 * @param configService Service to load application configuration
 * @param msalService Angular MSAL service
 * @param router Angular router for navigation after authentication
 * @param logger Optional logging service
 * @returns A function that initializes the application
 */
export function initializeApp(
  configService: ConfigService,
  msalService: MsalService,
  router: Router,
  logger?: LoggingService // Optional to avoid circular dependency
) {
  return async () => {
    try {
      // Start by clearing any potential redirect loops
      resetRedirectCountIfNeeded();
      
      await configService.loadConfig();
      const config = await configService.getConfig();
      
      if (logger) {
        logger.info('🚀 Initializing MSAL with configuration');
        logger.debug(`🌎 Using environment: ${config.environment}`);
      } else {
        console.log('🚀 Initializing MSAL with configuration');
      }
      
      // Create the custom navigation client that will store URLs during auth redirects
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
          navigationClient,
          loggerOptions: {
            loggerCallback: (level, message, containsPii) => {
              if (!containsPii) {
                if (logger) {
                  // Map MSAL log levels to our log service levels
                  switch (level) {
                    case 0: // Error
                      logger.error(`MSAL: ${message}`);
                      break;
                    case 1: // Warning
                      logger.warn(`MSAL: ${message}`);
                      break;
                    case 2: // Info
                      logger.info(`MSAL: ${message}`);
                      break;
                    case 3: // Verbose
                      logger.debug(`MSAL: ${message}`);
                      break;
                  }
                } else {
                  console.log(`MSAL [${level}]: ${message}`);
                }
              }
            },
            piiLoggingEnabled: false
          }
        }
      });

      // Initialize the MSAL instance
      await msalInstance.initialize();

      // Set the instance in the MsalService
      (msalService as any).instance = msalInstance;
      
      if (logger) {
        logger.info('✅ MSAL initialized successfully');
      } else {
        console.log('✅ MSAL initialized successfully');
      }

      // Handle the redirect flow and navigation
      // This is the second part of the custom navigation flow:
      // 1. CustomNavigationClient.navigateInternal stored the URL before auth redirect
      // 2. Now we retrieve that URL and navigate to it after successful authentication
      await msalInstance.handleRedirectPromise().then((authResult: AuthenticationResult | null) => {
        if (authResult) {
          // Authentication was successful
          if (logger) {
            logger.info('🔑 Authentication successful');
          } else {
            console.log('🔑 Authentication successful');
          }
          
          // Get the stored redirect URL
          const redirectUrl = sessionStorage.getItem('redirectUrl');
          
          if (redirectUrl) {
            if (logger) {
              logger.debug(`🔄 Navigating to stored path: ${redirectUrl}`);
            } else {
              console.log('🔄 Navigating to stored path:', redirectUrl);
            }
            
            // Clear the redirect URL from session storage
            sessionStorage.removeItem('redirectUrl');
            
            // Perform the navigation
            if (redirectUrl.includes('?')) {
              // Handle URLs with query parameters
              const [path, queryString] = redirectUrl.split('?');
              const queryParams: { [key: string]: string } = {};
              
              // Parse query parameters into an object
              new URLSearchParams(queryString).forEach((value, key) => {
                queryParams[key] = value;
              });
              
              // Navigate with query parameters
              router.navigate([path], { queryParams });
            } else {
              // Simple navigation without query parameters
              router.navigate([redirectUrl]);
            }
          } else {
            if (logger) {
              logger.debug('📍 No stored redirect path found, staying on current page');
            } else {
              console.log('📍 No stored redirect path found, staying on current page');
            }
          }
          
          // Reset redirect count after successful authentication
          resetRedirectCount();
        }
      }).catch((error) => {
        if (logger) {
          logger.error('❌ Error handling redirect:', error);
        } else {
          console.error('❌ Error handling redirect:', error);
        }
        
        // In case of error, still clear the redirect count to avoid getting stuck
        resetRedirectCount();
      });
      
    } catch (error) {
      if (logger) {
        logger.error('❌ Error initializing application:', error);
      } else {
        console.error('❌ Error initializing application:', error);
      }
      
      // Reset redirect count in case of errors
      resetRedirectCount();
      
      throw error; // Re-throw to prevent app from loading with invalid config
    }
  };
}

/**
 * Reset the redirect count in session storage.
 * This helps prevent getting stuck in redirect loops.
 */
function resetRedirectCount(): void {
  sessionStorage.removeItem('msalRedirectCount');
}

/**
 * Reset the redirect count if it's excessively high.
 * This is a safety measure to break potential redirect loops on application startup.
 */
function resetRedirectCountIfNeeded(): void {
  const redirectCount = parseInt(sessionStorage.getItem('msalRedirectCount') || '0', 10);
  if (redirectCount > 5) {
    console.warn('⚠️ High redirect count detected on startup, resetting to prevent loops');
    resetRedirectCount();
  }
} 