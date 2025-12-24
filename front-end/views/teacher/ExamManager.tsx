import React, { useState } from 'react';
import { Exam, Question } from '../../types';
import { Clock, FileText, Calendar, Trash2, Eye, CheckCircle, CircleDashed, Edit2, AlertTriangle, X } from 'lucide-react';
import CreateExam from './CreateExam';

interface ExamManagerProps {
  exams: Exam[];
  questionBank: Question[];
  onUpdateExam: (exam: Exam) => void;
  onDeleteExam: (id: string) => void;
}

const ExamManager: React.FC<ExamManagerProps> = ({ exams, questionBank, onUpdateExam, onDeleteExam }) => {
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      setDeleteConfirmId(id);
  };

  const confirmDelete = () => {
      if (deleteConfirmId) {
          onDeleteExam(deleteConfirmId);
          setDeleteConfirmId(null);
      }
  };

  const handleEdit = (e: React.MouseEvent, exam: Exam) => {
      e.stopPropagation();
      setEditingExam(exam);
  };

  if (editingExam) {
      return (
          <CreateExam 
            questionBank={questionBank}
            initialExam={editingExam}
            onSave={(updatedExam) => {
                onUpdateExam(updatedExam);
                setEditingExam(null);
            }}
            onCancel={() => setEditingExam(null)}
          />
      );
  }

  return (
    <div className="space-y-6 animate-fade-in relative">
      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 border border-slate-200" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center gap-3 text-red-600 mb-4">
                      <div className="bg-red-100 p-2 rounded-full">
                          <AlertTriangle size={24} />
                      </div>
                      <h3 className="text-lg font-bold">确认删除试卷？</h3>
                  </div>
                  <p className="text-slate-600 mb-6 text-sm">
                      您确定要删除这份试卷吗？此操作将永久移除该试卷及其相关数据，且<strong className="text-slate-800">无法撤销</strong>。
                  </p>
                  <div className="flex justify-end gap-3">
                      <button 
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors"
                      >
                          取消
                      </button>
                      <button 
                          onClick={confirmDelete}
                          className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg text-sm font-medium shadow-sm transition-colors flex items-center gap-2"
                      >
                          <Trash2 size={16} /> 确认删除
                      </button>
                  </div>
              </div>
          </div>
      )}

      <div>
        <h2 className="text-2xl font-bold text-slate-800">试卷管理</h2>
        <p className="text-slate-500">查看、编辑或删除已发布的考试。</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                    <tr>
                        <th className="px-6 py-4">试卷标题</th>
                        <th className="px-6 py-4">状态</th>
                        <th className="px-6 py-4">题量/总分</th>
                        <th className="px-6 py-4">考试时间</th>
                        <th className="px-6 py-4 text-right">操作</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {exams.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                暂无试卷，请点击“发布考试”创建。
                            </td>
                        </tr>
                    ) : (
                        exams.map((exam) => (
                            <tr key={exam.id} className="hover:bg-slate-50 transition-colors group relative">
                                <td className="px-6 py-4">
                                    <div className="font-semibold text-slate-800">{exam.title}</div>
                                    <div className="text-xs text-slate-500 line-clamp-1 mt-0.5">{exam.description}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                                        exam.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' :
                                        exam.status === 'DRAFT' ? 'bg-slate-100 text-slate-600' :
                                        'bg-blue-100 text-blue-700'
                                    }`}>
                                        {exam.status === 'PUBLISHED' ? <CheckCircle size={12}/> : <CircleDashed size={12}/>}
                                        {exam.status === 'PUBLISHED' ? '已发布' : exam.status === 'DRAFT' ? '草稿' : '已结束'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-slate-600">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-1" title="题目数量">
                                            <FileText size={14} className="text-slate-400"/> {exam.questions.length} 题
                                        </div>
                                        <div className="flex items-center gap-1" title="总分">
                                            <span className="text-slate-400 font-serif font-bold italic">Pts</span> {exam.totalPoints}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-slate-600">
                                    <div className="flex flex-col gap-1 text-xs">
                                        <div className="flex items-center gap-2">
                                            <Clock size={12} className="text-slate-400"/> {exam.durationMinutes} 分钟
                                        </div>
                                        <div className="flex items-center gap-2" title="截止时间">
                                            <Calendar size={12} className="text-slate-400"/> 
                                            {new Date(exam.endTime).toLocaleDateString()}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2 relative z-10">
                                        <button 
                                            onClick={(e) => handleEdit(e, exam)}
                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer" 
                                            title="编辑 / 查看详情"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button 
                                            onClick={(e) => handleDeleteClick(e, exam.id)}
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer" 
                                            title="删除"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default ExamManager;