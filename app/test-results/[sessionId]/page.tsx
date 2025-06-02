'use client';

import { useEffect, useState } from 'react';
import TestResults from '../../../src/components/TestResults';
import { LocaleProvider } from '../../../src/contexts/LocaleContext';

export default function TestResultsPage({ params }: { params: { sessionId: string } }) {
  // Обертка с передачей параметров для совместимости с компонентом
  return (
    <LocaleProvider>
      <div id="test-results-container" data-session-id={params.sessionId}>
        <TestResults />
      </div>
    </LocaleProvider>
  );
} 