'use client';

import { useRouter } from 'next/navigation';
import ARQuest from '@/components/ARQuest';
import { devLog } from '@/lib/logger';

/**
 * AR Quest Test Page
 * 
 * Standalone page for testing AR functionality.
 * Access via: /ar-quest
 */
export default function ARQuestPage() {
  const router = useRouter();

  const handleComplete = (data: any) => {
    devLog.log('🎉 AR Quest completed:', data);
    // Navigate back or to next step
    router.push('/');
  };

  const handleClose = () => {
    router.push('/');
  };

  return (
    <ARQuest 
      onComplete={handleComplete}
      onClose={handleClose}
    />
  );
}





