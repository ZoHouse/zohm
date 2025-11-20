'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import DesktopDashboard from '@/components/desktop-dashboard';

export default function DashboardTestPage() {
  const router = useRouter();

  return (
    <DesktopDashboard onClose={() => router.push('/')} />
  );
}





