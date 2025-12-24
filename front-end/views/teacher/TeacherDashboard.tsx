import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getExamStats } from '../../services/mockBackend';
import { ExamStats } from '../../types';
import { Users, BookOpen, AlertCircle } from 'lucide-react';

const TeacherDashboard: React.FC = () => {
  const [stats, setStats] = useState<ExamStats | null>(null);

  useEffect(() => {
    getExamStats('exam-001').then(setStats);
  }, []);

  if (!stats) return <div>加载分析数据中...</div>;

  const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981'];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">班级成绩概览</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                <Users size={24} />
            </div>
            <div>
                <p className="text-sm text-slate-500">平均分</p>
                <p className="text-2xl font-bold text-slate-800">{stats.averageScore}分</p>
            </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                <BookOpen size={24} />
            </div>
            <div>
                <p className="text-sm text-slate-500">通过率</p>
                <p className="text-2xl font-bold text-slate-800">{stats.passRate}%</p>
            </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
                <AlertCircle size={24} />
            </div>
            <div>
                <p className="text-sm text-slate-500">需关注学生</p>
                <p className="text-2xl font-bold text-slate-800">3 人</p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">分数段分布</h3>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.scoreDistribution}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0"/>
                        <XAxis dataKey="range" axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} />
                        <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                        <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">知识点掌握度</h3>
            <div className="h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={[
                                { name: 'Java 基础', value: 85 },
                                { name: 'Spring Boot', value: 65 },
                                { name: '数据库', value: 45 },
                                { name: '算法', value: 70 },
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {stats.scoreDistribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"/> Java 基础</div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-yellow-500"/> Spring Boot</div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"/> 数据库</div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;