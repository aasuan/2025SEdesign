import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Exam, Paper } from '../types';
import { Plus, Trash2, Edit2, X, Calendar, Clock, FileText } from 'lucide-react';

const ExamList: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [editingExamId, setEditingExamId] = useState<number | null>(null);
  const [examName, setExamName] = useState('');
  const [paperId, setPaperId] = useState<number | ''>('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);

  useEffect(() => {
    fetchExams();
    fetchPapers();
  }, []);

  const fetchExams = async () => {
    const data = await api.getExams();
    setExams(data);
  };

  const fetchPapers = async () => {
    const data = await api.getPapers();
    setPapers(data);
  };

  const resetForm = () => {
    setEditingExamId(null);
    setExamName('');
    setPaperId('');
    setStartTime('');
    setEndTime('');
    setDurationMinutes(60);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleEdit = (exam: Exam) => {
    setEditingExamId(exam.examId);
    setExamName(exam.examName);
    setPaperId(exam.paperId);
    // Format date for datetime-local input: YYYY-MM-DDThh:mm
    setStartTime(new Date(exam.startTime).toISOString().slice(0, 16));
    setEndTime(new Date(exam.endTime).toISOString().slice(0, 16));
    setDurationMinutes(exam.durationMinutes);
    setIsModalOpen(true);
  };

  const handleDelete = async (examId: number) => {
    if (window.confirm('确定要删除这场考试吗？删除后不可恢复。')) {
      try {
        await api.deleteExam(examId);
        fetchExams();
      } catch (e) {
        alert('删除失败');
      }
    }
  };

  const handleSaveExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examName || !paperId || !startTime || !endTime) {
      alert('请填写所有必填字段');
      return;
    }

    const examData = {
      paperId: Number(paperId),
      examName,
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      durationMinutes: Number(durationMinutes),
      proctorId: 1, // Default to current user in real app
      status: 'Pending' as const
    };

    try {
      if (editingExamId) {
        await api.updateExam({
          ...examData,
          examId: editingExamId
        });
      } else {
        await api.createExam(examData);
      }
      
      setIsModalOpen(false);
      resetForm();
      fetchExams();
    } catch (error) {
      console.error(error);
      alert('保存考试失败');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">考试管理</h1>
        <button 
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={18} /> 创建考试
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">考试名称</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">关联试卷</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">时间安排</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">状态</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {exams.length === 0 ? (
               <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">暂无考试安排。</td></tr>
            ) : exams.map(exam => (
              <tr key={exam.examId} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-900">{exam.examName}</td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <FileText size={14} className="text-gray-400"/>
                    {exam.paper?.paperName || `试卷 #${exam.paperId}`}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  <div className="flex flex-col gap-1">
                    <span className="flex items-center gap-1"><Calendar size={12}/> {new Date(exam.startTime).toLocaleDateString('zh-CN')}</span>
                    <span className="flex items-center gap-1"><Clock size={12}/> {exam.durationMinutes} 分钟</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    exam.status === 'Active' ? 'bg-green-100 text-green-800' : 
                    exam.status === 'Finished' ? 'bg-gray-100 text-gray-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {exam.status === 'Active' ? '进行中' : exam.status === 'Finished' ? '已结束' : exam.status === 'Pending' ? '未开始' : '已取消'}
                  </span>
                </td>
                <td className="px-6 py-4 flex gap-3 text-gray-400">
                  <button onClick={() => handleEdit(exam)} className="hover:text-blue-600" title="编辑">
                    <Edit2 size={18} />
                  </button>
                  <button onClick={() => handleDelete(exam.examId)} className="hover:text-red-600" title="删除">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Exam Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">{editingExamId ? '编辑考试' : '新建考试'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSaveExam} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">考试名称</label>
                <input 
                  type="text" 
                  required
                  value={examName}
                  onChange={e => setExamName(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="例如：2024 春季期中考试"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">选择试卷</label>
                <select 
                  required
                  value={paperId}
                  onChange={e => setPaperId(Number(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">请选择试卷...</option>
                  {papers.map(p => (
                    <option key={p.paperId} value={p.paperId}>{p.paperName} (总分: {p.totalScore})</option>
                  ))}
                </select>
                {papers.length === 0 && <p className="text-xs text-red-500 mt-1">暂无可用试卷，请先去创建试卷。</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">开始时间</label>
                  <input 
                    type="datetime-local" 
                    required
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">结束时间</label>
                  <input 
                    type="datetime-local" 
                    required
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">考试时长 (分钟)</label>
                <input 
                  type="number" 
                  min="1"
                  required
                  value={durationMinutes}
                  onChange={e => setDurationMinutes(Number(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
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
                  {editingExamId ? '更新考试' : '确认创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamList;