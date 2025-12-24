import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Question, QuestionType } from '../types';
import { Search, Plus, Tag, X, ChevronDown, Check, Edit2, Trash2 } from 'lucide-react';

const QuestionBank: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form State
  const [qType, setQType] = useState<QuestionType>(QuestionType.SingleChoice);
  const [content, setContent] = useState('');
  const [difficulty, setDifficulty] = useState<'简单' | '中等' | '困难'>('简单');
  const [score, setScore] = useState(5);
  const [answer, setAnswer] = useState('');
  const [options, setOptions] = useState<string[]>(['', '', '', '']);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    fetchQuestions();
  }, []);

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      fetchQuestions(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchQuestions = async (query?: string) => {
    const data = await api.getQuestions(query);
    setQuestions(data);
  };

  const resetForm = () => {
    setEditingId(null);
    setQType(QuestionType.SingleChoice);
    setContent('');
    setDifficulty('简单');
    setScore(5);
    setAnswer('');
    setOptions(['', '', '', '']);
    setTags([]);
    setTagInput('');
  };

  const handleEdit = (question: Question) => {
    setEditingId(question.questionId);
    setQType(question.questionType);
    setContent(question.content);
    setDifficulty(question.difficulty);
    setScore(question.defaultScore);
    setAnswer(question.answer);
    setOptions(question.options || ['', '', '', '']);
    setTags(question.tags || []);
    setIsModalOpen(true);
  };

  const handleDelete = async (questionId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('确定要删除这道题目吗？删除后将无法恢复。')) {
      try {
        await api.deleteQuestion(questionId);
        setQuestions(prev => prev.filter(q => q.questionId !== questionId));
        // Ensure sync
        setTimeout(() => fetchQuestions(searchQuery), 100); 
      } catch (e) {
        alert('删除失败');
      }
    }
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleOptionChange = (index: number, val: string) => {
    const newOpts = [...options];
    newOpts[index] = val;
    setOptions(newOpts);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content || !answer) {
      alert('请填写题目内容和参考答案');
      return;
    }

    const questionData = {
      questionType: qType,
      difficulty,
      content,
      defaultScore: score,
      answer,
      options: qType === QuestionType.SingleChoice ? options : undefined,
      tags
    };

    if (editingId) {
      // Update
      const existingQuestion = questions.find(q => q.questionId === editingId);
      if (existingQuestion) {
        await api.updateQuestion({
          ...existingQuestion,
          ...questionData
        });
      }
    } else {
      // Create
      await api.createQuestion(questionData);
    }

    setIsModalOpen(false);
    resetForm();
    fetchQuestions(searchQuery);
  };

  const typeLabels: Record<string, string> = {
    [QuestionType.SingleChoice]: '单选题',
    [QuestionType.FillBlank]: '填空题',
    [QuestionType.ShortAnswer]: '简答题'
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Tag className="text-primary" /> 题库管理
        </h1>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="搜索标签或题目内容..."
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
            {questions.length === 0 ? (
              <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">暂无题目，请点击右上角创建。</td></tr>
            ) : questions.map(q => (
              <tr key={q.questionId} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-gray-400 font-mono text-xs">#{q.questionId}</td>
                <td className="px-6 py-4">
                  <p className="font-medium text-gray-900 line-clamp-1">{q.content}</p>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                    q.questionType === QuestionType.SingleChoice ? 'bg-blue-100 text-blue-700' :
                    q.questionType === QuestionType.FillBlank ? 'bg-purple-100 text-purple-700' :
                    'bg-orange-100 text-orange-700'
                  }`}>
                    {typeLabels[q.questionType] || q.questionType}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{q.difficulty}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{q.defaultScore}</td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {q.tags.map((tag, i) => (
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
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
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
                    <option value={QuestionType.SingleChoice}>单选题</option>
                    <option value={QuestionType.FillBlank}>填空题</option>
                    <option value={QuestionType.ShortAnswer}>简答题</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">难度</label>
                  <select 
                    value={difficulty} 
                    onChange={e => setDifficulty(e.target.value as any)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="简单">简单</option>
                    <option value="中等">中等</option>
                    <option value="困难">困难</option>
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

              {qType === QuestionType.SingleChoice && (
                <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700">选项设置</label>
                  {options.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <span className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded-full text-xs font-bold text-gray-600">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <input 
                        type="text"
                        value={opt}
                        onChange={e => handleOptionChange(idx, e.target.value)}
                        className="flex-1 p-2 border border-gray-300 rounded focus:border-primary outline-none"
                        placeholder={`选项 ${String.fromCharCode(65 + idx)}`}
                        required
                      />
                      <button 
                        type="button"
                        onClick={() => setAnswer(opt)}
                        className={`p-2 rounded-full transition-colors ${answer === opt && opt !== '' ? 'bg-green-100 text-green-600' : 'text-gray-300 hover:text-gray-500'}`}
                        title="设为正确答案"
                      >
                        <Check size={16} />
                      </button>
                    </div>
                  ))}
                  <p className="text-xs text-gray-500">点击右侧对勾设置正确选项，或者下方手动输入。</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {qType === QuestionType.SingleChoice ? '正确答案 (对应选项内容)' : '参考答案'}
                </label>
                <textarea 
                  required
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent h-20"
                  placeholder="请输入参考答案..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">标签</label>
                    <div className="border border-gray-300 rounded-lg p-2 flex flex-wrap gap-2 focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent">
                      {tags.map((tag, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                          {tag}
                          <button type="button" onClick={() => removeTag(tag)} className="hover:text-blue-900"><X size={12}/></button>
                        </span>
                      ))}
                      <input 
                        type="text" 
                        value={tagInput}
                        onChange={e => setTagInput(e.target.value)}
                        onKeyDown={handleAddTag}
                        className="flex-1 min-w-[80px] outline-none text-sm"
                        placeholder="输入回车添加"
                      />
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
                  className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 shadow-sm"
                >
                  {editingId ? '更新题目' : '保存题目'}
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