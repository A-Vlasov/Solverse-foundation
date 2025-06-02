'use client';

import TestCompleted from '../../src/pages/TestCompleted';
import { LocaleProvider } from '../../src/contexts/LocaleContext';

export default function TestCompletedPage() {
  return (
    <LocaleProvider>
      <TestCompleted />
    </LocaleProvider>
  );
} 