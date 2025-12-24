import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Exam, ScoreRecord } from '../types';
import { Calendar, Clock, ChevronRight, CheckCircle, AlertCircle, Play, History, Trophy } from 'lucide-react';

const StudentExamList: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'todo' | 'history'>('todo');
  const [allExams, setAllExams] = useState<Exam[]>([]);
  const [myScores, setMyScores] = useState<ScoreRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all exams to filter client-side based on history
        const exams = await api.getExams(); 
        const scores = await api.getMyScores();
        setAllExams(exams);
        setMyScores(scores);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Helper to determine the specific status of an exam for this student
  const getExamStatus = (exam: Exam) => {
    const scoreRecord = myScores.find(s => s.examId === exam.examId);
    
    if (scoreRecord) {
      return { type: 'completed', label: '已完成', score: scoreRecord.totalScore, record: scoreRecord };
    }
    
    const now = new Date();
    const start = new Date(exam.startTime);
    const end = new Date(exam.endTime);

    if (exam.status === 'Canceled') return { type: 'canceled', label: '已取消' };
    if (now < start) return { type: 'upcoming', label: '未开始' };
    if (now > end || exam.status === 'Finished') return { type: 'missed', label: '已结束' };
    
    return { type: 'active', label: '进行中' };
  };

  // Filter exams based on tab
  const filteredExams = allExams.filter(exam => {
    const status = getExamStatus(exam);
    if (activeTab === 'todo') {
      // Show Active or Upcoming exams that haven't been taken
      return (status.type === 'active' || status.type === 'upcoming') && !status.record;
    } else {
      // Show Completed, Missed, or Canceled exams
      return status.record || status.type === 'missed' || status.type === 'canceled' || status.type === 'completed';
    }
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  if (loading) return <div className="p-8 text-center text-gray-500">加载中...</div>;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <History className="text-primary" /> 我的考试
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('todo')}
          className={`pb-3 px-6 text-sm font-medium transition-colors relative ${
            activeTab === 'todo' 
              ? 'text-primary border-b-2 border-primary' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          待参加考试
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 px-6 text-sm font-medium transition-colors relative ${
            activeTab === 'history' 
              ? 'text-primary border-b-2 border-primary' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          考试记录
        </button>
      </div>

      {/* List */}
      <div className="space-y-4">
        {filteredExams.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-gray-100 shadow-sm">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
              {activeTab === 'todo' ? <CheckCircle size={32} /> : <History size={32} />}
            </div>
            <h3 className="text-lg font-medium text-gray-900">
              {activeTab === 'todo' ? '暂无待参加的考试' : '暂无考试记录'}
            </h3>
            <p className="text-gray-500 mt-1">
              {activeTab === 'todo' ? '好消息！你当前没有需要完成的任务。' : '你还没有参加过任何考试。'}
            </p>
          </div>
        ) : (
          filteredExams.map(exam => {
            const status = getExamStatus(exam);
            return (
              <div 
                key={exam.examId} 
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-gray-900">{exam.examName}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      status.type === 'active' ? 'bg-green-50 text-green-700 border-green-200' :
                      status.type === 'upcoming' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      status.type === 'completed' ? 'bg-gray-100 text-gray-700 border-gray-200' :
                      'bg-red-50 text-red-700 border-red-200'
                    }`}>
                      {status.label}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={16} className="text-gray-400" />
                      <span>{formatDate(exam.startTime)} - {formatDate(exam.endTime)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock size={16} className="text-gray-400" />
                      <span>{exam.durationMinutes} 分钟</span>
                    </div>
                  </div>
                </div>

                {/* Right Side Action/Info */}
                <div className="flex items-center gap-4 w-full md:w-auto border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
                  {status.type === 'active' && (
                    <button 
                      onClick={() => navigate(`/take-exam/${exam.examId}`)}
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-blue-700 shadow-sm shadow-blue-200 transition-all active:scale-95"
                    >
                      开始考试 <Play size={16} fill="currentColor" />
                    </button>
                  )}
                  
                  {status.type === 'upcoming' && (
                    <div className="flex flex-col items-center px-4">
                      <Clock className="text-blue-400 mb-1" size={24} />
                      <span className="text-xs text-blue-600 font-medium">即将开始</span>
                    </div>
                  )}

                  {status.type === 'completed' && (
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <span className="block text-xs text-gray-500 uppercase">得分</span>
                        <span className="text-xl font-bold text-primary flex items-center gap-1">
                          {status.score} <span className="text-sm font-normal text-gray-400">分</span>
                        </span>
                      </div>
                      <button 
                        className="p-2 text-gray-400 hover:text-primary transition-colors rounded-full hover:bg-blue-50"
                        title="查看详情"
                        onClick={() => navigate(`/exam-result/${exam.examId}`)}
                      >
                        <ChevronRight size={20} />
                      </button>
                    </div>
                  )}

                  {status.type === 'missed' && (
                    <div className="flex items-center gap-2 text-gray-400 px-2">
                      <AlertCircle size={20} />
                      <span className="text-sm">缺考</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default StudentExamList;