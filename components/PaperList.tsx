import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Paper, Question } from '../types';
import { Plus, Layers, Search, Trash2, X, CheckSquare, Square, Edit2 } from 'lucide-react';

const PaperList: React.FC = () => {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Creation/Edit Form State
  const [paperName, setPaperName] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [searchQ, setSearchQ] = useState('');
  const [editingPaperId, setEditingPaperId] = useState<number | null>(null);

  useEffect(() => {
    fetchPapers();
  }, []);

  const fetchPapers = async () => {
    const data = await api.getPapers();
    setPapers(data);
  };

  const handleOpenCreate = async () => {
    const qs = await api.getQuestions();
    setQuestions(qs);
    setPaperName('');
    setSelectedIds(new Set());
    setSearchQ('');
    setEditingPaperId(null);
    setIsModalOpen(true);
  };

  const handleEdit = async (paper: Paper) => {
    const qs = await api.getQuestions();
    setQuestions(qs);
    setPaperName(paper.paperName);
    const existingIds = new Set(paper.questions.map(q => q.questionId));
    setSelectedIds(existingIds);
    setSearchQ('');
    setEditingPaperId(paper.paperId);
    setIsModalOpen(true);
  };

  const handleDelete = async (paperId: number) => {
    if (window.confirm('确定要删除这份试卷吗？如果该试卷已被考试引用，可能会影响考试显示。')) {
      await api.deletePaper(paperId);
      fetchPapers();
    }
  };

  const toggleSelection = (id: number) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const calculateTotalScore = () => {
    let total = 0;
    questions.forEach(q => {
      if (selectedIds.has(q.questionId)) total += q.defaultScore;
    });
    return total;
  };

  const handleSave = async () => {
    if (!paperName.trim()) {
      alert('请输入试卷名称');
      return;
    }
    if (selectedIds.size === 0) {
      alert('请至少选择一道题目');
      return;
    }

    const selectedQuestions = questions
      .filter(q => selectedIds.has(q.questionId))
      .map((q, idx) => ({
        questionId: q.questionId,
        questionScore: q.defaultScore,
        sequenceNum: idx + 1
      }));

    const paperData = {
      paperName,
      creatorId: 1, 
      totalScore: calculateTotalScore(),
      isDraft: false,
      questions: selectedQuestions
    };

    if (editingPaperId) {
      await api.updatePaper({
        ...paperData,
        paperId: editingPaperId
      });
    } else {
      await api.createPaper(paperData);
    }

    setIsModalOpen(false);
    fetchPapers();
  };

  const filteredQuestions = questions.filter(q => 
    q.content.toLowerCase().includes(searchQ.toLowerCase()) || 
    q.tags.some(t => t.toLowerCase().includes(searchQ.toLowerCase()))
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Layers className="text-primary" /> 试卷管理
        </h1>
        <button 
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={18} /> 新建试卷
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">试卷名称</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">题目数量</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">总分</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">创建人ID</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {papers.length === 0 ? (
               <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">暂无试卷。</td></tr>
            ) : papers.map(paper => (
              <tr key={paper.paperId} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-900">{paper.paperName}</td>
                <td className="px-6 py-4 text-gray-600">{paper.questions.length} 题</td>
                <td className="px-6 py-4 text-blue-600 font-bold">{paper.totalScore} 分</td>
                <td className="px-6 py-4 text-gray-500">#{paper.creatorId}</td>
                <td className="px-6 py-4 text-gray-400">
                  <button onClick={() => handleEdit(paper)} className="hover:text-blue-600 mr-2" title="编辑">
                    <Edit2 size={18} />
                  </button>
                  <button onClick={() => handleDelete(paper.paperId)} className="hover:text-red-600" title="删除">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl h-[85vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">{editingPaperId ? '编辑试卷' : '组卷'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 flex-1 flex flex-col overflow-hidden gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">试卷名称</label>
                <input 
                  type="text" 
                  value={paperName}
                  onChange={e => setPaperName(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="请输入试卷名称..."
                />
              </div>

              <div className="flex-1 border border-gray-200 rounded-lg overflow-hidden flex flex-col">
                <div className="p-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                   <div className="relative w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input 
                        type="text"
                        value={searchQ}
                        onChange={e => setSearchQ(e.target.value)}
                        placeholder="搜索题目..."
                        className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:border-primary"
                      />
                   </div>
                   <div className="text-sm text-gray-600">
                     已选: <span className="font-bold text-primary">{selectedIds.size}</span> 题 
                     (总分: <span className="font-bold text-primary">{calculateTotalScore()}</span>)
                   </div>
                </div>
                
                <div className="flex-1 overflow-y-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 w-12"></th>
                        <th className="px-4 py-2 text-xs font-semibold text-gray-500">内容</th>
                        <th className="px-4 py-2 text-xs font-semibold text-gray-500 w-24">题型</th>
                        <th className="px-4 py-2 text-xs font-semibold text-gray-500 w-16">难度</th>
                        <th className="px-4 py-2 text-xs font-semibold text-gray-500 w-16">分值</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredQuestions.map(q => {
                        const isSelected = selectedIds.has(q.questionId);
                        return (
                          <tr 
                            key={q.questionId} 
                            onClick={() => toggleSelection(q.questionId)}
                            className={`cursor-pointer hover:bg-blue-50 transition-colors ${isSelected ? 'bg-blue-50' : ''}`}
                          >
                            <td className="px-4 py-3 text-center">
                              {isSelected ? <CheckSquare size={18} className="text-primary mx-auto"/> : <Square size={18} className="text-gray-300 mx-auto"/>}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 line-clamp-2">{q.content}</td>
                            <td className="px-4 py-3 text-xs text-gray-600">{q.questionType}</td>
                            <td className="px-4 py-3 text-xs text-gray-600">{q.difficulty}</td>
                            <td className="px-4 py-3 text-xs font-bold text-gray-600">{q.defaultScore}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">取消</button>
              <button onClick={handleSave} className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-700">{editingPaperId ? '更新试卷' : '保存试卷'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaperList;