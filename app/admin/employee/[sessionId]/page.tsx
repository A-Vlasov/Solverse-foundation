'use client';

import EmployeeProfile from '../../../../src/components/EmployeeProfile';
import { createEmployeePathRedirector } from '../../../components/EmployeeNavigationFix';

export default function EmployeeProfilePage({ params }: { params: { sessionId: string } }) {
  // Используем компонент для установки ID в атрибут
  const NavigationHelper = createEmployeePathRedirector();
  
  // Максимально упрощенная версия без лишних оберток
  return (
    <>
      {NavigationHelper}
      <EmployeeProfile />
    </>
  );
} 