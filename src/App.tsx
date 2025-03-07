import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import CandidateForm from './components/CandidateForm';
import TestInfo from './components/TestInfo';
import Chat from './components/Chat';
import Dashboard from './components/Dashboard';
import EmployeeProfile from './components/EmployeeProfile';
import NewEmployee from './components/NewEmployee';
import TestResults from './components/TestResults';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/admin" replace />} />
        <Route path="/candidate" element={<CandidateForm />} />
        <Route path="/test-info" element={<TestInfo />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/admin" element={<Dashboard />} />
        <Route path="/admin/employee/:id" element={<EmployeeProfile />} />
        <Route path="/admin/new-employee" element={<NewEmployee />} />
        <Route path="/admin/test-results" element={<TestResults />} />
      </Routes>
    </Router>
  );
}

export default App;