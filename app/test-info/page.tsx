'use client';

import TestInfo from '../../src/components/TestInfo';
import { LocaleProvider } from '../../src/contexts/LocaleContext';

export default function TestInfoPage() {
  return (
    <LocaleProvider>
      <TestInfo />
    </LocaleProvider>
  );
} 