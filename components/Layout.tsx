import React, { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserProfile } from '../types';
import { 
  LogOut, 
  LayoutDashboard, 
  BookOpen, 
  FileText, 
  CheckSquare, 
  BarChart2, 
  User,
  Layers, // Added Layers icon
  Settings // Added Settings icon for Profile
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  user: UserProfile;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const teacherLinks = [
    { icon: LayoutDashboard, label: '仪表盘', path: '/' },
    { icon: BookOpen, label: '题库管理', path: '/questions' },
    { icon: Layers, label: '试卷管理', path: '/papers' },
    { icon: FileText, label: '考试管理', path: '/exams' },
    { icon: CheckSquare, label: '阅卷中心', path: '/grading' },
    { icon: Settings, label: '个人中心', path: '/profile' }, // Added Profile
  ];

  const studentLinks = [
    { icon: LayoutDashboard, label: '仪表盘', path: '/' },
    { icon: FileText, label: '我的考试', path: '/my-exams' },
    { icon: BarChart2, label: '成绩查询', path: '/results' },
    { icon: Settings, label: '个人中心', path: '/profile' }, // Added Profile
  ];

  const links = user.userRole === 'Teacher' || user.userRole === 'Admin' ? teacherLinks : studentLinks;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
            <span className="bg-primary text-white p-1 rounded">智</span> 智考系统
          </h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-blue-50 text-primary' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon size={20} />
                {link.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
              <User size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user.realName}</p>
              <p className="text-xs text-gray-500 truncate">{user.userRole === 'Teacher' ? '教师' : '学生'}</p>
            </div>
            <button 
              onClick={onLogout}
              className="p-2 text-gray-400 hover:text-red-600 transition-colors"
              title="退出登录"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <header className="md:hidden bg-white border-b p-4 flex justify-between items-center sticky top-0 z-10">
          <span className="font-bold text-lg text-primary">智考系统</span>
          <button onClick={onLogout} className="text-gray-600"><LogOut size={20}/></button>
        </header>
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;