import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom';
import Loading from './components/Loading';
import Header from './components/Header';
import useAuth from './hooks/useAuth';
import NavigationManager from './components/NavigationManager';
import CandidateForm from './components/CandidateForm';
import TestInfo from './components/TestInfo';
import Dashboard from './components/Dashboard';
import EmployeeProfile from './components/EmployeeProfile';
import NewEmployee from './components/NewEmployee';
import TestResultsAdmin from './components/TestResultsAdmin';
import { supabase } from './lib/supabase';
import AdminRegistration from './pages/AdminRegistration';
import TestCompleted from './pages/TestCompleted';

// Ленивая загрузка компонентов
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Chat = lazy(() => import('./components/Chat'));
const TestResults = lazy(() => import('./components/TestResults'));

// Создаем компонент перенаправления для /chat, который генерирует уникальный ID сессии
const ChatRedirect = () => {
  const sessionId = `demo-session-${Date.now()}`;
  return <Navigate to={`/test-session/${sessionId}`} replace />;
};

// Компонент для защищенных маршрутов
const ProtectedRoute = () => {
  const { isLoggedIn, userRole, userId } = useAuth();
  const navigate = useNavigate();
  const isAdmin = localStorage.getItem('isAdmin') === 'true';
  const [isVerifying, setIsVerifying] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  useEffect(() => {
    // Проверка валидности авторизации через БД
    const verifyAuth = async () => {
      setIsVerifying(true);
      
      // Сначала проверяем наличие базовых признаков авторизации
      if (!isAdmin || !isLoggedIn || userRole !== 'admin' || !userId) {
        setIsAuthenticated(false);
        setIsVerifying(false);
        return;
      }
      
      try {
        // Проверяем существование пользователя в базе
        const { data, error } = await supabase
          .from('admin_users')
          .select('id')
          .eq('id', userId)
          .single();
          
        if (error || !data) {
          // Если пользователь не найден, сбрасываем авторизацию
          localStorage.removeItem('isAdmin');
          localStorage.removeItem('isLoggedIn');
          localStorage.removeItem('userRole');
          localStorage.removeItem('userId');
          setIsAuthenticated(false);
        } else {
          // Пользователь подтвержден
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Auth verification error:', error);
        setIsAuthenticated(false);
      } finally {
        setIsVerifying(false);
      }
    };
    
    verifyAuth();
  }, [userId, isLoggedIn, userRole, isAdmin]);
  
  // Показываем индикатор загрузки, пока проверяем авторизацию
  if (isVerifying) {
    return <Loading />;
  }
  
  // Если пользователь не авторизован, перенаправляем на страницу входа
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Если пользователь авторизован, рендерим дочерние маршруты
  return <Outlet />;
};

function App() {
  return (
    <Router>
      <Header />
      <NavigationManager />
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          
          {/* Защищенные маршруты администратора */}
          <Route element={<ProtectedRoute />}>
            <Route path="/admin" element={<Dashboard />} />
            <Route path="/admin/session/:sessionId" element={<TestResultsAdmin />} />
            <Route path="/admin/employee/:id" element={<EmployeeProfile />} />
            <Route path="/admin/new-employee" element={<NewEmployee />} />
            <Route path="/admin/register-admin" element={<AdminRegistration />} />
          </Route>
          
          {/* Публичные маршруты */}
          <Route path="/chat" element={<ChatRedirect />} />
          <Route path="/test-session/:sessionId" element={<Chat />} />
          <Route path="/test-results/:sessionId" element={<TestResults />} />
          <Route path="/test-completed" element={<TestCompleted />} />
          <Route path="/candidate" element={<CandidateForm />} />
          <Route path="/test-info" element={<TestInfo />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;