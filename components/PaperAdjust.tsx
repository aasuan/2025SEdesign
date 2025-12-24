import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api';
import { Paper, PaperQuestionItem, Question } from '../types';
import { ArrowLeft, Save, Plus, X } from 'lucide-react';

const PaperAdjust: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const paperId = id ? Number(id) : null;

  const [paper, setPaper] = useState<Paper | null>(null);
  const [items, setItems] = useState<PaperQuestionItem[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!paperId) {
      setError('未提供试卷 ID');
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        const [paperDetail, qs] = await Promise.all([
          api.getPaperDetail(paperId),
          api.getQuestions({ size: 500 }),
        ]);
        const enrichedItems = (paperDetail.items || []).map((it) => {
          const q = qs.find((qq) => qq.questionId === it.questionId);
          return { ...it, question: q };
        });
        setPaper(paperDetail);
        setItems(enrichedItems);
        setQuestions(qs);
        setError('');
      } catch (err: any) {
        setError(err?.message || '加载试卷失败');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [paperId]);

  const resequence = (list: PaperQuestionItem[]) =>
    list.map((it, idx) => ({ ...it, sequenceNum: idx + 1 }));

  const handleRemove = (questionId: number) => {
    setItems((prev) => resequence(prev.filter((it) => it.questionId !== questionId)));
  };

  const handleScoreChange = (questionId: number, val: string) => {
    const num = Number(val);
    setItems((prev) =>
      prev.map((it) =>
        it.questionId === questionId
          ? { ...it, questionScore: isNaN(num) ? it.questionScore : num }
          : it
      )
    );
  };

  const handleAddQuestion = (q: Question) => {
    setItems((prev) =>
      resequence([
        ...prev,
        {
          paperId: paperId || 0,
          questionId: q.questionId,
          questionScore: q.defaultScore || 5,
          sequenceNum: prev.length + 1,
          question: q,
        },
      ])
    );
  };

  const availableQuestions = useMemo(() => {
    const selectedIds = new Set(items.map((it) => it.questionId));
    const keyword = search.trim().toLowerCase();
    return questions.filter((q) => {
      if (selectedIds.has(q.questionId)) return false;
      if (!keyword) return true;
      return (
        q.content.toLowerCase().includes(keyword) ||
        (q.tagNames || []).some((t) => t.toLowerCase().includes(keyword))
      );
    });
  }, [questions, items, search]);

  const handleSave = async () => {
    if (!paperId) return;
    if (items.length === 0) {
      alert('请至少保留一道题目');
      return;
    }
    const payload = resequence(items).map((it) => ({
      questionId: it.questionId,
      questionScore: it.questionScore || 0,
      sequenceNum: it.sequenceNum,
    }));

    try {
      setSaving(true);
      await api.updatePaperQuestions(paperId, payload, paper?.draft);
      alert('试卷题目已更新');
      navigate('/papers');
    } catch (err: any) {
      alert(err?.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6">加载中...</div>;
  }

  if (error) {
    return (
      <div className="p-6 text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/papers')}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">调整试卷题目</h1>
            <p className="text-sm text-gray-500">
              试卷：{paper?.paperName} （ID: {paper?.paperId}）
            </p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 disabled:opacity-70"
        >
          <Save size={16} /> {saving ? '保存中...' : '保存调整'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">当前题目</h2>
            <span className="text-sm text-gray-500">共 {items.length} 题</span>
          </div>
          <div className="divide-y divide-gray-100 max-h-[70vh] overflow-y-auto">
            {items.length === 0 && (
              <div className="p-4 text-center text-gray-500">暂无题目，请从右侧添加。</div>
            )}
            {items.map((it) => {
              const q = it.question || questions.find((qq) => qq.questionId === it.questionId);
              return (
                <div key={it.questionId} className="p-4 flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 font-bold flex items-center justify-center">
                    {it.sequenceNum}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-gray-900 line-clamp-2">
                        {q?.content || `题目 #${it.questionId}`}
                      </p>
                      <button
                        onClick={() => handleRemove(it.questionId)}
                        className="text-gray-400 hover:text-red-500"
                        title="移除"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <div className="text-xs text-gray-500 flex gap-3">
                      <span>题型：{q?.questionType || '-'}</span>
                      <span>难度：{q?.difficulty || '-'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">分值</span>
                      <input
                        type="number"
                        min={0}
                        value={it.questionScore}
                        onChange={(e) => handleScoreChange(it.questionId, e.target.value)}
                        className="w-24 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-gray-800">题库</h2>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索题目内容或标签..."
              className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div className="divide-y divide-gray-100 max-h-[70vh] overflow-y-auto">
            {availableQuestions.length === 0 && (
              <div className="p-4 text-center text-gray-500">暂无可添加的题目</div>
            )}
            {availableQuestions.map((q) => (
              <div key={q.questionId} className="p-4 hover:bg-gray-50">
                <p className="font-medium text-gray-900 line-clamp-2 mb-1">{q.content}</p>
                <div className="text-xs text-gray-500 flex gap-3 mb-2">
                  <span>题型：{q.questionType}</span>
                  <span>难度：{q.difficulty}</span>
                  <span>默认分值：{q.defaultScore}</span>
                </div>
                <div className="flex gap-2 flex-wrap mb-2">
                  {(q.tagNames || []).map((tag, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => handleAddQuestion(q)}
                  className="mt-1 inline-flex items-center gap-2 px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus size={14} /> 添加
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaperAdjust;
