import React, { Suspense } from 'react';
import { getEmployees, getRecentTestSessions, getFrequentErrors } from '../lib/supabase';
import DashboardHeader from '../components/organisms/DashboardHeader';
import LoaderSection from '../components/organisms/LoaderSection';
import RecentSessionsSection from '../components/organisms/RecentSessionsSection';
import FrequentErrorsSection from '../components/organisms/FrequentErrorsSection';
import EmployeesSection from '../components/organisms/EmployeesSection';


async function DashboardContent() {
  
  const [employees, recentSessions, frequentErrors] = await Promise.all([
    getEmployees(),
    getRecentTestSessions(6),
    getFrequentErrors(3)
  ]);

  return (
    <>
      <RecentSessionsSection sessions={recentSessions || []} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <FrequentErrorsSection errors={frequentErrors || []} />
        <EmployeesSection employees={employees || []} />
      </div>
    </>
  );
}


export default function Dashboard() {
  return (
    <div className="min-h-screen bg-[#181818] text-gray-100 p-6">
      <DashboardHeader />
      <Suspense fallback={<LoaderSection />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
} 