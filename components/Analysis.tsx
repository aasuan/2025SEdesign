import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';
import { getAIAnalysis } from '../services/geminiService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FileText, Lightbulb } from 'lucide-react';

const Analysis: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [stats, setStats] = useState<{ score: number }[]>([]);
  const [examName, setExamName] = useState('');
  const [aiSummary, setAiSummary] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
       // Mock fetch
       api.getExamDetails(Number(id)).then(e => setExamName(e?.examName || '考试'));
       api.getExamStats(Number(id)).then(scores => {
         setStats(scores.map((s, i) => ({ id: i, score: s })));
       });
    }
  }, [id]);

  const runAIAnalysis = async () => {
    if (!id || stats.length === 0) return;
    setAiSummary('Gemini 正在分析数据...');
    const scores = stats.map(s => s.score);
    const summary = await getAIAnalysis(examName, scores);
    setAiSummary(summary);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileText className="text-primary" /> 考情分析: {examName}
        </h1>
        <button 
          onClick={runAIAnalysis}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 shadow-sm"
        >
          <Lightbulb size={18} /> 生成 AI 洞察
        </button>
      </div>

      {aiSummary && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 p-6 rounded-xl relative">
          <div className="absolute top-4 right-4 text-purple-200">
            <SparklesIcon size={48} />
          </div>
          <h3 className="font-bold text-purple-900 mb-2">AI 成绩总结</h3>
          <p className="text-purple-800 leading-relaxed">{aiSummary}</p>
        </div>
      )}

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-bold text-gray-700 mb-6">成绩分布</h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="id" tick={false} label={{ value: '学生', position: 'insideBottom', offset: -5 }} />
              <YAxis label={{ value: '分数', angle: -90, position: 'insideLeft' }} />
              <Tooltip cursor={{ fill: '#f3f4f6' }} />
              <Bar dataKey="score" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const SparklesIcon = ({size}: {size: number}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className="opacity-20">
    <path d="M12 2L14.39 8.26L21 9.27L15.9 13.57L17.59 20.04L12 16.5L6.41 20.04L8.1 13.57L3 9.27L9.61 8.26L12 2Z" />
  </svg>
);

export default Analysis;