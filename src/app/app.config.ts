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
import { 
  MSALInstanceFactory, 
  MSALGuardConfigFactory, 
  MSALInterceptorConfigFactory 
} from './config/msal/msal-config.factories';
import { initializeApp } from './config/msal/msal-init.service';

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
