import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import { getAIGradingSuggestion } from '../services/geminiService';
import { Exam, StudentAnswer } from '../types';
import { Check, X, Sparkles, MessageSquare, Filter } from 'lucide-react';

const Grading: React.FC = () => {
  const [submissions, setSubmissions] = useState<StudentAnswer[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<StudentAnswer | null>(null);
  const [grade, setGrade] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [examList, setExamList] = useState<Exam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<number | 'all'>('all');

  useEffect(() => {
    loadSubmissions();
    api.getExams().then(setExamList).catch(() => {});
  }, []);

  const loadSubmissions = async () => {
    const data = await api.getUngradedAnswers();
    setSubmissions(data);
  };

  const handleGetAISuggestion = async () => {
    if (!selectedSubmission || !selectedSubmission.question) return;
    setAiLoading(true);
    
    const result = await getAIGradingSuggestion(
      selectedSubmission.question.content,
      selectedSubmission.question.answer,
      selectedSubmission.studentResponse,
      selectedSubmission.question.defaultScore
    );

    setGrade(result.score);
    setComment(result.comment);
    setAiLoading(false);
  };

  const autoGradeObjective = (submission: StudentAnswer) => {
    const q = submission.question;
    if (!q) return null;
    if (q.questionType === 'short') return null;
    const max = submission.questionScore ?? q.defaultScore ?? 0;
    const correct = (q.answer || '').trim();
    const student = (submission.studentResponse || '').trim();
    const normalizeMulti = (v: string) =>
      v
        .split(/[,;\s]+/)
        .map((x) => x.trim().toUpperCase())
        .filter(Boolean)
        .sort()
        .join(',');
    const isCorrect =
      q.questionType === 'multiple' ? normalizeMulti(student) === normalizeMulti(correct) : student.toUpperCase() === correct.toUpperCase();
    return {
      score: isCorrect ? max : 0,
      comment: isCorrect ? '自动判定：答案正确' : '自动判定：答案不匹配，请复核',
    };
  };

  const submitGrade = async () => {
    if (!selectedSubmission) return;
    await api.gradeAnswer(selectedSubmission.answerId, grade, selectedSubmission.examId, comment);
    setSelectedSubmission(null);
    setGrade(0);
    setComment('');
    loadSubmissions();
  };

  const filteredSubmissions = useMemo(() => {
    if (selectedExamId === 'all') return submissions;
    return submissions.filter((s) => s.examId === selectedExamId);
  }, [submissions, selectedExamId]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-120px)]">
      {/* List */}
      <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-bold text-gray-700">待阅卷列表 ({filteredSubmissions.length})</h2>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Filter size={16} />
              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
              >
                <option value="all">全部考试</option>
                {examList.map((ex) => (
                  <option key={ex.examId} value={ex.examId}>
                    {ex.examName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="overflow-y-auto flex-1 p-2 space-y-2">
          {filteredSubmissions.length === 0 && <p className="text-center text-gray-400 mt-4">暂无待阅卷项。</p>}
          {filteredSubmissions.map(sub => (
            <div 
              key={sub.answerId}
              onClick={() => setSelectedSubmission(sub)}
              className={`p-4 rounded-lg cursor-pointer border transition-all ${
                selectedSubmission?.answerId === sub.answerId 
                  ? 'bg-blue-50 border-blue-300 shadow-sm' 
                  : 'bg-white border-gray-100 hover:bg-gray-50'
              }`}
            >
              <p className="text-sm font-medium text-gray-900 line-clamp-2">{sub.question?.content}</p>
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>学号 #{sub.studentId}</span>
                <span className="bg-orange-100 text-orange-600 px-2 py-0.5 rounded">待阅</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail & Grading Area */}
      <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
        {selectedSubmission ? (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Question */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">题目内容</h4>
                <p className="text-gray-900 text-lg">{selectedSubmission.question?.content}</p>
                <div className="mt-3 text-sm text-gray-600 border-t border-gray-200 pt-2">
                  <span className="font-semibold">参考答案：</span> {selectedSubmission.question?.answer}
                </div>
              </div>

              {/* Student Response */}
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">学生作答</h4>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 text-gray-800 font-medium whitespace-pre-wrap">
                  {selectedSubmission.studentResponse}
                </div>
              </div>

              {/* Grading Controls */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex justify-between items-center mb-4 gap-3">
                  <div>
                    <h3 className="font-bold text-gray-900">人工评分</h3>
                    <p className="text-xs text-gray-500">学号 #{selectedSubmission.studentId} · 考试 #{selectedSubmission.examId}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedSubmission.question?.questionType !== 'short' && (
                      <button
                        onClick={() => {
                          const auto = autoGradeObjective(selectedSubmission);
                          if (auto) {
                            setGrade(auto.score);
                            setComment(auto.comment);
                          }
                        }}
                        className="px-3 py-1.5 text-sm bg-green-50 text-green-700 rounded-lg border border-green-200 hover:bg-green-100"
                      >
                        自动判分
                      </button>
                    )}
                    <button 
                      onClick={handleGetAISuggestion}
                      disabled={aiLoading}
                      className="flex items-center gap-2 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium disabled:opacity-50"
                    >
                      <Sparkles size={16} />
                      {aiLoading ? 'AI 分析中...' : 'AI 辅助点评'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                   <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">得分 (满分: {selectedSubmission.questionScore ?? selectedSubmission.question?.defaultScore})</label>
                      <input 
                        type="number" 
                        value={grade}
                        onChange={(e) => setGrade(Number(e.target.value))}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      />
                   </div>
                   <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">评语</label>
                      <div className="relative">
                        <textarea
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 h-24 resize-none"
                          placeholder="请输入评语..."
                        />
                        <MessageSquare className="absolute bottom-2 right-2 text-gray-400" size={16} />
                      </div>
                   </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button 
                onClick={() => setSelectedSubmission(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-medium"
              >
                取消
              </button>
              <button 
                onClick={submitGrade}
                className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-blue-700 shadow-sm flex items-center gap-2"
              >
                <Check size={18} /> 提交评分
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
               <CheckSquare className="text-gray-300" size={32} />
            </div>
            <p>请选择一份提交记录进行评分</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Icon Helper
const CheckSquare = ({size, className}: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="9 11 12 14 22 4"></polyline>
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
  </svg>
);

export default Grading;
