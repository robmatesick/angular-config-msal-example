import { Injectable, Inject, Optional } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpBackend } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface AppConfig {
  environment: string;
  logLevel: string;
  entraIdAuth: {
    clientId: string;
    tenantId: string;
    clientSecret: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private config: AppConfig | null = null;
  private readonly configUrl = '/config/app-config.json';
  private loadConfigPromise: Promise<void> | null = null;
  private http: HttpClient;

  constructor(handler: HttpBackend) {
    // Create HttpClient without interceptors
    this.http = new HttpClient(handler);
  }

  loadConfig(): Promise<void> {
    if (this.loadConfigPromise) {
      return this.loadConfigPromise;
    }

    this.loadConfigPromise = firstValueFrom(
      this.http.get<AppConfig>(this.configUrl).pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error loading configuration:', error);
          console.error(`Failed to load config from ${this.configUrl}`);
          if (error.status === 404) {
            console.error('Configuration file not found. Please ensure the config file exists at the correct location.');
          }
          throw error;
        })
      )
    )
    .then(config => {
      this.config = config;
      console.log('Configuration loaded successfully');
    });

    return this.loadConfigPromise;
  }

  async getConfig(): Promise<AppConfig> {
    if (!this.config) {
      await this.loadConfig();
    }
    if (!this.config) {
      throw new Error('Configuration not loaded. Ensure loadConfig() has completed successfully.');
    }
    return this.config;
  }
} 