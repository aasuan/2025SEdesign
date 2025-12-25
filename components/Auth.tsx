import React, { useState } from 'react';
import { api } from '../services/api';
import { UserProfile } from '../types';
import { Lock, Mail, Phone, User } from 'lucide-react';

interface AuthProps {
  onLogin: (user: UserProfile) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({
    username: '',
    password: '',
    realName: '',
    email: '',
    phone: '',
    userRole: 'Student',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let user: UserProfile;
      if (mode === 'login') {
        user = await api.login(form.username, form.password);
      } else {
        const payload: any = {
          username: form.username,
          password: form.password,
          userRole: form.userRole,
        };
        if (form.realName.trim()) payload.realName = form.realName.trim();
        if (form.email.trim()) payload.email = form.email.trim();
        if (form.phone.trim()) payload.phone = form.phone.trim();
        user = await api.register(payload);
      }
      onLogin(user);
    } catch (err: any) {
      setError(err?.message || '请求失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const onChange = (key: keyof typeof form, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-primary p-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">智能在线考核系统</h1>
        </div>

        <div className="p-8">
          <div className="flex mb-6">
            <button
              className={`flex-1 py-2 font-medium ${mode === 'login' ? 'text-primary border-b-2 border-primary' : 'text-gray-400'}`}
              type="button"
              onClick={() => setMode('login')}
            >
              登录
            </button>
            <button
              className={`flex-1 py-2 font-medium ${mode === 'register' ? 'text-primary border-b-2 border-primary' : 'text-gray-400'}`}
              type="button"
              onClick={() => setMode('register')}
            >
              注册
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={18} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  required
                  value={form.username}
                  onChange={(e) => onChange('username', e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                  placeholder="请输入用户名"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-gray-400" />
                </div>
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={(e) => onChange('password', e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                  placeholder="请输入密码"
                />
              </div>
            </div>

            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
                  <input
                    type="text"
                    value={form.realName}
                    onChange={(e) => onChange('realName', e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                    placeholder="选填"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">角色</label>
                    <select
                      value={form.userRole}
                      onChange={(e) => onChange('userRole', e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary bg-white"
                    >
                      <option value="Teacher">教师</option>
                      <option value="Student">学生</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail size={18} className="text-gray-400" />
                      </div>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => onChange('email', e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                        placeholder="选填"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">手机号</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone size={18} className="text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={form.phone}
                        onChange={(e) => onChange('phone', e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                        placeholder="选填"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {error && <div className="text-red-500 text-sm text-center">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-70"
            >
              {loading ? '处理中...' : mode === 'login' ? '登录' : '注册并登录'}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};

export default Auth;
