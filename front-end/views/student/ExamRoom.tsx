import React, { useState, useEffect, useRef } from 'react';
import { Exam, Question, Submission, User, QuestionType } from '../../types';
import { detectProctoringAnomalies } from '../../services/geminiService';
import { AlertTriangle, CheckCircle, Clock, Eye, Send, Video } from 'lucide-react';
import { submitExamAnswers } from '../../services/mockBackend';

interface ExamRoomProps {
  exam: Exam;
  user: User;
  onComplete: () => void;
}

const ExamRoom: React.FC<ExamRoomProps> = ({ exam, user, onComplete }) => {
  const [currentQIndex, setCurrentQIndex] = useState(0);
  // Using generic string for simplicity, for real app might need complex structure
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(exam.durationMinutes * 60);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Proctoring States
  const videoRef = useRef<HTMLVideoElement>(null);
  const [proctorStatus, setProctorStatus] = useState<'SAFE' | 'WARN'>('SAFE');
  const [warnings, setWarnings] = useState(0);

  // Setup Camera
  useEffect(() => {
    let stream: MediaStream | null = null;
    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (e) {
        alert("需要相机权限才能进行监考！");
      }
    };
    startCamera();

    return () => {
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, []);

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Proctoring Loop (AI Check every 10 seconds)
  useEffect(() => {
    const checkInterval = setInterval(async () => {
      if (!videoRef.current) return;
      
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const base64 = canvas.toDataURL('image/jpeg', 0.5);
        
        // Call AI Service (Mocked or Real)
        const isSuspicious = await detectProctoringAnomalies(base64);
        
        if (isSuspicious) {
           setProctorStatus('WARN');
           setWarnings(w => w + 1);
        } else {
           setProctorStatus('SAFE');
        }
      }
    }, 10000); 

    return () => clearInterval(checkInterval);
  }, []);

  const handleAnswerChange = (qId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [qId]: value }));
  };

  const calculateScore = (): number => {
    let correct = 0;
    exam.questions.forEach(q => {
        // Simple exact match logic - in production this needs robust grading
        if (answers[q.id] === q.correctAnswer) correct++;
    });
    return Math.round((correct / exam.questions.length) * 100);
  }

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const score = calculateScore();
    const submission: Submission = {
        id: `sub-${Date.now()}`,
        examId: exam.id,
        studentId: user.id,
        answers,
        score,
        submittedAt: new Date().toISOString()
    };
    
    await submitExamAnswers(submission);
    onComplete();
  };

  const currentQ = exam.questions[currentQIndex];

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

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

  return (
    <div className="fixed inset-0 bg-slate-50 z-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm">
        <div>
           <h1 className="text-xl font-bold text-slate-800">{exam.title}</h1>
           <p className="text-sm text-slate-500">考生: {user.name}</p>
        </div>
        <div className={`flex items-center gap-2 text-2xl font-mono font-bold ${timeLeft < 300 ? 'text-red-600 animate-pulse' : 'text-slate-700'}`}>
            <Clock size={24} />
            {formatTime(timeLeft)}
        </div>
        <button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
            {isSubmitting ? '正在提交...' : '提交试卷'} <Send size={16}/>
        </button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Question Area */}
        <main className="flex-1 overflow-y-auto p-8 flex justify-center">
            <div className="w-full max-w-3xl">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 min-h-[400px]">
                    <div className="mb-6 flex justify-between items-start">
                        <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm font-semibold">
                            第 {currentQIndex + 1} 题 / 共 {exam.questions.length} 题
                        </span>
                        <span className="text-slate-400 text-sm">
                            {getTypeLabel(currentQ.type)}
                        </span>
                    </div>
                    
                    <h2 className="text-2xl text-slate-800 font-medium mb-8 leading-relaxed whitespace-pre-wrap">
                        {currentQ.content}
                    </h2>

                    <div className="space-y-3">
                        {/* 渲染选择题选项 */}
                        {(currentQ.type === QuestionType.SINGLE_CHOICE || 
                          currentQ.type === QuestionType.MULTIPLE_CHOICE || 
                          currentQ.type === QuestionType.TRUE_FALSE) && (
                            <div className="space-y-3">
                                {currentQ.options?.map((opt, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleAnswerChange(currentQ.id, opt)}
                                        className={`w-full text-left p-4 rounded-xl border transition-all ${
                                            answers[currentQ.id] === opt 
                                            ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600 text-indigo-900 font-medium' 
                                            : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50 text-slate-700'
                                        }`}
                                    >
                                        <span className="inline-block w-6 font-semibold opacity-50">{String.fromCharCode(65+idx)}.</span>
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* 渲染填空题输入框 */}
                        {currentQ.type === QuestionType.FILL_IN_THE_BLANK && (
                             <div className="mt-8">
                                <label className="block text-sm font-medium text-slate-500 mb-2">请输入您的答案：</label>
                                <input 
                                    type="text"
                                    className="w-full p-4 border border-slate-300 rounded-xl focus:ring-2 ring-indigo-500 focus:border-transparent outline-none text-lg"
                                    placeholder="在此处键入答案..."
                                    value={answers[currentQ.id] || ''}
                                    onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
                                />
                             </div>
                        )}

                        {/* 渲染简答题输入框 */}
                        {currentQ.type === QuestionType.SHORT_ANSWER && (
                             <div className="mt-8">
                                <label className="block text-sm font-medium text-slate-500 mb-2">请输入您的回答：</label>
                                <textarea 
                                    className="w-full p-4 border border-slate-300 rounded-xl focus:ring-2 ring-indigo-500 focus:border-transparent outline-none min-h-[150px] text-lg"
                                    placeholder="在此处详细阐述..."
                                    value={answers[currentQ.id] || ''}
                                    onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
                                />
                             </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-between mt-8">
                    <button 
                        onClick={() => setCurrentQIndex(i => Math.max(0, i-1))}
                        disabled={currentQIndex === 0}
                        className="px-6 py-2 text-slate-600 font-medium disabled:opacity-30 hover:bg-slate-100 rounded-lg"
                    >
                        上一题
                    </button>
                    <button 
                        onClick={() => setCurrentQIndex(i => Math.min(exam.questions.length-1, i+1))}
                        disabled={currentQIndex === exam.questions.length-1}
                        className="px-6 py-2 bg-slate-800 text-white font-medium rounded-lg hover:bg-slate-900 disabled:opacity-50"
                    >
                        下一题
                    </button>
                </div>
            </div>
        </main>

        {/* Sidebar: Proctoring & Navigation */}
        <aside className="w-80 bg-white border-l border-slate-200 p-6 flex flex-col">
            <div className="mb-8">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">AI 智能监考</h3>
                <div className="relative rounded-xl overflow-hidden bg-black aspect-video mb-2 ring-2 ring-slate-100">
                    <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover opacity-80" />
                    <div className="absolute top-2 right-2 px-2 py-1 bg-black/50 backdrop-blur rounded text-xs text-white flex items-center gap-1">
                        <Video size={12}/> 实时
                    </div>
                    {proctorStatus === 'WARN' && (
                         <div className="absolute inset-0 flex items-center justify-center bg-red-500/20 backdrop-blur-sm">
                             <AlertTriangle className="text-red-600" size={32} />
                         </div>
                    )}
                </div>
                <div className={`text-xs px-3 py-2 rounded-lg flex items-center gap-2 ${
                    proctorStatus === 'SAFE' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                    {proctorStatus === 'SAFE' ? <CheckCircle size={14}/> : <Eye size={14}/>}
                    状态: {proctorStatus === 'SAFE' ? '环境验证通过' : '检测到异常'}
                </div>
                {warnings > 0 && (
                    <p className="text-xs text-red-500 mt-2 font-medium">警告次数: {warnings}</p>
                )}
            </div>

            <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">题目导航</h3>
                <div className="grid grid-cols-5 gap-2">
                    {exam.questions.map((q, idx) => (
                        <button
                            key={q.id}
                            onClick={() => setCurrentQIndex(idx)}
                            className={`h-10 rounded-lg text-sm font-medium transition-colors ${
                                idx === currentQIndex ? 'bg-indigo-600 text-white' :
                                answers[q.id] ? 'bg-indigo-50 text-indigo-600 border border-indigo-200' :
                                'bg-slate-100 text-slate-500 hover:bg-slate-200'
                            }`}
                        >
                            {idx + 1}
                        </button>
                    ))}
                </div>
            </div>
        </aside>
      </div>
    </div>
  );
};

export default ExamRoom;