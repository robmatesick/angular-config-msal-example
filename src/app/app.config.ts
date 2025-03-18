import { APP_INITIALIZER, ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { routes } from './app.routes';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import {
  MSAL_INSTANCE,
  MSAL_GUARD_CONFIG,
  MSAL_INTERCEPTOR_CONFIG,
  MsalModule,
  MsalService,
  MsalGuard,
  MsalInterceptor,
  MsalBroadcastService
} from '@azure/msal-angular';
import { ConfigService } from './services/config.service';
import { LoggingService } from './services/logging.service';
import { 
  MSALInstanceFactory, 
  MSALGuardConfigFactory, 
  MSALInterceptorConfigFactory 
} from './config/msal/msal-config.factories';
import { initializeApp } from './config/msal/msal-init.service';

// Import Ng-Zorro
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NZ_I18N, en_US } from 'ng-zorro-antd/i18n';
import { registerLocaleData } from '@angular/common';
import en from '@angular/common/locales/en';
// Import our custom icon providers
import { IconProviders } from './config/icon-registry';

// Register locale data
registerLocaleData(en);

export const appConfig: ApplicationConfig = {
  providers: [
    ConfigService,
    LoggingService,
    {
      provide: MSAL_INSTANCE,
      useFactory: MSALInstanceFactory,
      deps: [Router]
    },
    MsalService,
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [ConfigService, MsalService, Router, LoggingService],
      multi: true
    },
    provideRouter(routes),
    importProvidersFrom(
      HttpClientModule, 
      MsalModule,
      BrowserAnimationsModule
    ),
    { provide: NZ_I18N, useValue: en_US },
    // Add the icon providers
    ...IconProviders,
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
