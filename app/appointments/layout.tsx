'use client';

import { Layout } from 'antd';
import MainLayout from '@/components/layouts/MainLayout';

export default function AppointmentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MainLayout>
      {children}
    </MainLayout>
  );
} 