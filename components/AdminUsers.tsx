import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import { UserProfile } from '../types';
import {
  BadgeCheck,
  Ban,
  Loader2,
  Mail,
  Phone,
  RefreshCcw,
  Search,
  ShieldCheck,
  User as UserIcon,
  Users,
  X,
} from 'lucide-react';

interface AdminUsersProps {
  currentUser: UserProfile;
}

type EditForm = {
  username: string;
  realName: string;
  email: string;
  phone: string;
  userRole: string;
  status: string;
};

const AdminUsers: React.FC<AdminUsersProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<UserProfile | null>(null);
  const [form, setForm] = useState<EditForm>({
    username: '',
    realName: '',
    email: '',
    phone: '',
    userRole: 'Student',
    status: 'Active',
  });

  const statusOptions = [
    { value: 'Active', label: 'Active（启用）' },
    { value: 'Inactive', label: 'Inactive（停用）' },
    { value: 'Locked', label: 'Locked（锁定）' },
  ];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const list = await api.searchUsers(keyword.trim(), 100);
      setUsers(list);
    } catch (e: any) {
      alert(e?.message || '获取用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (user: UserProfile) => {
    setEditing(user);
    setForm({
      username: user.username || '',
      realName: user.realName || '',
      email: user.email || '',
      phone: user.phone || '',
      userRole: user.userRole || 'Student',
      status: user.status || 'Active',
    });
  };

  const closeEdit = () => {
    setEditing(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        username: form.username.trim(),
        realName: form.realName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        userRole: form.userRole,
        status: form.status,
      };
      const updated = await api.updateUserByAdmin(editing.id, payload);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      setEditing(null);
    } catch (err: any) {
      alert(err?.message || '保存失败，请稍后重试');
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = useMemo(() => {
    if (!keyword.trim()) return users;
    const kw = keyword.trim().toLowerCase();
    return users.filter(
      (u) =>
        u.username.toLowerCase().includes(kw) ||
        (u.realName || '').toLowerCase().includes(kw) ||
        (u.email || '').toLowerCase().includes(kw) ||
        (u.phone || '').toLowerCase().includes(kw),
    );
  }, [keyword, users]);

  const roleLabel = (role?: string) => {
    if (!role) return '未设置';
    if (role.toLowerCase() === 'admin') return '管理员';
    if (role.toLowerCase() === 'teacher') return '教师';
    return '学生';
  };

  const statusBadge = (status?: string) => {
    const value = (status || '').toLowerCase();
    if (value === 'inactive') {
      return <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700">Inactive</span>;
    }
    if (value === 'locked') {
      return <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700">Locked</span>;
    }
    return <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">Active</span>;
  };

  if (currentUser.userRole !== 'Admin') {
    return (
      <div className="bg-white border border-red-100 text-red-700 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <Ban className="text-red-500" />
          <div>
            <p className="font-semibold">仅管理员可访问该页面</p>
            <p className="text-sm text-red-500">请使用管理员账户登录后再试。</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-blue-50 text-primary flex items-center justify-center">
            <ShieldCheck />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">用户管理</h1>
            <p className="text-gray-500 text-sm">管理员可查看并修改平台用户的基础信息、角色和状态。</p>
          </div>
        </div>
        <button
          onClick={fetchUsers}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
        >
          <RefreshCcw size={16} />
          刷新
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 md:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
                placeholder="输入用户名 / 姓名 / 邮箱 / 电话搜索"
                className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <button
              onClick={fetchUsers}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              搜索
            </button>
          </div>
          <div className="text-sm text-gray-500">
            共 <span className="font-semibold text-gray-800">{filteredUsers.length}</span> 条记录
          </div>
        </div>

        <div className="overflow-auto rounded-lg border border-gray-100">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  用户
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  联系方式
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  角色
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-700">{user.id}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-blue-50 text-primary flex items-center justify-center">
                        <Users size={18} />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{user.username}</div>
                        <div className="text-xs text-gray-500">{user.realName || '未设置姓名'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-700 flex items-center gap-2">
                      <Mail size={14} className="text-gray-400" />
                      <span>{user.email || '-'}</span>
                    </div>
                    <div className="text-sm text-gray-700 flex items-center gap-2 mt-1">
                      <Phone size={14} className="text-gray-400" />
                      <span>{user.phone || '-'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{roleLabel(user.userRole)}</td>
                  <td className="px-4 py-3">{statusBadge(user.status)}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => openEdit(user)}
                      className="text-primary hover:text-blue-700 text-sm font-medium"
                    >
                      编辑
                    </button>
                  </td>
                </tr>
              ))}
              {!filteredUsers.length && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-gray-500 text-sm">
                    {loading ? '加载中...' : '暂无符合条件的用户'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/30 z-20 flex items-center justify-center px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 relative">
            <button
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
              onClick={closeEdit}
              aria-label="关闭"
            >
              <X />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-11 w-11 bg-blue-50 rounded-lg flex items-center justify-center text-primary">
                <BadgeCheck />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">编辑用户</h2>
                <p className="text-sm text-gray-500">更新用户的基础信息、角色与状态。</p>
              </div>
            </div>

            <form className="space-y-4" onSubmit={handleSave}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-3 text-gray-400" size={16} />
                    <input
                      required
                      value={form.username}
                      onChange={(e) => setForm({ ...form, username: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">真实姓名</label>
                  <input
                    required
                    value={form.realName}
                    onChange={(e) => setForm({ ...form, realName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">电话</label>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">角色</label>
                  <select
                    value={form.userRole}
                    onChange={(e) => setForm({ ...form, userRole: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="Admin">管理员</option>
                    <option value="Teacher">教师</option>
                    <option value="Student">学生</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    {statusOptions.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeEdit}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-primary text-white hover:bg-blue-700 disabled:opacity-70"
                >
                  {saving && <Loader2 className="animate-spin" size={16} />}
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
