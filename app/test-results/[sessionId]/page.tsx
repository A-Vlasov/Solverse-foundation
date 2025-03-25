'use client';

import { useEffect, useState } from 'react';
import TestResults from '../../../src/components/TestResults';

export default function TestResultsPage({ params }: { params: { sessionId: string } }) {
  // Обертка с передачей параметров для совместимости с компонентом
  return (
    <div id="test-results-container" data-session-id={params.sessionId}>
      <TestResults />
    </div>
  );
} 