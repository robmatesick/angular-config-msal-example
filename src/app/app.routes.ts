import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { MsalGuard } from '@azure/msal-angular';
import { HomeComponent } from './components/home/home.component';
import { AdminComponent } from './components/admin/admin.component';
import { ConfigService } from './services/config.service';
import { ResolveFn } from '@angular/router';

const configResolver: ResolveFn<any> = () => {
  const configService = inject(ConfigService);
  return configService.getConfig();
};

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent
  },
  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [MsalGuard],
    resolve: {
      config: configResolver
    }
  },
  {
    path: '**',
    redirectTo: ''
  }
];
