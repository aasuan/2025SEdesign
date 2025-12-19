import React from 'react';
import { User, UserRole } from '../types';
import { LogOut, BookOpen, PenTool, BarChart2, User as UserIcon, GraduationCap, List } from 'lucide-react';

interface LayoutProps {
  user: User;
  onLogout: () => void;
  currentView: string;
  onChangeView: (view: string) => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ user, onLogout, currentView, onChangeView, children }) => {
  const isTeacher = user.role === UserRole.TEACHER;

  const NavItem = ({ view, icon: Icon, label }: { view: string; icon: any; label: string }) => (
    <button
      onClick={() => onChangeView(view)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors mb-1 ${
        currentView === view
          ? 'bg-indigo-600 text-white shadow-md'
          : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex-shrink-0">
        <div className="p-6 border-b border-slate-100 flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
             <GraduationCap className="text-white" size={20} />
          </div>
          <h1 className="text-xl font-bold text-slate-800">SmartExam</h1>
        </div>

        <div className="p-4 flex flex-col h-[calc(100vh-80px)]">
          <nav className="flex-1 space-y-2">
            {isTeacher ? (
              <>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-4 mt-4">教学管理</div>
                <NavItem view="teacher-dashboard" icon={BarChart2} label="仪表盘" />
                <NavItem view="question-bank" icon={BookOpen} label="题库管理" />
                <NavItem view="exam-manager" icon={List} label="试卷管理" />
                <NavItem view="create-exam" icon={PenTool} label="发布考试" />
              </>
            ) : (
              <>
                 <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-4 mt-4">学习中心</div>
                <NavItem view="student-dashboard" icon={BookOpen} label="我的考试" />
                <NavItem view="student-results" icon={BarChart2} label="成绩与分析" />
              </>
            )}
          </nav>

          <div className="mt-auto pt-6 border-t border-slate-100">
            <div className="flex items-center gap-3 px-4 mb-4">
              <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
                <img src={user.avatarUrl} alt="User" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{user.name}</p>
                <p className="text-xs text-slate-500 truncate">{user.role === 'TEACHER' ? '教师' : '学生'}</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut size={16} />
              退出登录
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-screen">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;