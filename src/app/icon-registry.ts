import { NZ_ICONS } from 'ng-zorro-antd/icon';

// Import the required icon files from @ant-design/icons-angular/icons
import {
  HomeOutline,
  TeamOutline,
  LoginOutline,
  LogoutOutline,
  LockOutline,
  SettingOutline,
  LoadingOutline,
  SafetyCertificateOutline,
  CodeOutline,
  DashboardOutline,
  WarningOutline,
  MailOutline,
  SolutionOutline,
  UserOutline
} from '@ant-design/icons-angular/icons';

// Define the icons that will be used in the application
export const icons = [
  HomeOutline,
  TeamOutline,
  LoginOutline,
  LogoutOutline,
  LockOutline,
  SettingOutline,
  LoadingOutline,
  SafetyCertificateOutline,
  CodeOutline,
  DashboardOutline,
  WarningOutline,
  MailOutline,
  SolutionOutline,
  UserOutline
];

// Export the icon provider configuration
export const IconProviders = [
  { provide: NZ_ICONS, useValue: icons }
]; 