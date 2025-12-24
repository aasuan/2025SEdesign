import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { UserProfile } from '../types';
import { User, Mail, Phone, Lock, Shield, Save, Key } from 'lucide-react';

const Profile: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'security'>('info');

  useEffect(() => {
    api.getCurrentUser().then(setUser);
  }, []);

  if (!user) return <div className="p-8 text-center">加载用户信息中...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <User className="text-primary" /> 个人中心
      </h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab('info')}
            className={`flex-1 py-4 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'info' 
                ? 'border-primary text-primary bg-blue-50/50' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            基本信息
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`flex-1 py-4 text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'security' 
                ? 'border-primary text-primary bg-blue-50/50' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            账号安全
          </button>
        </div>

        <div className="p-8">
          {activeTab === 'info' ? (
            <BasicInfoForm user={user} onUpdate={(u) => setUser(u)} />
          ) : (
            <SecurityForm user={user} />
          )}
        </div>
      </div>
    </div>
  );
};

const BasicInfoForm: React.FC<{ user: UserProfile, onUpdate: (u: UserProfile) => void }> = ({ user, onUpdate }) => {
  const [formData, setFormData] = useState({
    realName: user.realName || '',
    email: user.email || '',
    phone: user.phone || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updatedUser = await api.updateUserProfile(formData);
      onUpdate(updatedUser);
      alert('个人信息更新成功！');
    } catch (err) {
      alert('更新失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg mx-auto">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
        <div className="p-2.5 bg-gray-100 rounded-lg text-gray-500 flex items-center gap-2 cursor-not-allowed">
          <User size={18} /> {user.username}
        </div>
        <p className="text-xs text-gray-400 mt-1">用户名不可修改</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">真实姓名</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <User size={18} />
          </div>
          <input
            type="text"
            required
            value={formData.realName}
            onChange={e => setFormData({...formData, realName: e.target.value})}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">电子邮箱</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Mail size={18} />
          </div>
          <input
            type="email"
            required
            value={formData.email}
            onChange={e => setFormData({...formData, email: e.target.value})}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">联系电话</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Phone size={18} />
          </div>
          <input
            type="tel"
            required
            value={formData.phone}
            onChange={e => setFormData({...formData, phone: e.target.value})}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>

      <div className="pt-4">
        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center items-center gap-2 py-2.5 px-4 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-70"
        >
          <Save size={18} /> {loading ? '保存中...' : '保存更改'}
        </button>
      </div>
    </form>
  );
};

const SecurityForm: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [passData, setPassData] = useState({
    newPassword: '',
    confirmPassword: '',
    code: ''
  });
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleSendCode = async () => {
    if (countdown > 0) return;
    try {
      await api.sendVerificationCode(user.phone || user.email);
      setCountdown(60);
    } catch (e) {
      alert('发送验证码失败');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passData.newPassword !== passData.confirmPassword) {
      alert('两次输入的密码不一致');
      return;
    }
    if (passData.newPassword.length < 6) {
      alert('新密码长度不能少于6位');
      return;
    }
    
    setLoading(true);
    try {
      await api.changePassword(passData.newPassword, passData.code);
      alert('密码修改成功！请下次使用新密码登录。');
      setPassData({ newPassword: '', confirmPassword: '', code: '' });
    } catch (e: any) {
      alert(e.message || '密码修改失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleChangePassword} className="space-y-6 max-w-lg mx-auto">
      <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-lg mb-6 flex items-start gap-3 text-sm text-yellow-800">
        <Shield className="flex-shrink-0 mt-0.5" size={16} />
        <p>为了保障您的账号安全，修改密码需要验证您的身份。验证码将发送至您绑定的手机或邮箱。</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">新密码</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Lock size={18} />
          </div>
          <input
            type="password"
            required
            placeholder="不少于6位"
            value={passData.newPassword}
            onChange={e => setPassData({...passData, newPassword: e.target.value})}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">确认新密码</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Lock size={18} />
          </div>
          <input
            type="password"
            required
            placeholder="再次输入新密码"
            value={passData.confirmPassword}
            onChange={e => setPassData({...passData, confirmPassword: e.target.value})}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">验证码</label>
        <div className="flex gap-3">
          <div className="relative flex-1">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Key size={18} />
            </div>
            <input
              type="text"
              required
              placeholder="请输入6位验证码"
              value={passData.code}
              onChange={e => setPassData({...passData, code: e.target.value})}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <button
            type="button"
            onClick={handleSendCode}
            disabled={countdown > 0}
            className={`w-32 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              countdown > 0 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-white border border-primary text-primary hover:bg-blue-50'
            }`}
          >
            {countdown > 0 ? `${countdown}s 后重发` : '获取验证码'}
          </button>
        </div>
      </div>

      <div className="pt-4">
        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center items-center gap-2 py-2.5 px-4 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-70"
        >
          <Save size={18} /> {loading ? '提交中...' : '确认修改密码'}
        </button>
      </div>
    </form>
  );
};

export default Profile;