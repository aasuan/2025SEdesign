import React, { useEffect, useState } from 'react';
import { UserProfile, Exam } from '../types';
import { api } from '../services/api';
import { Calendar, Clock, AlertCircle, PlayCircle, BarChart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DashboardProps {
  user: UserProfile;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [activeExams, setActiveExams] = useState<Exam[]>([]);
  const [upcomingExams, setUpcomingExams] = useState<Exam[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      if (user.userRole === 'Student') {
        const exams = await api.getPortalExams();
        const now = Date.now();
        const upcoming = exams.filter((e) => {
          const joinStatus = (e as any).joinStatus || (e as any).participant?.joinStatus;
          return new Date(e.startTime).getTime() > now && joinStatus !== 'Submitted';
        });
        const active = exams.filter((e) => {
          const start = new Date(e.startTime).getTime();
          const end = new Date(e.endTime).getTime();
          const joinStatus = (e as any).joinStatus || (e as any).participant?.joinStatus;
          return start <= now && now <= end && joinStatus !== 'Submitted';
        });
        setUpcomingExams(upcoming);
        setActiveExams(active);
      } else {
        const exams = await api.getExams('Active');
        setActiveExams(exams);
      }
    };
    fetch();
  }, [user]);

  const WelcomeCard = () => (
    <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-8 text-white mb-8 shadow-lg">
      <h2 className="text-3xl font-bold mb-2">欢迎回来，{user.realName}</h2>
      <p className="text-blue-100">
        {user.userRole === 'Student'
          ? '准备好展示你的知识了吗？查看下方即将开始的考试。'
          : '高效管理考试任务，实时追踪学生进度。'}
      </p>
    </div>
  );

  const StatCard = ({ icon: Icon, label, value, color }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
      <div className={`p-4 rounded-lg ${color} bg-opacity-10 text-opacity-100`}>
        <Icon className={color.replace('bg-', 'text-')} size={24} />
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );

  return (
    <div>
      <WelcomeCard />

      {user.userRole === 'Teacher' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard icon={Calendar} label="进行中的考试" value={activeExams.length} color="bg-blue-600" />
          <StatCard icon={AlertCircle} label="待阅卷试卷" value="12" color="bg-orange-500" />
          <StatCard icon={BarChart} label="课程平均分" value="84%" color="bg-green-600" />
        </div>
      )}

      {user.userRole === 'Student' ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900">考试列表</h3>
          </div>

          <div className="divide-y divide-gray-50">
            {[...activeExams.map((e) => ({ exam: e, tag: '正在进行' })), ...upcomingExams.map((e) => ({ exam: e, tag: '未开始' }))].length === 0 ? (
              <div className="p-8 text-center text-gray-500">暂无考试安排</div>
            ) : (
              [...activeExams.map((e) => ({ exam: e, tag: '正在进行' })), ...upcomingExams.map((e) => ({ exam: e, tag: '未开始' }))].map(({ exam, tag }) => (
                <div
                  key={exam.examId}
                  className="p-6 hover:bg-gray-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                      <FileIcon />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-1">{exam.examName}</h4>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar size={14} /> {new Date(exam.startTime).toLocaleString('zh-CN')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={14} /> {exam.durationMinutes} 分钟
                        </span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            tag === '未开始' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' : 'bg-green-50 text-green-700 border border-green-200'
                          }`}
                        >
                          {tag}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate(`/take-exam/${exam.examId}`)}
                    className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-full font-medium hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200"
                    disabled={tag === '未开始'}
                  >
                    {tag === '未开始' ? '未开始' : '开始考试'} {tag !== '未开始' && <PlayCircle size={18} />}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900">进行中的场次</h3>
            <button onClick={() => navigate('/exams')} className="text-sm text-primary font-medium hover:underline">
              查看全部
            </button>
          </div>

          <div className="divide-y divide-gray-50">
            {activeExams.length === 0 ? (
              <div className="p-8 text-center text-gray-500">暂无进行中的考试</div>
            ) : (
              activeExams.map((exam) => (
                <div
                  key={exam.examId}
                  className="p-6 hover:bg-gray-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                      <FileIcon />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-1">{exam.examName}</h4>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar size={14} /> {new Date(exam.startTime).toLocaleString('zh-CN')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={14} /> {exam.durationMinutes} 分钟
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate(`/analysis/${exam.examId}`)}
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50"
                  >
                    查看分析
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const FileIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

export default Dashboard;
