import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Difficulty, Question, QuestionType, Tag } from '../types';
import { Search, Plus, Tag as TagIcon, X, ChevronDown, Check, Edit2, Trash2 } from 'lucide-react';

const QUESTION_TYPE_OPTIONS: { value: QuestionType; label: string }[] = [
  { value: 'single', label: '单选题' },
  { value: 'multiple', label: '多选题' },
  { value: 'judge', label: '判断题' },
  { value: 'short', label: '简答题' },
];

const DIFFICULTY_OPTIONS: { value: Difficulty; label: string }[] = [
  { value: 'easy', label: '简单' },
  { value: 'medium', label: '中等' },
  { value: 'hard', label: '困难' },
];

const DEFAULT_OPTIONS = { A: '', B: '', C: '', D: '' };

const QuestionBank: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form State
  const [qType, setQType] = useState<QuestionType>('single');
  const [content, setContent] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [score, setScore] = useState(5);
  const [optionsMap, setOptionsMap] = useState<Record<string, string>>({ ...DEFAULT_OPTIONS });
  const [singleAnswer, setSingleAnswer] = useState('A');
  const [multiAnswer, setMultiAnswer] = useState<Set<string>>(new Set());
  const [shortAnswer, setShortAnswer] = useState('');

  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [tagIds, setTagIds] = useState<number[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [newTagType, setNewTagType] = useState<'KnowledgePoint' | 'Difficulty' | 'Chapter' | 'Others'>('Others');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchQuestions();
    fetchTags();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchQuestions(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchQuestions = async (keyword?: string) => {
    try {
      setLoading(true);
      const data = await api.getQuestions({ keyword, size: 200 });
      setQuestions(data);
    } catch (err: any) {
      setError(err?.message || '拉取题库失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const data = await api.listTags();
      setAvailableTags(data);
    } catch (err) {
      console.warn('拉取标签失败', err);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setQType('single');
    setContent('');
    setDifficulty('easy');
    setScore(5);
    setOptionsMap({ ...DEFAULT_OPTIONS });
    setSingleAnswer('A');
    setMultiAnswer(new Set());
    setShortAnswer('');
    setTagIds([]);
    setError('');
  };

  const handleEdit = (question: Question) => {
    setEditingId(question.questionId);
    setQType(question.questionType);
    setContent(question.content);
    setDifficulty(question.difficulty);
    setScore(question.defaultScore || 5);
    setOptionsMap(question.options ? { ...question.options } : { ...DEFAULT_OPTIONS });
    const answers = (question.answer || '').split(',').map(a => a.trim()).filter(Boolean);
    setSingleAnswer(answers[0] || 'A');
    setMultiAnswer(new Set(answers));
    setShortAnswer(question.answer || '');
    setTagIds(question.tagIds || []);
    setIsModalOpen(true);
  };

  const handleDelete = async (questionId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('确定要删除该题目吗？删除后无法恢复。')) {
      try {
        await api.deleteQuestion(questionId);
        setQuestions(prev => prev.filter(q => q.questionId !== questionId));
        setTimeout(() => fetchQuestions(searchQuery), 80);
      } catch (err: any) {
        alert(err?.message || '删除失败');
      }
    }
  };

  const handleOptionChange = (key: string, val: string) => {
    setOptionsMap(prev => ({ ...prev, [key]: val }));
  };

  const toggleMultiAnswer = (key: string) => {
    setMultiAnswer(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const tagsForQuestion = (q: Question) => {
    if (q.tagNames && q.tagNames.length) return q.tagNames;
    if (q.tagIds && availableTags.length) {
      return q.tagIds
        .map(id => availableTags.find(t => t.tagId === id)?.tagName)
        .filter(Boolean) as string[];
    }
    return [];
  };

  const answerValue = () => {
    if (qType === 'multiple') {
      const arr = Array.from(multiAnswer).sort();
      return arr.join(',');
    }
    if (qType === 'short') return shortAnswer.trim();
    return singleAnswer;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      alert('请填写题目内容');
      return;
    }
    if (qType !== 'short' && Object.values(optionsMap).every(v => !v.trim())) {
      alert('请填写至少一个选项');
      return;
    }
    if (!answerValue()) {
      alert('请设置正确答案');
      return;
    }

    const payload = {
      questionType: qType,
      difficulty,
      content,
      defaultScore: score,
      answer: answerValue(),
      options: qType === 'short' ? undefined : optionsMap,
      tagIds: tagIds.length ? tagIds : undefined,
    };

    try {
      setSaving(true);
      if (editingId) {
        await api.updateQuestion({ questionId: editingId, ...payload });
      } else {
        await api.createQuestion(payload);
      }
      setIsModalOpen(false);
      resetForm();
      fetchQuestions(searchQuery);
    } catch (err: any) {
      alert(err?.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const addTagId = (id: number, checked: boolean) => {
    setTagIds(prev => {
      if (checked) return Array.from(new Set([...prev, id]));
      return prev.filter(t => t !== id);
    });
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    try {
      const tag = await api.createTag({ tagName: newTagName.trim(), tagType: newTagType, extraInfo: '' });
      setAvailableTags(prev => [...prev, tag]);
      setTagIds(prev => [...prev, tag.tagId]);
      setNewTagName('');
    } catch (err: any) {
      alert(err?.message || '创建标签失败');
    }
  };

  const typeLabels: Record<QuestionType, string> = {
    single: '单选题',
    multiple: '多选题',
    judge: '判断题',
    short: '简答题',
  };

  const difficultyLabel: Record<Difficulty, string> = {
    easy: '简单',
    medium: '中等',
    hard: '困难',
  };

  const optionEntries = Object.entries(optionsMap);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <TagIcon className="text-primary" /> 题库管理
        </h1>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="搜索题目内容..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
            />
          </div>
          <button
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 shadow-sm transition-colors"
          >
            <Plus size={18} /> 新建题目
          </button>
        </div>
      </div>

      {error && <div className="text-red-500 text-sm">{error}</div>}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase w-16">ID</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">题目内容</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase w-32">类型</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase w-24">难度</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase w-20">分值</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">标签</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase w-28">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">加载中...</td></tr>
            ) : questions.length === 0 ? (
              <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">暂无题目，点击右上角创建。</td></tr>
            ) : questions.map(q => (
              <tr key={q.questionId} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-gray-400 font-mono text-xs">#{q.questionId}</td>
                <td className="px-6 py-4">
                  <p className="font-medium text-gray-900 line-clamp-2">{q.content}</p>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                    q.questionType === 'single' ? 'bg-blue-100 text-blue-700' :
                    q.questionType === 'multiple' ? 'bg-purple-100 text-purple-700' :
                    q.questionType === 'judge' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {typeLabels[q.questionType] || q.questionType}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{difficultyLabel[q.difficulty] || q.difficulty}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{q.defaultScore}</td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {tagsForQuestion(q).map((tag, i) => (
                      <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                        {tag}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(q)}
                    className="text-gray-400 hover:text-blue-600 transition-colors"
                    title="编辑"
                    type="button"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={(e) => handleDelete(q.questionId, e)}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                    title="删除"
                    type="button"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Question Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-gray-800">{editingId ? '编辑题目' : '新建题目'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">题型</label>
                  <select
                    value={qType}
                    onChange={e => setQType(e.target.value as QuestionType)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    {QUESTION_TYPE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">难度</label>
                  <select
                    value={difficulty}
                    onChange={e => setDifficulty(e.target.value as Difficulty)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    {DIFFICULTY_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">题目内容</label>
                <textarea
                  required
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent h-24 resize-none"
                  placeholder="请输入题目描述..."
                />
              </div>

              {qType !== 'short' && (
                <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700">选项设置</label>
                  {optionEntries.map(([key, val]) => (
                    <div key={key} className="flex items-center gap-3">
                      <span className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded-full text-xs font-bold text-gray-600">
                        {key}
                      </span>
                      <input
                        type="text"
                        value={val}
                        onChange={e => handleOptionChange(key, e.target.value)}
                        className="flex-1 p-2 border border-gray-300 rounded focus:border-primary outline-none"
                        placeholder={`选项 ${key}`}
                        required={qType !== 'short'}
                      />
                      {qType === 'single' || qType === 'judge' ? (
                        <button
                          type="button"
                          onClick={() => setSingleAnswer(key)}
                          className={`p-2 rounded-full transition-colors ${singleAnswer === key ? 'bg-green-100 text-green-600' : 'text-gray-300 hover:text-gray-500'}`}
                          title="设为正确选项"
                        >
                          <Check size={16} />
                        </button>
                      ) : (
                        <label className="flex items-center gap-1 text-sm text-gray-600">
                          <input
                            type="checkbox"
                            checked={multiAnswer.has(key)}
                            onChange={() => toggleMultiAnswer(key)}
                            className="accent-primary"
                          />
                          正确
                        </label>
                      )}
                    </div>
                  ))}
                  {qType === 'multiple' && <p className="text-xs text-gray-500">多选题可勾选多个正确选项，答案将按字母升序提交。</p>}
                  {qType === 'judge' && optionsMap.A === '' && optionsMap.B === '' && (
                    <p className="text-xs text-gray-500">推荐将 A/B 设置为 “对/错”。</p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {qType === 'short' ? '参考答案' : '正确答案'}
                </label>
                <textarea
                  required={qType === 'short'}
                  disabled={qType !== 'short'}
                  value={qType === 'short' ? shortAnswer : answerValue()}
                  onChange={e => setShortAnswer(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent h-20 disabled:bg-gray-100"
                  placeholder={qType === 'short' ? '请输入参考答案...' : '由上方选项选择'}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">标签</label>
                  <div className="border border-gray-300 rounded-lg p-2 flex flex-col gap-2 max-h-32 overflow-y-auto">
                    {availableTags.length === 0 && <span className="text-xs text-gray-400">暂无标签，请创建。</span>}
                    {availableTags.map(tag => (
                      <label key={tag.tagId} className="inline-flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={tagIds.includes(tag.tagId)}
                          onChange={e => addTagId(tag.tagId, e.target.checked)}
                          className="accent-primary"
                        />
                        {tag.tagName} <span className="text-gray-400 text-xs">({tag.tagType})</span>
                      </label>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="text"
                      value={newTagName}
                      onChange={e => setNewTagName(e.target.value)}
                      placeholder="新标签名称"
                      className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-primary"
                    />
                    <select
                      value={newTagType}
                      onChange={e => setNewTagType(e.target.value as any)}
                      className="p-2 border border-gray-300 rounded-lg text-sm bg-white"
                    >
                      <option value="KnowledgePoint">KnowledgePoint</option>
                      <option value="Difficulty">Difficulty</option>
                      <option value="Chapter">Chapter</option>
                      <option value="Others">Others</option>
                    </select>
                    <button type="button" onClick={handleCreateTag} className="px-3 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200">创建</button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">默认分值</label>
                  <input
                    type="number"
                    min="1"
                    value={score}
                    onChange={e => setScore(Number(e.target.value))}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 shadow-sm disabled:opacity-70"
                >
                  {saving ? '保存中...' : editingId ? '更新题目' : '保存题目'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionBank;
