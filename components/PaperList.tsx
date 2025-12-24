import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Paper, PaperQuestionItem, PaperRule } from '../types';
import { Plus, Layers, Search, X, RefreshCcw, Eye, Edit3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DEFAULT_RULE: PaperRule = { questionType: 'single', count: 5, scorePerQuestion: 2 };

const PaperList: React.FC = () => {
  const navigate = useNavigate();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [creatorFilter, setCreatorFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'reassemble'>('create');
  const [targetPaperId, setTargetPaperId] = useState<number | null>(null);
  const [paperName, setPaperName] = useState('');
  const [draft, setDraft] = useState(false);
  const [rules, setRules] = useState<PaperRule[]>([{ ...DEFAULT_RULE }]);
  const [saving, setSaving] = useState(false);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailPaper, setDetailPaper] = useState<Paper | null>(null);
  const [detailItems, setDetailItems] = useState<PaperQuestionItem[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    fetchPapers();
  }, []);

  const fetchPapers = async () => {
    try {
      setLoading(true);
      const cid = creatorFilter.trim() ? Number(creatorFilter.trim()) : undefined;
      const data = await api.listPapers(cid);
      setPapers(data);
      setError('');
    } catch (err: any) {
      setError(err?.message || '获取试卷列表失败');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setMode('create');
    setTargetPaperId(null);
    setPaperName('');
    setDraft(false);
    setRules([{ ...DEFAULT_RULE }]);
    setIsModalOpen(true);
  };

  const openReassemble = (paper: Paper) => {
    setMode('reassemble');
    setTargetPaperId(paper.paperId);
    setPaperName(paper.paperName);
    setRules([{ ...DEFAULT_RULE }]);
    setDraft(!!paper.draft);
    setIsModalOpen(true);
  };

  const addRule = () => setRules(prev => [...prev, { ...DEFAULT_RULE }]);

  const updateRule = (index: number, key: keyof PaperRule, value: string | number) => {
    setRules(prev => prev.map((rule, i) => i === index ? { ...rule, [key]: key === 'questionType' ? value : Number(value) } : rule));
  };

  const removeRule = (index: number) => {
    setRules(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'create' && !paperName.trim()) {
      alert('请填写试卷名称');
      return;
    }
    if (rules.length === 0) {
      alert('请添加至少一条组卷规则');
      return;
    }

    try {
      setSaving(true);
      if (mode === 'create') {
        await api.createPaper({ paperName, draft, rules });
      } else if (targetPaperId) {
        await api.autoAssemblePaper(targetPaperId, rules);
      }
      setIsModalOpen(false);
      fetchPapers();
    } catch (err: any) {
      alert(err?.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const openDetail = async (paper: Paper) => {
    try {
      setDetailOpen(true);
      setDetailLoading(true);
      setDetailPaper(paper);
      const data = await api.getPaperDetail(paper.paperId);
      const enriched = await Promise.all(
        (data.items || []).map(async item => {
          try {
            const q = await api.getQuestionById(item.questionId);
            return { ...item, question: q };
          } catch {
            return item;
          }
        })
      );
      setDetailItems(enriched);
    } catch (err: any) {
      alert(err?.message || '获取试卷详情失败');
    } finally {
      setDetailLoading(false);
    }
  };

  const questionTypeLabel = (type: string) => {
    switch (type) {
      case 'single': return '单选';
      case 'multiple': return '多选';
      case 'judge': return '判断';
      case 'short': return '简答';
      default: return type;
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-center gap-3 mb-6">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              value={creatorFilter}
              onChange={e => setCreatorFilter(e.target.value)}
              placeholder="按创建人ID过滤（可选）"
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:border-primary outline-none"
            />
          </div>
          <button onClick={fetchPapers} className="px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm">查询</button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus size={18} /> 新建并自动组卷
          </button>
        </div>
      </div>

      {error && <div className="text-red-500 text-sm mb-2">{error}</div>}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">试卷名称</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">总分</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">创建人ID</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">草稿</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">加载中...</td></tr>
            ) : papers.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">暂无试卷。</td></tr>
            ) : papers.map(paper => (
              <tr key={paper.paperId} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-900">{paper.paperName}</td>
                <td className="px-6 py-4 text-blue-600 font-bold">{paper.totalScore ?? 0} 分</td>
                <td className="px-6 py-4 text-gray-500">#{paper.creatorId}</td>
                <td className="px-6 py-4">
                  {paper.draft ? <span className="text-yellow-600 text-sm">是</span> : <span className="text-gray-500 text-sm">否</span>}
                </td>
                <td className="px-6 py-4 text-gray-400 flex items-center gap-3">
                  <button onClick={() => openDetail(paper)} className="hover:text-blue-600" title="查看详情">
                    <Eye size={18} />
                  </button>
                  <button onClick={() => openReassemble(paper)} className="hover:text-green-600" title="自动重新组卷">
                    <RefreshCcw size={18} />
                  </button>
                  <button
                    onClick={() => navigate(`/papers/${paper.paperId}/adjust`)}
                    className="hover:text-purple-600"
                    title="调整题目"
                  >
                    <Edit3 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 创建/重组 Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">
                {mode === 'create' ? '新建并自动组卷' : `重新组卷 - ${paperName || `#${targetPaperId}`}`}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {mode === 'create' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">试卷名称</label>
                  <input
                    type="text"
                    value={paperName}
                    onChange={e => setPaperName(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="请输入试卷名称"
                  />
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={draft}
                  onChange={e => setDraft(e.target.checked)}
                  id="draftFlag"
                  className="accent-primary"
                />
                <label htmlFor="draftFlag" className="text-sm text-gray-700">设为草稿</label>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="text-sm font-medium text-gray-700">组卷规则</div>
                  <button type="button" onClick={addRule} className="text-sm text-primary hover:underline">新增规则</button>
                </div>

                {rules.map((rule, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-3 items-center border border-gray-200 rounded-lg p-3">
                    <div className="col-span-4">
                      <label className="block text-xs text-gray-500 mb-1">题型</label>
                      <select
                        value={rule.questionType}
                        onChange={e => updateRule(idx, 'questionType', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      >
                        <option value="single">单选</option>
                        <option value="multiple">多选</option>
                        <option value="judge">判断</option>
                        <option value="short">简答</option>
                      </select>
                    </div>
                    <div className="col-span-3">
                      <label className="block text-xs text-gray-500 mb-1">数量</label>
                      <input
                        type="number"
                        min={1}
                        value={rule.count}
                        onChange={e => updateRule(idx, 'count', Number(e.target.value))}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                    <div className="col-span-4">
                      <label className="block text-xs text-gray-500 mb-1">每题分值</label>
                      <input
                        type="number"
                        min={1}
                        value={rule.scorePerQuestion || 0}
                        onChange={e => updateRule(idx, 'scorePerQuestion', Number(e.target.value))}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                    <div className="col-span-1 flex justify-end">
                      {rules.length > 1 && (
                        <button type="button" onClick={() => removeRule(idx)} className="text-gray-400 hover:text-red-500">
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">取消</button>
                <button type="submit" disabled={saving} className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 shadow-sm disabled:opacity-70">
                  {saving ? '处理中...' : mode === 'create' ? '创建试卷' : '重新组卷'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 详情 Modal */}
      {detailOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-gray-800">试卷详情</h3>
                <p className="text-sm text-gray-500">{detailPaper?.paperName}（#{detailPaper?.paperId}）</p>
              </div>
              <button onClick={() => setDetailOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={22} />
              </button>
            </div>
            <div className="p-6">
              {detailLoading ? (
                <div className="text-center text-gray-500 py-6">加载详情...</div>
              ) : detailItems.length === 0 ? (
                <div className="text-center text-gray-500 py-6">暂无题目记录</div>
              ) : (
                <div className="space-y-3">
                  {detailItems.map(item => (
                    <div key={item.sequenceNum} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex justify-between text-sm text-gray-500 mb-1">
                        <span>序号 {item.sequenceNum}</span>
                        <span>分值 {item.questionScore}</span>
                      </div>
                      <div className="font-medium text-gray-900">
                        {item.question?.content || `题目 #${item.questionId}`}
                      </div>
                      {item.question?.questionType && (
                        <div className="text-xs text-gray-500 mt-1">
                          类型：{questionTypeLabel(item.question.questionType)} · 难度：{item.question.difficulty}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaperList;
