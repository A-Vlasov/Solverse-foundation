'use client';

import CandidateForm from '../../src/components/CandidateForm';
import { LocaleProvider } from '../../src/contexts/LocaleContext';

export default function CandidatePage() {
  return (
    <LocaleProvider>
      <CandidateForm />
    </LocaleProvider>
  );
} 