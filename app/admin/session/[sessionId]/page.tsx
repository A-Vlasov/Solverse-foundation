'use client';

import { useEffect, useState } from 'react';
import TestResultsAdmin from '../../../../src/components/TestResultsAdmin';

export default function TestResultsAdminPage({ params }: { params: { sessionId: string } }) {
  // Обертка с передачей параметров для совместимости с компонентом
  return (
    <div id="test-results-container" data-session-id={params.sessionId}>
      <TestResultsAdmin />
    </div>
  );
} 