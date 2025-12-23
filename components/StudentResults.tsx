import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { ScoreRecord, Exam } from '../types';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { Trophy, TrendingUp, BookOpen, Calendar, Award, Eye } from 'lucide-react';

interface EnhancedScoreRecord extends ScoreRecord {
  examName: string;
  examDate: string;
  maxScore?: number;
}

const StudentResults: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<EnhancedScoreRecord[]>([]);
  const [stats, setStats] = useState({
    avgScore: 0,
    maxScore: 0,
    totalExams: 0,
    passedExams: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [scores, exams] = await Promise.all([
          api.getMyScores(),
          api.getExams()
        ]);

        const enhancedRecords = scores.map(score => {
          const exam = exams.find(e => e.examId === score.examId);
          return {
            ...score,
            examName: exam?.examName || score.examName || '未知考试',
            examDate: exam?.startTime || new Date().toISOString(),
            // Mocking max score for now, ideally comes from Paper
            maxScore: 100 
          };
        }).sort((a, b) => new Date(b.examDate).getTime() - new Date(a.examDate).getTime());

        setRecords(enhancedRecords);

        // Calculate stats
        if (enhancedRecords.length > 0) {
          const totalScore = enhancedRecords.reduce((sum, r) => sum + r.totalScore, 0);
          const max = Math.max(...enhancedRecords.map(r => r.totalScore));
          const passed = enhancedRecords.filter(r => r.totalScore >= 60).length;

          setStats({
            avgScore: Math.round(totalScore / enhancedRecords.length),
            maxScore: max,
            totalExams: enhancedRecords.length,
            passedExams: passed
          });
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">加载成绩数据中...</div>;

  const chartData = [...records].reverse().map(r => ({
    name: r.examName.length > 6 ? r.examName.slice(0, 6) + '...' : r.examName,
    score: r.totalScore,
    fullMark: 100
  }));

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Award className="text-primary" /> 成绩查询
        </h1>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <TrendingUp size={20} />
            </div>
            <span className="text-sm text-gray-500 font-medium">平均分</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.avgScore}</p>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-yellow-50 text-yellow-600 rounded-lg">
              <Trophy size={20} />
            </div>
            <span className="text-sm text-gray-500 font-medium">最高分</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.maxScore}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <BookOpen size={20} />
            </div>
            <span className="text-sm text-gray-500 font-medium">参考次数</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.totalExams}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
              <Award size={20} />
            </div>
            <span className="text-sm text-gray-500 font-medium">及格率</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {stats.totalExams > 0 ? Math.round((stats.passedExams / stats.totalExams) * 100) : 0}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart Section */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
            <TrendingUp size={18} className="text-gray-400"/> 成绩趋势
          </h3>
          <div className="h-64">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{fontSize: 12}} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{fill: '#3b82f6', strokeWidth: 2}}
                    activeDot={{r: 6}}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                暂无足够数据生成图表
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity / Mini List */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col">
          <h3 className="font-bold text-gray-800 mb-4">最近考试</h3>
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {records.slice(0, 5).map(record => (
              <div 
                key={record.recordId} 
                onClick={() => navigate(`/exam-result/${record.examId}`)}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <div className="overflow-hidden">
                  <p className="font-medium text-gray-900 truncate">{record.examName}</p>
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <Calendar size={10} /> {new Date(record.examDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`text-lg font-bold ${
                    record.totalScore >= 90 ? 'text-green-600' :
                    record.totalScore >= 60 ? 'text-blue-600' : 'text-red-500'
                  }`}>
                    {record.totalScore}
                  </span>
                  <span className="text-xs text-gray-400 block">分</span>
                </div>
              </div>
            ))}
            {records.length === 0 && <p className="text-gray-400 text-sm text-center py-4">暂无记录</p>}
          </div>
        </div>
      </div>

      {/* Detailed List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
           <h3 className="font-bold text-gray-800">详细记录</h3>
        </div>
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">考试名称</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">考试时间</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">状态</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">排名</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-right">最终得分</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-center">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {records.map(r => (
              <tr key={r.recordId} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{r.examName}</td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(r.examDate).toLocaleString('zh-CN', {month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'})}
                </td>
                <td className="px-6 py-4">
                  {r.isFinal ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                      已出分
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      {r.totalScore > 0 ? '已自动评分' : '待评分'}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                   {r.ranking > 0 ? `第 ${r.ranking} 名` : '-'}
                </td>
                <td className="px-6 py-4 text-right">
                  <span className={`font-bold ${
                    r.totalScore >= 60 ? 'text-gray-900' : 'text-red-500'
                  }`}>
                    {r.totalScore}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <button 
                    onClick={() => navigate(`/exam-result/${r.examId}`)}
                    className="text-primary hover:text-blue-800 transition-colors p-1"
                    title="查看详情"
                  >
                    <Eye size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentResults;