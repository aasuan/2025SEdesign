import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { ScoreRecord, Exam } from '../types';
import { ArrowLeft, BarChart3, Loader2 } from 'lucide-react';
import { getAIAnalysis } from '../services/geminiService';

const ExamScores: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [exam, setExam] = useState<Exam | null>(null);
  const [records, setRecords] = useState<ScoreRecord[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const [detail, scoreResp] = await Promise.all([
          api.getExamDetails(Number(id)),
          api.getExamScores(Number(id)),
        ]);
        setExam(detail || null);
        setRecords(scoreResp?.records || []);
        setSummary(scoreResp?.summary || null);
        if (scoreResp?.records?.length) {
          setAiLoading(true);
          const nums = scoreResp.records
            .map((r: any) => Number((r as any).totalScore))
            .filter((n) => !Number.isNaN(n));
          try {
            const aiText = await getAIAnalysis(detail?.examName || `考试${id}`, nums);
            setAiAnalysis(aiText || '');
          } catch {
            setAiAnalysis('');
          } finally {
            setAiLoading(false);
          }
        }
      } catch (e: any) {
        alert(e?.message || '加载成绩失败');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  return (
    <div className="p-6 md:p-10 space-y-6">
      <div className="flex items-center gap-3">
        <button
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={16} /> 返回
        </button>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BarChart3 className="text-primary" /> 成绩与AI解析
        </h1>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <div className="text-xs text-gray-500">考试名称</div>
            <div className="text-lg font-semibold text-gray-900">{exam?.examName || `考试 #${id}`}</div>
            <div className="text-sm text-gray-500">
              {exam ? `${new Date(exam.startTime).toLocaleString('zh-CN')} - ${new Date(exam.endTime).toLocaleString('zh-CN')}` : ''}
            </div>
          </div>
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <SummaryItem label="参考人数" value={summary.totalStudents || 0} />
              <SummaryItem label="平均分" value={formatScore(summary.avgScore)} />
              <SummaryItem label="最高/最低" value={`${summary.maxScore || 0} / ${summary.minScore || 0}`} />
              <SummaryItem label="及格人数" value={summary.passCount || 0} />
            </div>
          )}
        </div>

        <div className="overflow-auto border border-gray-100 rounded-lg">
          <table className="min-w-full text-sm divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs text-gray-500">学号</th>
                <th className="px-4 py-2 text-left text-xs text-gray-500">姓名</th>
                <th className="px-4 py-2 text-left text-xs text-gray-500">得分</th>
                <th className="px-4 py-2 text-left text-xs text-gray-500">名次</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {records.map((r) => (
                <tr key={r.recordId}>
                  <td className="px-4 py-2 text-gray-800">{r.studentId}</td>
                  <td className="px-4 py-2 text-gray-700">{r.realName || r.username || '-'}</td>
                  <td className="px-4 py-2 text-gray-900 font-semibold">{r.totalScore}</td>
                  <td className="px-4 py-2 text-gray-700">{r.ranking ?? '-'}</td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-center text-gray-500">
                    {loading ? '加载中...' : '暂无成绩数据'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-gray-50 border border-dashed border-gray-200 rounded-lg p-3 text-sm text-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold">AI 成绩解析</span>
            {(aiLoading || loading) && <Loader2 className="animate-spin text-primary" size={16} />}
          </div>
          <p className="whitespace-pre-line text-gray-700">
            {aiAnalysis || (loading ? '正在生成...' : '暂无AI解析')}
          </p>
        </div>
      </div>
    </div>
  );
};

const SummaryItem: React.FC<{ label: string; value: any }> = ({ label, value }) => (
  <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
    <div className="text-xs text-gray-500">{label}</div>
    <div className="text-lg font-semibold text-gray-900">{value}</div>
  </div>
);

const formatScore = (v: any) => {
  const num = Number(v);
  if (Number.isNaN(num)) return v || 0;
  return num.toFixed(1);
};

export default ExamScores;
