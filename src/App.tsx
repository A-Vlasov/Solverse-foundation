import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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

function App() {
  return (
    <Router>
      <Header />
      <NavigationManager />
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<Dashboard />} />
          <Route path="/chat" element={<ChatRedirect />} />
          <Route path="/test-session/:sessionId" element={<Chat />} />
          <Route path="/test-results/:sessionId" element={<TestResults />} />
          <Route path="/admin/session/:sessionId" element={<TestResultsAdmin />} />
          <Route path="/candidate" element={<CandidateForm />} />
          <Route path="/test-info" element={<TestInfo />} />
          <Route path="/admin/employee/:id" element={<EmployeeProfile />} />
          <Route path="/admin/new-employee" element={<NewEmployee />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;