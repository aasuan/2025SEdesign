import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Exam, ExamParticipant, Paper, UserProfile } from '../types';
import { Plus, Edit2, X, Calendar, Clock, FileText, Eye } from 'lucide-react';

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
  const [participantKeyword, setParticipantKeyword] = useState('');
  const [participantOptions, setParticipantOptions] = useState<UserProfile[]>([]);
  const [selectedParticipants, setSelectedParticipants] = useState<number[]>([]);
  const [detailExam, setDetailExam] = useState<Exam | null>(null);
  const [detailParticipants, setDetailParticipants] = useState<ExamParticipant[]>([]);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

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
    setParticipantKeyword('');
    setParticipantOptions([]);
    setSelectedParticipants([]);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const toInputDate = (value?: string) => {
    if (!value) return '';
    const v = value.replace(' ', 'T');
    return v.length >= 16 ? v.slice(0, 16) : v;
  };

  const handleEdit = (exam: Exam) => {
    setEditingExamId(exam.examId);
    setExamName(exam.examName);
    setPaperId(exam.paperId);
    setStartTime(toInputDate(exam.startTime));
    setEndTime(toInputDate(exam.endTime));
    setDurationMinutes(exam.durationMinutes);
    api.getExamParticipants(exam.examId).then((list) => {
      setSelectedParticipants(list.map((p) => p.studentId));
    });
    setIsModalOpen(true);
  };

  const handleSaveExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examName || !paperId || !startTime || !endTime) {
      alert('请填写所有必填字段');
      return;
    }

    const normalizeTime = (value: string) => (value.length === 16 ? `${value}:00` : value);
    const parsedParticipants = Array.from(new Set(selectedParticipants)).filter((v) => !Number.isNaN(v));

    const startDate = new Date(normalizeTime(startTime));
    const endDate = new Date(normalizeTime(endTime));
    if (startDate >= endDate) {
      alert('结束时间必须晚于开始时间');
      return;
    }
    const diffMinutes = (endDate.getTime() - startDate.getTime()) / (1000 * 60);
    if (durationMinutes > diffMinutes) {
      alert('考试时长不得大于（结束时间-开始时间）');
      return;
    }

    const examData = {
      paperId: Number(paperId),
      examName,
      startTime: normalizeTime(startTime),
      endTime: normalizeTime(endTime),
      durationMinutes: Number(durationMinutes),
      proctorId: 1,
      status: 'Pending' as const,
    };

    try {
      let saved: Exam | undefined;
      if (editingExamId) {
        saved = await api.updateExam({
          ...examData,
          examId: editingExamId,
        });
      } else {
        saved = await api.createExam(examData);
      }

      if (saved?.examId && parsedParticipants.length) {
        await api.setExamParticipants(saved.examId, parsedParticipants);
      }

      setIsModalOpen(false);
      resetForm();
      fetchExams();
    } catch (error) {
      console.error(error);
      alert('保存考试失败');
    }
  };

  const fetchDetail = async (examId: number, silent = false) => {
    if (!silent) setDetailLoading(true);
    try {
      const [full, participants] = await Promise.all([
        api.getExamDetails(examId),
        api.getExamParticipants(examId),
      ]);
      setDetailExam(full || detailExam);
      setDetailParticipants(participants || []);
    } catch {
      /* keep previous detail on error */
    } finally {
      if (!silent) setDetailLoading(false);
    }
  };

  const handleViewExam = async (exam: Exam) => {
    setIsDetailOpen(true);
    setDetailLoading(true);
    setDetailParticipants([]);
    setDetailExam(exam);
    await fetchDetail(exam.examId);
  };

  const handleSearchParticipants = async () => {
    try {
      const list = await api.searchUsers(participantKeyword);
      setParticipantOptions(list);
    } catch (err) {
      console.error(err);
      alert('查询考生失败');
    }
  };

  const toggleParticipant = (id: number) => {
    setSelectedParticipants((prev) => {
      if (prev.includes(id)) {
        return prev.filter((v) => v !== id);
      }
      return [...prev, id];
    });
  };

  const getExamStatus = (exam: Exam) => {
    const now = Date.now();
    const start = new Date(exam.startTime).getTime();
    const end = new Date(exam.endTime).getTime();

    if (Number.isNaN(start) || Number.isNaN(end)) {
      return { label: '无数据', badgeClass: 'bg-gray-100 text-gray-800' };
    }

    if (now < start) {
      return { label: '未开始', badgeClass: 'bg-yellow-100 text-yellow-800' };
    }

    if (now > end) {
      return { label: '已结束', badgeClass: 'bg-gray-100 text-gray-800' };
    }

    return { label: '考试中', badgeClass: 'bg-green-100 text-green-800' };
  };

  const getParticipantStatus = (p: ExamParticipant) => {
    const raw = (p.joinStatus || p.status || '').toLowerCase();
    if (raw === 'submitted') return { label: '已提交', badgeClass: 'bg-green-50 text-green-700' };
    if (raw === 'invited') return { label: '未开始', badgeClass: 'bg-yellow-50 text-yellow-700' };
    if (raw === 'inprogress' || raw === 'in_progress' || raw === 'in-progress') {
      return { label: '作答中', badgeClass: 'bg-blue-50 text-blue-700' };
    }
    return p.submitted
      ? { label: '已提交', badgeClass: 'bg-green-50 text-green-700' }
      : { label: raw || '未提交', badgeClass: 'bg-gray-50 text-gray-600' };
  };

  useEffect(() => {
    if (!isDetailOpen || !detailExam) return;
    const timer = setInterval(() => {
      fetchDetail(detailExam.examId, true);
    }, 10000);
    return () => clearInterval(timer);
  }, [isDetailOpen, detailExam?.examId]);

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
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  暂无考试安排
                </td>
              </tr>
            ) : (
              exams.map((exam) => {
                const status = getExamStatus(exam);
                const isEnded = status.label === '已结束';

                return (
                  <tr key={exam.examId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{exam.examName}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="text-gray-400" />
                        {exam.paper?.paperName || `试卷 #${exam.paperId}`}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="flex flex-col gap-1">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} /> {new Date(exam.startTime).toLocaleString('zh-CN')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} /> {exam.durationMinutes} 分钟
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.badgeClass}`}
                      >
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex gap-3 text-gray-400">
                      <button onClick={() => handleViewExam(exam)} className="hover:text-blue-600" title="查看详情">
                        <Eye size={18} />
                      </button>
                      {!isEnded && (
                        <button onClick={() => handleEdit(exam)} className="hover:text-blue-600" title="编辑">
                          <Edit2 size={18} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {isDetailOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">考试详情</h2>
              <button
                onClick={() => {
                  setIsDetailOpen(false);
                  setDetailParticipants([]);
                  setDetailExam(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {detailLoading && <div className="text-gray-500">加载中...</div>}

              {!detailLoading && detailExam && (
                <>
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">考试名称</div>
                      <div className="font-medium text-gray-900">{detailExam.examName}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">关联试卷</div>
                      <div className="font-medium text-gray-900">
                        {detailExam.paper?.paperName || `试卷 #${detailExam.paperId}`}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">开始时间</div>
                      <div>{new Date(detailExam.startTime).toLocaleString('zh-CN')}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">结束时间</div>
                      <div>{new Date(detailExam.endTime).toLocaleString('zh-CN')}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">考试时长</div>
                      <div>{detailExam.durationMinutes} 分钟</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">状态</div>
                      {(() => {
                        const status = getExamStatus(detailExam);
                        return (
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.badgeClass}`}
                          >
                            {status.label}
                          </span>
                        );
                      })()}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-800">考生名单</h3>
                      <span className="text-xs text-gray-500">
                        共 {detailParticipants.length} 人
                      </span>
                    </div>
                    {detailParticipants.length === 0 ? (
                      <div className="text-sm text-gray-500 bg-gray-50 border border-dashed border-gray-200 rounded-lg p-4">
                        暂无考生数据
                      </div>
                    ) : (
                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-gray-500 font-medium">学生ID</th>
                              <th className="px-4 py-2 text-left text-gray-500 font-medium">姓名</th>
                              <th className="px-4 py-2 text-left text-gray-500 font-medium">用户名</th>
                              <th className="px-4 py-2 text-left text-gray-500 font-medium">完成状态</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {detailParticipants.map((p) => (
                              <tr key={p.studentId}>
                                <td className="px-4 py-2 text-gray-800">{p.studentId}</td>
                                <td className="px-4 py-2 text-gray-700">{p.realName || '-'}</td>
                                <td className="px-4 py-2 text-gray-700">{p.username || '-'}</td>
                                <td className="px-4 py-2">
                                  {(() => {
                                    const s = getParticipantStatus(p);
                                    return (
                                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${s.badgeClass}`}>
                                        {s.label}
                                      </span>
                                    );
                                  })()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

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
                  onChange={(e) => setExamName(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="例如：2024 春季期中考试"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">选择试卷</label>
                <select
                  required
                  value={paperId}
                  onChange={(e) => setPaperId(Number(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">请选择试卷...</option>
                  {papers.map((p) => (
                    <option key={p.paperId} value={p.paperId}>
                      {p.paperName} (总分: {p.totalScore})
                    </option>
                  ))}
                </select>
                {papers.length === 0 && (
                  <p className="text-xs text-red-500 mt-1">暂无可用试卷，请先去创建试卷。</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">开始时间</label>
                  <input
                    type="datetime-local"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">结束时间</label>
                  <input
                    type="datetime-local"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
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
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">选择考生（按姓名/用户名搜索，多选）</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={participantKeyword}
                    onChange={(e) => setParticipantKeyword(e.target.value)}
                    className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="输入姓名或用户名..."
                  />
                  <button
                    type="button"
                    onClick={handleSearchParticipants}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    搜索
                  </button>
                </div>
                <div className="mt-2 space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-2 bg-gray-50">
                  {participantOptions.length === 0 && <div className="text-xs text-gray-500">请输入关键词后搜索</div>}
                  {participantOptions.map((u) => (
                    <label key={u.id} className="flex items-center gap-2 text-sm text-gray-700">
                      <input type="checkbox" checked={selectedParticipants.includes(u.id!)} onChange={() => toggleParticipant(u.id!)} />
                      <span className="font-medium">{u.realName || '-'}</span>
                      <span className="text-gray-500">@{u.username}</span>
                    </label>
                  ))}
                </div>
                {selectedParticipants.length > 0 && (
                  <div className="mt-2 text-xs text-gray-600">已选择：{selectedParticipants.length} 人</div>
                )}
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  取消
                </button>
                <button type="submit" className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 shadow-sm">
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
