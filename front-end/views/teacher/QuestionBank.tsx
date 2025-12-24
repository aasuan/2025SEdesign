import React, { useState } from 'react';
import { Question, QuestionType } from '../../types';
import { generateQuestionsByTopic } from '../../services/geminiService';
import { Plus, Sparkles, Save, Tag, Loader2, Trash2, CheckSquare, Type, List, AlignLeft, Edit2, X, Check, Search, Pencil, BarChart } from 'lucide-react';

interface QuestionBankProps {
  questions: Question[];
  setQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
}

const QuestionBank: React.FC<QuestionBankProps> = ({ questions, setQuestions }) => {
  const [topic, setTopic] = useState('');
  const [aiType, setAiType] = useState<QuestionType>(QuestionType.SINGLE_CHOICE);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Search State
  const [tagSearch, setTagSearch] = useState('');

  // Tag Editing State (Inline for Existing Questions)
  const [editingTagsId, setEditingTagsId] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');

  // Manual Entry / Edit Form State
  const [editingId, setEditingId] = useState<string | null>(null); // Tracks if we are editing an existing question
  const [newTagInput, setNewTagInput] = useState(''); 
  const [newQuestion, setNewQuestion] = useState<Partial<Question>>({
    type: QuestionType.SINGLE_CHOICE,
    options: ['', '', '', ''],
    tags: [],
    difficulty: 'MEDIUM' // Default difficulty
  });

  const handleAIGenerate = async () => {
    if (!topic.trim()) return;
    setIsGenerating(true);
    try {
      const generated = await generateQuestionsByTopic(topic, 5, 'Medium', aiType);
      setQuestions(prev => [...prev, ...generated]);
    } catch (e) {
      alert("题目生成失败，请检查 API Key。");
    } finally {
      setIsGenerating(false);
    }
  };

  // Prepare form for creating a new question
  const handleOpenCreateForm = () => {
      setEditingId(null);
      setNewQuestion({
        type: QuestionType.SINGLE_CHOICE,
        options: ['', '', '', ''],
        tags: [],
        difficulty: 'MEDIUM'
      });
      setShowForm(true);
      setNewTagInput('');
  };

  // Prepare form for editing an existing question
  const handleEditQuestion = (q: Question) => {
      setEditingId(q.id);
      setNewQuestion({
          ...q,
          // Create copies of arrays to avoid mutation
          options: q.options ? [...q.options] : [],
          tags: [...q.tags]
      });
      setShowForm(true);
      setNewTagInput('');
      // Scroll to top to see the form
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleManualSave = () => {
    if (!newQuestion.content || !newQuestion.correctAnswer) {
      alert("请填写完整的题目内容和正确答案");
      return;
    }
    
    // 如果是选择题，过滤掉空选项
    const finalOptions = (newQuestion.type === QuestionType.SINGLE_CHOICE || newQuestion.type === QuestionType.MULTIPLE_CHOICE)
      ? newQuestion.options?.filter(o => o.trim() !== '') || []
      : [];

    const questionData: Question = {
      id: editingId || `man-${Date.now()}`, // Keep existing ID if editing, else new ID
      content: newQuestion.content,
      type: newQuestion.type as QuestionType,
      options: finalOptions,
      correctAnswer: newQuestion.correctAnswer,
      difficulty: newQuestion.difficulty || 'MEDIUM', // Ensure default logic
      tags: newQuestion.tags || [],
      explanation: newQuestion.explanation
    };

    if (editingId) {
        // Update existing question
        setQuestions(prev => prev.map(q => q.id === editingId ? questionData : q));
    } else {
        // Create new question
        setQuestions(prev => [...prev, questionData]);
    }
    
    // Cleanup
    setShowForm(false);
    setEditingId(null);
    setNewQuestion({ type: QuestionType.SINGLE_CHOICE, options: ['', '', '', ''], tags: [], difficulty: 'MEDIUM' });
    setNewTagInput('');
  };

  // --- Tag Logic for Form ---
  const handleAddNewTag = () => {
    if (!newTagInput.trim()) return;
    const currentTags = newQuestion.tags || [];
    if (!currentTags.includes(newTagInput.trim())) {
      setNewQuestion({ ...newQuestion, tags: [...currentTags, newTagInput.trim()] });
    }
    setNewTagInput('');
  };

  const handleRemoveNewTag = (tagToRemove: string) => {
    const currentTags = newQuestion.tags || [];
    setNewQuestion({ ...newQuestion, tags: currentTags.filter(t => t !== tagToRemove) });
  };

  // --- Tag Management Logic (Inline List View) ---

  const handleAddTag = (qId: string) => {
    if (!tagInput.trim()) return;
    setQuestions(prev => prev.map(q => {
      if (q.id === qId) {
        // Prevent duplicates
        if (q.tags.includes(tagInput.trim())) return q;
        return { ...q, tags: [...q.tags, tagInput.trim()] };
      }
      return q;
    }));
    setTagInput('');
  };

  const handleRemoveTag = (qId: string, tagToRemove: string) => {
    setQuestions(prev => prev.map(q => {
      if (q.id === qId) {
        return { ...q, tags: q.tags.filter(t => t !== tagToRemove) };
      }
      return q;
    }));
  };

  const handleEditTagText = (qId: string, oldTag: string) => {
    const newTag = window.prompt("修改标签名称:", oldTag);
    if (newTag !== null && newTag.trim() !== "" && newTag !== oldTag) {
        setQuestions(prev => prev.map(q => {
            if (q.id === qId) {
                const updatedTags = q.tags.map(t => t === oldTag ? newTag.trim() : t);
                return { ...q, tags: updatedTags };
            }
            return q;
        }));
    }
  };

  // ---------------------------

  const getTypeLabel = (type: string) => {
      switch(type) {
          case 'SINGLE_CHOICE': return '单选题';
          case 'MULTIPLE_CHOICE': return '多选题';
          case 'TRUE_FALSE': return '判断题';
          case 'FILL_IN_THE_BLANK': return '填空题';
          case 'SHORT_ANSWER': return '简答题';
          default: return type;
      }
  };

  const getDifficultyLabel = (diff: string) => {
      switch(diff) {
          case 'EASY': return '简单';
          case 'MEDIUM': return '中等';
          case 'HARD': return '困难';
          default: return diff;
      }
  };

  const isChoiceType = (type?: QuestionType) => 
    type === QuestionType.SINGLE_CHOICE || type === QuestionType.MULTIPLE_CHOICE;

  // Filter questions based on tag search
  const filteredQuestions = questions.filter(q => {
    if (!tagSearch.trim()) return true;
    // Fuzzy search in tags
    return q.tags.some(tag => tag.toLowerCase().includes(tagSearch.toLowerCase()));
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">题库管理</h2>
          <p className="text-slate-500">创建、导入或使用 AI 生成考试题目。</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex bg-white border border-slate-200 rounded-lg overflow-hidden focus-within:ring-2 ring-indigo-500">
             <select 
                className="bg-slate-50 border-r border-slate-200 text-xs px-2 py-2 outline-none text-slate-600 font-medium"
                value={aiType}
                onChange={(e) => setAiType(e.target.value as QuestionType)}
             >
                <option value={QuestionType.SINGLE_CHOICE}>单选题</option>
                <option value={QuestionType.MULTIPLE_CHOICE}>多选题</option>
                <option value={QuestionType.FILL_IN_THE_BLANK}>填空题</option>
                <option value={QuestionType.SHORT_ANSWER}>简答题</option>
                <option value={QuestionType.TRUE_FALSE}>判断题</option>
             </select>
            <input 
              type="text" 
              value={topic} 
              onChange={(e) => setTopic(e.target.value)}
              placeholder="输入主题..." 
              className="px-4 py-2 outline-none text-sm w-32 md:w-48"
            />
            <button 
              onClick={handleAIGenerate}
              disabled={isGenerating || !topic}
              className="bg-indigo-50 px-4 py-2 text-indigo-600 hover:bg-indigo-100 flex items-center gap-2 text-sm font-medium border-l border-slate-200 disabled:opacity-50"
            >
              {isGenerating ? <Loader2 className="animate-spin" size={16}/> : <Sparkles size={16} />}
              AI 生成
            </button>
          </div>
          <button 
            onClick={() => {
                if (showForm && !editingId) {
                    setShowForm(false);
                } else {
                    handleOpenCreateForm();
                }
            }}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2 text-sm font-medium whitespace-nowrap"
          >
            <Plus size={16} />
            手动添加
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm animate-fade-in ring-2 ring-indigo-50 relative">
            <button 
                onClick={() => { setShowForm(false); setEditingId(null); }} 
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
                <X size={20} />
            </button>
            <div className="flex justify-between items-center mb-4">
               <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                   {editingId ? <Edit2 size={18} className="text-indigo-600"/> : <Plus size={18} className="text-green-600"/>}
                   {editingId ? "编辑题目" : "创建新题目"}
               </h3>
               <div className="flex gap-2 mr-8">
                    <select
                        className="p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 font-medium text-slate-700 outline-none focus:ring-2 ring-indigo-500"
                        value={newQuestion.difficulty || 'MEDIUM'}
                        onChange={(e) => setNewQuestion({...newQuestion, difficulty: e.target.value as any})}
                    >
                        <option value="EASY">难度: 简单</option>
                        <option value="MEDIUM">难度: 中等</option>
                        <option value="HARD">难度: 困难</option>
                    </select>
                   <select 
                     className="p-2 border border-slate-200 rounded-lg text-sm bg-slate-50 font-medium text-slate-700 outline-none focus:ring-2 ring-indigo-500"
                     value={newQuestion.type}
                     onChange={(e) => setNewQuestion({...newQuestion, type: e.target.value as QuestionType})}
                   >
                     <option value={QuestionType.SINGLE_CHOICE}>单项选择题</option>
                     <option value={QuestionType.MULTIPLE_CHOICE}>多项选择题</option>
                     <option value={QuestionType.FILL_IN_THE_BLANK}>填空题</option>
                     <option value={QuestionType.SHORT_ANSWER}>简答题</option>
                   </select>
               </div>
            </div>
            
            <div className="space-y-4">
                <div className="relative">
                  <span className="absolute top-3 left-3 text-slate-400">
                    <Type size={16} />
                  </span>
                  <textarea 
                    placeholder={
                      newQuestion.type === QuestionType.FILL_IN_THE_BLANK 
                      ? "请输入题目内容，使用 ______ 表示填空位置..." 
                      : "请输入题目内容..."
                    }
                    className="w-full p-3 pl-10 border border-slate-200 rounded-lg text-sm focus:ring-2 ring-indigo-500 outline-none min-h-[80px]"
                    value={newQuestion.content || ''}
                    onChange={e => setNewQuestion({...newQuestion, content: e.target.value})}
                  />
                </div>

                {/* Options Input - Only for Choice Types */}
                {isChoiceType(newQuestion.type) && (
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <label className="text-xs font-semibold text-slate-500 uppercase mb-2 block">选项设置</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {newQuestion.options?.map((opt, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <span className="text-sm font-medium text-slate-400 w-6">{String.fromCharCode(65+i)}.</span>
                              <input 
                                  placeholder={`选项内容`}
                                  className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none"
                                  value={opt}
                                  onChange={e => {
                                      const newOpts = [...(newQuestion.options || [])];
                                      newOpts[i] = e.target.value;
                                      setNewQuestion({...newQuestion, options: newOpts});
                                  }}
                              />
                            </div>
                        ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="relative">
                        <span className="absolute top-2.5 left-3 text-slate-400">
                          <CheckSquare size={16} />
                        </span>
                        <input 
                            placeholder={isChoiceType(newQuestion.type) ? "正确选项 (如: A 或 A,B)" : "参考答案关键字"}
                            className="w-full p-2 pl-10 border border-slate-200 rounded-lg text-sm focus:ring-2 ring-indigo-500 outline-none"
                            value={newQuestion.correctAnswer as string || ''}
                            onChange={e => setNewQuestion({...newQuestion, correctAnswer: e.target.value})}
                        />
                     </div>
                     {/* Tags Input Section */}
                     <div className="relative flex items-center gap-2">
                        <div className="relative flex-1">
                            <span className="absolute top-2.5 left-3 text-slate-400">
                                <Tag size={16} />
                            </span>
                            <input 
                                placeholder="输入标签按回车添加..."
                                className="w-full p-2 pl-10 border border-slate-200 rounded-lg text-sm focus:ring-2 ring-indigo-500 outline-none"
                                value={newTagInput}
                                onChange={e => setNewTagInput(e.target.value)}
                                onKeyDown={e => {
                                    if(e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddNewTag();
                                    }
                                }}
                            />
                        </div>
                        <button onClick={handleAddNewTag} className="bg-slate-100 text-slate-600 p-2 rounded-lg hover:bg-slate-200">
                            <Plus size={18} />
                        </button>
                     </div>
                </div>

                {/* Display added tags for new question */}
                {newQuestion.tags && newQuestion.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {newQuestion.tags.map(t => (
                            <span key={t} className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-xs flex items-center gap-1">
                                {t}
                                <button onClick={() => handleRemoveNewTag(t)} className="hover:text-red-500">
                                    <X size={12} />
                                </button>
                            </span>
                        ))}
                    </div>
                )}
                
                <div className="flex justify-end pt-2 gap-3">
                     <button 
                        onClick={() => { setShowForm(false); setEditingId(null); }}
                        className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors"
                     >
                        取消
                     </button>
                     <button onClick={handleManualSave} className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2">
                        <Save size={16} /> {editingId ? "更新题目" : "保存题目"}
                     </button>
                </div>
            </div>
        </div>
      )}

      {/* Filter Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
            type="text"
            placeholder="搜索题目标签 (如 'Java', 'Spring')..."
            value={tagSearch}
            onChange={e => setTagSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 ring-indigo-500 outline-none text-sm bg-white shadow-sm"
        />
        {tagSearch && (
            <button 
                onClick={() => setTagSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
                <X size={16} />
            </button>
        )}
      </div>

      <div className="grid gap-4">
        {filteredQuestions.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
                <p className="text-slate-400">{tagSearch ? "未找到包含该标签的题目。" : "题库中暂无题目。"}</p>
            </div>
        ) : filteredQuestions.map(q => (
          <div key={q.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group relative">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-2 py-1 rounded ${
                    q.difficulty === 'EASY' ? 'bg-green-100 text-green-700' :
                    q.difficulty === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                }`}>{getDifficultyLabel(q.difficulty)}</span>
                <span className={`text-xs font-medium px-2 py-1 rounded flex items-center gap-1 ${
                  q.type === QuestionType.SHORT_ANSWER ? 'bg-purple-100 text-purple-700' :
                  q.type === QuestionType.FILL_IN_THE_BLANK ? 'bg-orange-100 text-orange-700' :
                  'bg-slate-100 text-slate-500'
                }`}>
                  {q.type === QuestionType.SHORT_ANSWER && <AlignLeft size={12}/>}
                  {q.type === QuestionType.FILL_IN_THE_BLANK && <Type size={12}/>}
                  {(q.type === QuestionType.SINGLE_CHOICE || q.type === QuestionType.MULTIPLE_CHOICE) && <List size={12}/>}
                  {getTypeLabel(q.type)}
                </span>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                    onClick={() => handleEditQuestion(q)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                    title="编辑内容"
                >
                    <Pencil size={16} />
                </button>
                <button 
                    onClick={() => setQuestions(questions.filter(qi => qi.id !== q.id))}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="删除题目"
                >
                    <Trash2 size={16} />
                </button>
              </div>
            </div>
            <p className="text-slate-800 font-medium mb-3 whitespace-pre-wrap">{q.content}</p>
            
            {/* Render options only for choice questions */}
            {isChoiceType(q.type) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-slate-600 mb-3">
                {q.options?.map((opt, i) => (
                  <div key={i} className={`px-3 py-2 rounded border ${
                      // Simple check for correct answer display (won't cover all complex multi-choice cases perfectly but good for UI)
                      (typeof q.correctAnswer === 'string' && q.correctAnswer.includes(opt)) 
                      ? 'bg-green-50 border-green-200 text-green-700' 
                      : 'border-slate-100'
                  }`}>
                      <span className="font-mono font-bold mr-2">{String.fromCharCode(65+i)}.</span> {opt}
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-2 text-xs text-slate-500 bg-slate-50 p-2 rounded inline-block">
               <span className="font-semibold">参考答案:</span> {Array.isArray(q.correctAnswer) ? q.correctAnswer.join(', ') : q.correctAnswer}
            </div>

            {/* Tag Management Section */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center flex-wrap gap-2">
               <div className="text-xs text-slate-400 flex items-center gap-1 mr-2">
                  <Tag size={12} /> 标签:
               </div>
               
               {editingTagsId === q.id ? (
                  // Edit Mode
                  <div className="flex items-center gap-2 flex-wrap bg-slate-50 p-2 rounded-lg border border-indigo-100 w-full md:w-auto animate-fade-in">
                      {q.tags.map(t => (
                        <span key={t} className="flex items-center gap-1 text-xs bg-white text-slate-600 px-2 py-1 rounded border border-slate-200 group/tag">
                            <span 
                                onClick={() => handleEditTagText(q.id, t)}
                                className="cursor-pointer hover:text-indigo-600 border-b border-transparent hover:border-indigo-300 border-dashed"
                                title="点击修改文字"
                            >
                                {t}
                            </span>
                            <button onClick={() => handleRemoveTag(q.id, t)} className="text-slate-400 hover:text-red-500 ml-1">
                                <X size={12} />
                            </button>
                        </span>
                      ))}
                      <div className="flex items-center gap-1">
                          <input 
                             type="text" 
                             className="text-xs p-1 border border-slate-300 rounded w-24 outline-none focus:border-indigo-500"
                             placeholder="新标签..."
                             value={tagInput}
                             onChange={e => setTagInput(e.target.value)}
                             onKeyDown={e => {
                                 if (e.key === 'Enter') handleAddTag(q.id);
                             }}
                          />
                          <button onClick={() => handleAddTag(q.id)} className="text-indigo-600 hover:bg-indigo-50 p-1 rounded">
                              <Plus size={14} />
                          </button>
                      </div>
                      <button 
                        onClick={() => { setEditingTagsId(null); setTagInput(''); }} 
                        className="ml-auto text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700 flex items-center gap-1"
                      >
                         <Check size={12} /> 完成
                      </button>
                  </div>
               ) : (
                  // View Mode
                  <>
                    {q.tags.length > 0 ? (
                        q.tags.map(t => (
                            <span key={t} className={`text-xs px-2 py-1 rounded ${
                                // Highlight matched tags in search
                                tagSearch && t.toLowerCase().includes(tagSearch.toLowerCase()) 
                                ? 'bg-indigo-100 text-indigo-700 font-bold' 
                                : 'bg-slate-100 text-slate-500'
                            }`}>
                                {t}
                            </span>
                        ))
                    ) : (
                        <span className="text-xs text-slate-300 italic">无标签</span>
                    )}
                    <button 
                        onClick={() => { setEditingTagsId(q.id); setTagInput(''); }}
                        className="text-xs text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded flex items-center gap-1 ml-auto md:ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="快速管理标签"
                    >
                        <Edit2 size={12} /> 管理
                    </button>
                  </>
               )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuestionBank;