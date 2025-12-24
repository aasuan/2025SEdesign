import React, { useState, useEffect } from 'react';
import { User, UserRole, Question, Exam } from './types';
import Layout from './components/Layout';
import { loginMock, fetchExams, saveExam, updateExam, deleteExam } from './services/mockBackend';
import QuestionBank from './views/teacher/QuestionBank';
import TeacherDashboard from './views/teacher/TeacherDashboard';
import CreateExam from './views/teacher/CreateExam';
import ExamManager from './views/teacher/ExamManager';
import ExamRoom from './views/student/ExamRoom';
import { GraduationCap, ShieldCheck } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [availableExams, setAvailableExams] = useState<Exam[]>([]);
  const [activeExam, setActiveExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(false);

  // Initial Data Fetch
  useEffect(() => {
    if (user) {
      fetchExams(user.role).then(setAvailableExams);
    }
  }, [user]);

  const handleLogin = async (role: UserRole) => {
    setLoading(true);
    const u = await loginMock(role);
    setUser(u);
    setCurrentView(role === UserRole.TEACHER ? 'teacher-dashboard' : 'student-dashboard');
    setLoading(false);
  };

  const handleStartExam = (exam: Exam) => {
    setActiveExam(exam);
  };

  const handleSaveExam = async (newExam: Exam) => {
      // Save to mock backend
      await saveExam(newExam);
      // Update local state
      setAvailableExams(prev => [...prev, newExam]);
      alert("试卷发布成功！");
      setCurrentView('exam-manager');
  };

  const handleUpdateExam = async (updatedExam: Exam) => {
      await updateExam(updatedExam);
      setAvailableExams(prev => prev.map(e => e.id === updatedExam.id ? updatedExam : e));
      alert("试卷更新成功！");
  };

  const handleDeleteExam = async (id: string) => {
      // Optimistically update UI
      setAvailableExams(prev => prev.filter(e => e.id !== id));
      try {
        await deleteExam(id);
      } catch (error) {
        console.error("Failed to delete exam", error);
        // Revert if failed (optional, but good practice)
        fetchExams(user!.role).then(setAvailableExams);
      }
  };

  // Render Login Screen
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
          <div className="flex justify-center mb-6">
            <div className="bg-indigo-600 p-3 rounded-xl">
              <GraduationCap className="text-white" size={32} />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center text-slate-800 mb-2">SmartExam 智慧考场</h1>
          <p className="text-center text-slate-500 mb-8">安全、智能的在线评估系统</p>
          
          <div className="space-y-4">
            <button 
              onClick={() => handleLogin(UserRole.TEACHER)}
              disabled={loading}
              className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold py-3 px-4 rounded-xl transition-colors border border-indigo-200"
            >
              教师登录
            </button>
            <button 
              onClick={() => handleLogin(UserRole.STUDENT)}
              disabled={loading}
              className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold py-3 px-4 rounded-xl transition-colors shadow-lg shadow-slate-300/50"
            >
              学生登录
            </button>
          </div>
          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-400">
             <ShieldCheck size={14} /> 技术支持：Gemini & JavaEE Mock
          </div>
        </div>
      </div>
    );
  }

  // Render Exam Room (No Layout, Full Screen)
  if (activeExam) {
    return <ExamRoom exam={activeExam} user={user} onComplete={() => setActiveExam(null)} />;
  }

  // Render Main Layout
  return (
    <Layout user={user} onLogout={() => setUser(null)} currentView={currentView} onChangeView={setCurrentView}>
      
      {/* Teacher Views */}
      {currentView === 'teacher-dashboard' && <TeacherDashboard />}
      {currentView === 'question-bank' && <QuestionBank questions={questions} setQuestions={setQuestions} />}
      {currentView === 'exam-manager' && (
          <ExamManager 
            exams={availableExams} 
            questionBank={questions}
            onUpdateExam={handleUpdateExam}
            onDeleteExam={handleDeleteExam}
          />
      )}
      {currentView === 'create-exam' && (
        <CreateExam 
            questionBank={questions} 
            onSave={handleSaveExam} 
            onCancel={() => setCurrentView('teacher-dashboard')} 
        />
      )}

      {/* Student Views */}
      {currentView === 'student-dashboard' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-slate-800">当前可用考试</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {availableExams.map(exam => (
              <div key={exam.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-colors group">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-indigo-50 text-indigo-600 p-2 rounded-lg">
                    <GraduationCap size={20} />
                  </div>
                  <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-1 rounded-full">进行中</span>
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors">{exam.title}</h3>
                <p className="text-sm text-slate-500 mb-6 line-clamp-2">{exam.description}</p>
                <div className="flex items-center gap-4 text-xs text-slate-400 mb-6">
                  <span>{exam.durationMinutes} 分钟</span>
                  <span>•</span>
                  <span>{exam.questions.length} 道题</span>
                </div>
                {user.role === UserRole.STUDENT && (
                  <button 
                    onClick={() => handleStartExam(exam)}
                    className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                  >
                    开始考试
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {currentView === 'student-results' && (
          <div className="bg-white p-8 rounded-xl border border-slate-200">
              <h2 className="text-xl font-bold mb-4">历史成绩</h2>
              <p className="text-slate-500">本次会话暂无历史考试记录。</p>
          </div>
      )}

    </Layout>
  );
};

export default App;