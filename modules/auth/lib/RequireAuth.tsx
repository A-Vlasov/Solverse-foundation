'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/modules/auth'; 

interface RequireAuthProps {
  children: React.ReactNode;
  redirectTo?: string;
  
  
}

const RequireAuth: React.FC<RequireAuthProps> = ({
  children,
  redirectTo = '/login',
  
}) => {
  
  const { user, isAuthenticated, isLoading } = useAuth(); 
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return; 

    if (!isAuthenticated) {
      const currentPath = window.location.pathname;
      router.push(`${redirectTo}?from=${encodeURIComponent(currentPath)}`);
      return;
    }

    
    
    
    
    
    

  }, [isAuthenticated, isLoading, redirectTo, router, user]); 

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  
  
  
  

  return isAuthenticated ? <>{children}</> : null; 
};

export default RequireAuth; 