import { ReactNode } from 'react';

export interface MenuItem {
  key: string;
  icon?: ReactNode;
  label: string;
  path?: string;
  adminOnly?: boolean;
  children?: MenuItem[];
}

export const menuItems: MenuItem[]; 