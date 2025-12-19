import React, { useState, useMemo, useEffect } from 'react';
import { Exam, Question } from '../../types';
import { Save, Sparkles, List, Search, Plus, Trash2, Clock, FileText, AlertCircle } from 'lucide-react';

interface CreateExamProps {
  questionBank: Question[];
  onSave: (exam: Exam) => void;
  onCancel: () => void;
  initialExam?: Exam; // Optional prop for Edit Mode
}

const CreateExam: React.FC<CreateExamProps> = ({ questionBank, onSave, onCancel, initialExam }) => {
  // Step 1: Basic Info
  const [basicInfo, setBasicInfo] = useState({
    title: '',
    description: '',
    durationMinutes: 60,
    totalPoints: 100
  });

  // Step 2: Question Selection
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
  const [mode, setMode] = useState<'MANUAL' | 'AUTO'>('MANUAL');

  // Manual Mode Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');

  // Auto Mode Config
  const [autoConfig, setAutoConfig] = useState({
    easyCount: 0,
    mediumCount: 0,
    hardCount: 0
  });

  // Load initial data if editing
  useEffect(() => {
    if (initialExam) {
        setBasicInfo({
            title: initialExam.title,
            description: initialExam.description,
            durationMinutes: initialExam.durationMinutes,
            totalPoints: initialExam.totalPoints
        });
        setSelectedQuestions(initialExam.questions);
    }
  }, [initialExam]);

  // --- Derived State for Manual Mode ---
  const filteredBank = useMemo(() => {
    return questionBank.filter(q => {
      const matchesSearch = q.content.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            q.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesType = filterType === 'ALL' || q.type === filterType;
      // Exclude already selected
      const notSelected = !selectedQuestions.find(sq => sq.id === q.id);
      return matchesSearch && matchesType && notSelected;
    });
  }, [questionBank, searchTerm, filterType, selectedQuestions]);

  // --- Actions ---

  const handleAddToExam = (q: Question) => {
    setSelectedQuestions([...selectedQuestions, q]);
  };

  const handleRemoveFromExam = (qId: string) => {
    setSelectedQuestions(selectedQuestions.filter(q => q.id !== qId));
  };

  const handleAutoGenerate = () => {
    const easyQs = questionBank.filter(q => q.difficulty === 'EASY');
    const mediumQs = questionBank.filter(q => q.difficulty === 'MEDIUM');
    const hardQs = questionBank.filter(q => q.difficulty === 'HARD');

    if (easyQs.length < autoConfig.easyCount || 
        mediumQs.length < autoConfig.mediumCount || 
        hardQs.length < autoConfig.hardCount) {
      alert(`题库题目不足！现有: 简单${easyQs.length}, 中等${mediumQs.length}, 困难${hardQs.length}`);
      return;
    }

    const shuffle = (arr: Question[]) => [...arr].sort(() => 0.5 - Math.random());
    
    const selectedEasy = shuffle(easyQs).slice(0, autoConfig.easyCount);
    const selectedMedium = shuffle(mediumQs).slice(0, autoConfig.mediumCount);
    const selectedHard = shuffle(hardQs).slice(0, autoConfig.hardCount);

    setSelectedQuestions([...selectedEasy, ...selectedMedium, ...selectedHard]);
  };

  const handleSave = () => {
    if (!basicInfo.title) return alert("请输入试卷标题");
    if (selectedQuestions.length === 0) return alert("试卷不能为空");

    const newExam: Exam = {
      id: initialExam ? initialExam.id : `exam-${Date.now()}`, // Keep ID if editing
      ...basicInfo,
      startTime: initialExam ? initialExam.startTime : new Date().toISOString(),
      endTime: initialExam ? initialExam.endTime : new Date(Date.now() + 86400000 * 30).toISOString(),
      status: 'PUBLISHED',
      questions: selectedQuestions
    };

    onSave(newExam);
  };

  const getTypeLabel = (type: string) => {
    switch(type) {
        case 'SINGLE_CHOICE': return '单选';
        case 'MULTIPLE_CHOICE': return '多选';
        case 'TRUE_FALSE': return '判断';
        case 'FILL_IN_THE_BLANK': return '填空';
        case 'SHORT_ANSWER': return '简答';
        default: return type;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
           <h2 className="text-2xl font-bold text-slate-800">{initialExam ? '编辑试卷' : '发布新考试'}</h2>
           <p className="text-slate-500">{initialExam ? '修改试卷信息及题目' : '配置试卷信息并组卷'}</p>
        </div>
        <div className="flex gap-3">
            <button onClick={onCancel} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg">取消</button>
            <button 
                onClick={handleSave}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2 font-medium"
            >
                <Save size={18} /> {initialExam ? '保存修改' : '发布试卷'}
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Configuration */}
        <div className="space-y-6 lg:col-span-1">
            {/* 1. Basic Info Card */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                    <FileText size={18} className="text-indigo-600"/> 基础信息
                </h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">试卷标题</label>
                        <input 
                            className="w-full p-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500"
                            placeholder="如：Java 期末模拟考"
                            value={basicInfo.title}
                            onChange={e => setBasicInfo({...basicInfo, title: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">考试描述</label>
                        <textarea 
                            className="w-full p-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500 h-20 resize-none"
                            placeholder="考试范围及注意事项..."
                            value={basicInfo.description}
                            onChange={e => setBasicInfo({...basicInfo, description: e.target.value})}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">时长 (分钟)</label>
                            <div className="relative">
                                <Clock size={14} className="absolute left-3 top-3 text-slate-400"/>
                                <input 
                                    type="number"
                                    className="w-full p-2 pl-9 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500"
                                    value={basicInfo.durationMinutes}
                                    onChange={e => setBasicInfo({...basicInfo, durationMinutes: parseInt(e.target.value) || 0})}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">总分</label>
                            <input 
                                type="number"
                                className="w-full p-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500"
                                value={basicInfo.totalPoints}
                                onChange={e => setBasicInfo({...basicInfo, totalPoints: parseInt(e.target.value) || 0})}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Strategy Card */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                    <List size={18} className="text-indigo-600"/> 组卷策略
                </h3>
                
                <div className="flex bg-slate-100 p-1 rounded-lg mb-4">
                    <button 
                        className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${mode === 'MANUAL' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}
                        onClick={() => setMode('MANUAL')}
                    >
                        人工选题
                    </button>
                    <button 
                         className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${mode === 'AUTO' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}
                        onClick={() => setMode('AUTO')}
                    >
                        AI 智能组卷
                    </button>
                </div>

                {mode === 'AUTO' ? (
                    <div className="space-y-4 animate-fade-in">
                        <div className="p-3 bg-indigo-50 rounded-lg text-xs text-indigo-700 leading-relaxed">
                            <Sparkles size={14} className="inline mr-1"/>
                            系统将根据已有题库，自动按难度分布随机抽取题目。
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-600">简单题目数</span>
                                <input 
                                    type="number" className="w-16 p-1 border rounded text-center text-sm"
                                    value={autoConfig.easyCount}
                                    onChange={e => setAutoConfig({...autoConfig, easyCount: parseInt(e.target.value) || 0})}
                                />
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-600">中等题目数</span>
                                <input 
                                    type="number" className="w-16 p-1 border rounded text-center text-sm"
                                    value={autoConfig.mediumCount}
                                    onChange={e => setAutoConfig({...autoConfig, mediumCount: parseInt(e.target.value) || 0})}
                                />
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-600">困难题目数</span>
                                <input 
                                    type="number" className="w-16 p-1 border rounded text-center text-sm"
                                    value={autoConfig.hardCount}
                                    onChange={e => setAutoConfig({...autoConfig, hardCount: parseInt(e.target.value) || 0})}
                                />
                            </div>
                        </div>
                        <button 
                            onClick={handleAutoGenerate}
                            className="w-full bg-slate-800 text-white py-2 rounded-lg text-sm font-medium hover:bg-slate-900"
                        >
                            执行生成
                        </button>
                    </div>
                ) : (
                    <div className="animate-fade-in">
                         <div className="relative mb-3">
                            <Search className="absolute left-2 top-2 text-slate-400" size={14} />
                            <input 
                                placeholder="搜索题目内容或标签..."
                                className="w-full pl-8 pr-2 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                         </div>
                         <div className="h-[300px] overflow-y-auto pr-1 space-y-2">
                            {filteredBank.length === 0 ? (
                                <div className="text-center py-8 text-slate-400 text-xs">
                                    没有找到匹配的题目
                                </div>
                            ) : filteredBank.map(q => (
                                <div key={q.id} className="p-2 border border-slate-100 rounded-lg bg-slate-50 hover:bg-white hover:border-indigo-200 transition-colors group cursor-pointer" onClick={() => handleAddToExam(q)}>
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${q.difficulty === 'EASY' ? 'bg-green-100 text-green-700' : q.difficulty === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                            {q.difficulty}
                                        </span>
                                        <Plus size={14} className="text-indigo-600 opacity-0 group-hover:opacity-100"/>
                                    </div>
                                    <p className="text-xs text-slate-700 line-clamp-2">{q.content}</p>
                                </div>
                            ))}
                         </div>
                    </div>
                )}
            </div>
        </div>

        {/* Right Column: Preview */}
        <div className="lg:col-span-2 space-y-4">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm min-h-[600px] flex flex-col">
                <div className="flex justify-between items-end border-b border-slate-100 pb-4 mb-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">{basicInfo.title || '未命名试卷'}</h2>
                        <div className="flex gap-4 text-xs text-slate-500 mt-1">
                            <span>总分: {basicInfo.totalPoints}</span>
                            <span>时长: {basicInfo.durationMinutes} 分钟</span>
                            <span>题目数: {selectedQuestions.length}</span>
                        </div>
                    </div>
                    {selectedQuestions.length === 0 && (
                        <div className="text-orange-500 flex items-center gap-1 text-sm font-medium">
                            <AlertCircle size={16}/> 请在左侧添加题目
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                    {selectedQuestions.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400">
                             <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                 <FileText size={24} className="text-slate-300"/>
                             </div>
                             <p>暂无题目，请使用左侧工具组卷。</p>
                        </div>
                    ) : (
                        selectedQuestions.map((q, idx) => (
                            <div key={q.id} className="flex gap-4 p-4 rounded-xl border border-slate-100 bg-white hover:shadow-sm transition-shadow group">
                                <div className="font-bold text-slate-400 w-6 pt-1">
                                    {idx + 1}.
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">
                                            {getTypeLabel(q.type)}
                                        </span>
                                        <span className="text-xs text-slate-400">
                                            {q.difficulty}
                                        </span>
                                    </div>
                                    <p className="text-slate-800 text-sm mb-2">{q.content}</p>
                                    {(q.type === 'SINGLE_CHOICE' || q.type === 'MULTIPLE_CHOICE') && (
                                        <div className="grid grid-cols-2 gap-2">
                                            {q.options?.map((opt, i) => (
                                                <div key={i} className="text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded">
                                                    {String.fromCharCode(65+i)}. {opt}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <button 
                                    onClick={() => handleRemoveFromExam(q.id)}
                                    className="self-start p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 size={16}/>
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default CreateExam;