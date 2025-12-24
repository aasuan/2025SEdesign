import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import ExamList from './components/ExamList';
import ExamPaper from './components/ExamPaper';
import Grading from './components/Grading';
import Analysis from './components/Analysis';
import QuestionBank from './components/QuestionBank'; // Import QuestionBank
import PaperList from './components/PaperList'; // Import PaperList
import StudentExamList from './components/StudentExamList'; // Import StudentExamList
import StudentResults from './components/StudentResults'; // Import StudentResults
import StudentResultDetail from './components/StudentResultDetail'; // Import StudentResultDetail
import Profile from './components/Profile'; // Import Profile
import { UserProfile } from './types';
import { api } from './services/api';

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // Check for existing session
    api.getCurrentUser().then(u => {
      setUser(u);
      setInitializing(false);
    });
  }, []);

  const handleLogin = (u: UserProfile) => {
    setUser(u);
    // Force redirect to dashboard on login
    window.location.hash = '/';
  };

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
    // Clean URL on logout
    window.location.hash = '/';
  };

  if (initializing) return <div className="h-screen flex items-center justify-center">加载中...</div>;

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <HashRouter>
      <Routes>
        <Route path="/take-exam/:id" element={<ExamPaper />} />
        
        <Route path="*" element={
          <Layout user={user} onLogout={handleLogout}>
            <Routes>
              <Route path="/" element={<Dashboard user={user} />} />
              <Route path="/exams" element={<ExamList />} />
              <Route path="/grading" element={<Grading />} />
              <Route path="/analysis/:id" element={<Analysis />} />
              <Route path="/questions" element={<QuestionBank />} />
              <Route path="/papers" element={<PaperList />} />
              <Route path="/my-exams" element={<StudentExamList />} />
              <Route path="/results" element={<StudentResults />} />
              <Route path="/exam-result/:id" element={<StudentResultDetail />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        } />
      </Routes>
    </HashRouter>
  );
};

export default App;