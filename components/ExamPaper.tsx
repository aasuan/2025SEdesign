import React, { useEffect, useState, useRef } from 'react';

import { useParams, useNavigate } from 'react-router-dom';

import { api } from '../services/api';

import { Exam, PaperQuestionItem } from '../types';

import { Clock, AlertTriangle, CheckCircle, Video, VideoOff, Cloud, CloudOff, Save } from 'lucide-react';



const ExamPaper: React.FC = () => {

  const { id } = useParams<{ id: string }>();

  const navigate = useNavigate();

  const [exam, setExam] = useState<Exam | null>(null);

  const [answers, setAnswers] = useState<Record<number, string>>({});

  const [currentQIndex, setCurrentQIndex] = useState(0);

  const [timeLeft, setTimeLeft] = useState(0);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [cameraActive, setCameraActive] = useState(false);

  const [userId, setUserId] = useState<number | null>(null);

  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);



  // 1. Fetch User ID for unique storage key

  useEffect(() => {

    api.getCurrentUser().then(u => {

      if (u) setUserId(u.id);

    });

  }, []);



  // 2. Fetch Exam Details

  useEffect(() => {

    if (id) {

      api.getExamDetails(Number(id)).then(e => {

        if (e) {

          setExam(e);

          setTimeLeft(e.durationMinutes * 60);

        }

      });

    }

  }, [id]);



  // 3. Load saved progress from LocalStorage (Breakpoint Resumption)

  useEffect(() => {

    if (userId && id) {

      const key = `exam_progress_${userId}_${id}`;

      const savedData = localStorage.getItem(key);

      if (savedData) {

        try {

          const parsedAnswers = JSON.parse(savedData);

          if (Object.keys(parsedAnswers).length > 0) {

            setAnswers(parsedAnswers);

            console.log('Restored progress from local storage');

          }

        } catch (e) {

          console.error('Failed to parse saved progress', e);

        }

      }

    }

  }, [userId, id]);



  // 4. Auto-save progress to LocalStorage on answer change

  useEffect(() => {

    if (userId && id && Object.keys(answers).length > 0) {

      const key = `exam_progress_${userId}_${id}`;

      localStorage.setItem(key, JSON.stringify(answers));

      setLastSaved(new Date());

    }

  }, [answers, userId, id]);



  // Timer logic

  useEffect(() => {

    const timer = setInterval(() => {

      setTimeLeft(prev => {

        if (prev <= 1) {

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



  // Initialize Camera

  useEffect(() => {

    let stream: MediaStream | null = null;



    const startCamera = async () => {

      try {

        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {

          stream = await navigator.mediaDevices.getUserMedia({ 

            video: { width: 320, height: 240, facingMode: "user" }, 

            audio: false 

          });

          

          if (videoRef.current) {

            videoRef.current.srcObject = stream;

            // Play is needed for some browsers to start streaming

            await videoRef.current.play();

          }

          setCameraActive(true);

        }

      } catch (err) {

        console.error("Camera access error:", err);

        setCameraActive(false);

      }

    };



    startCamera();



    return () => {

      if (stream) {

        stream.getTracks().forEach(track => track.stop());

      }

    };

  }, []);



  const handleAnswerChange = (qId: number, val: string) => {

    setAnswers(prev => ({ ...prev, [qId]: val }));

  };



    const handleSubmit = async () => {
    if (!exam || isSubmitting) return;

    // Validate if network is online (basic check)
    if (!navigator.onLine) {
      alert('网络连接已断开！您的答案已自动保存在本地。请恢复网络后再次点击提交。');
      return;
    }

    setIsSubmitting(true);
    const formattedAnswers = Object.entries(answers).map(([qId, response]) => ({
      questionId: Number(qId),
      response: response as string
    }));

    try {
      await api.submitExamAnswers(exam.examId, formattedAnswers);

      // Clear local storage ONLY on success
      if (userId && id) {
        localStorage.removeItem(`exam_progress_${userId}_${id}`);
      }

      alert('试卷提交成功');
      navigate('/results');
    } catch (error) {
      alert('提交失败，请检查网络连接。您的答案已安全保存在本地，请稍后重试。');
      setIsSubmitting(false);
    }
  };




  if (!exam || !exam.paper) return <div className="p-8 text-center">正在加载考场环境...</div>;

  const currentQ = exam.paper.questions[currentQIndex];
  const qData = currentQ.question;
  const optionList = Object.entries(qData?.options || {});


  const formatTime = (seconds: number) => {

    const m = Math.floor(seconds / 60);

    const s = seconds % 60;

    return `${m}:${s < 10 ? '0' : ''}${s}`;

  };



  const getQuestionTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      single: '单选题',
      multiple: '多选题',
      judge: '判断题',
      short: '简答题',
    };
    return map[type] || type;
  };


  return (

    <div className="flex flex-col h-screen bg-gray-100">

      {/* Top Bar */}

      <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center z-20">

        <div>

          <h1 className="font-bold text-xl text-gray-800 flex items-center gap-2">

            {exam.examName}

            {lastSaved && (

              <span className="text-xs font-normal text-green-600 bg-green-50 px-2 py-1 rounded-full flex items-center gap-1 border border-green-100">

                <Save size={12} /> 已自动保存
              </span>

            )}

          </h1>

          <p className="text-sm text-gray-500">学号: 2024001</p>

        </div>

        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xl font-bold ${timeLeft < 300 ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-blue-50 text-blue-600'}`}>

          <Clock size={24} />

          {formatTime(timeLeft)}

        </div>

      </header>



      <div className="flex flex-1 overflow-hidden">

        {/* Left: Question Navigation & Proctoring */}

        <aside className="w-72 bg-white border-r border-gray-200 flex flex-col">

          <div className="p-4 border-b border-gray-100">

            <div className="aspect-video bg-black rounded-lg mb-3 relative overflow-hidden flex items-center justify-center">

              <video 

                ref={videoRef} 

                className={`w-full h-full object-cover ${!cameraActive ? 'hidden' : ''}`} 

                muted 

                playsInline 

              />

              {!cameraActive && (

                <div className="absolute inset-0 flex flex-col items-center justify-center text-red-500 bg-gray-900">

                  <VideoOff size={32} className="mb-2" />

                  <span className="text-xs">摄像头未连接</span>

                </div>

              )}

              {cameraActive && (

                <div className="absolute top-2 right-2 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>

              )}

            </div>

            <p className="text-xs text-center text-gray-400">

              {cameraActive ? '在线监考中，画面正常' : '请允许浏览器访问摄像头'}

            </p>

          </div>



          <div className="flex-1 overflow-y-auto p-4">

            <h3 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">题目列表</h3>

            <div className="grid grid-cols-4 gap-2">

              {exam.paper.questions.map((q, idx) => {

                const isAnswered = !!answers[q.questionId];

                const isCurrent = idx === currentQIndex;

                return (

                  <button

                    key={q.questionId}

                    onClick={() => setCurrentQIndex(idx)}

                    className={`h-10 rounded-md text-sm font-medium transition-all ${

                      isCurrent 

                        ? 'bg-blue-600 text-white shadow-md' 

                        : isAnswered 

                          ? 'bg-blue-50 text-blue-600 border border-blue-200' 

                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100'

                    }`}

                  >

                    {idx + 1}

                  </button>

                );

              })}

            </div>

          </div>

          

          <div className="p-4 border-t border-gray-100">

            <button

              onClick={handleSubmit}

              disabled={isSubmitting}

              className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"

            >

              <CheckCircle size={18} /> {isSubmitting ? '提交中...' : '提交试卷'}

            </button>

          </div>

        </aside>



        {/* Center: Question Area */}

        <main className="flex-1 overflow-y-auto p-8 md:p-12">

          {qData && (

            <div className="max-w-3xl mx-auto">

              <div className="mb-6">

                <span className="inline-block px-3 py-1 bg-gray-200 rounded-full text-xs font-semibold text-gray-700 mb-3">
                  {getQuestionTypeLabel(qData.questionType)} • {currentQ.questionScore} 分
                </span>

                <h2 className="text-2xl font-medium text-gray-900 leading-relaxed">

                  {currentQIndex + 1}. {qData.content}

                </h2>

              </div>



              <div className="space-y-4">

                {/* Render input based on type */}

                {(qData.questionType === 'single' || qData.questionType === 'judge') && optionList.map(([key, text]) => (
                  <label 
                    key={key} 
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      answers[qData.questionId] === key 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`q-${qData.questionId}`}
                      value={key}
                      checked={answers[qData.questionId] === key}
                      onChange={(e) => handleAnswerChange(qData.questionId, e.target.value)}
                      className="w-5 h-5 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-lg text-gray-700">{key}. {text}</span>
                  </label>
                ))}

                {qData.questionType === 'multiple' && optionList.map(([key, text]) => {
                  const current = answers[qData.questionId] ? answers[qData.questionId].split(',').filter(Boolean) : [];
                  const selected = new Set(current);
                  const toggle = () => {
                    const next = new Set(selected);
                    if (next.has(key)) next.delete(key); else next.add(key);
                    const joined = Array.from(next).sort().join(',');
                    handleAnswerChange(qData.questionId, joined);
                  };
                  return (
                    <label 
                      key={key} 
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${selected.has(key) ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50'}`}
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(key)}
                        onChange={toggle}
                        className="w-5 h-5 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-lg text-gray-700">{key}. {text}</span>
                    </label>
                  );
                })}

                {qData.questionType === 'short' && (
                  <textarea
                    value={answers[qData.questionId] || ''}
                    onChange={(e) => handleAnswerChange(qData.questionId, e.target.value)}
                    className="w-full h-48 p-4 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-800 font-mono"
                    placeholder="在此输入你的答案..."
                  />
                )}
              </div>



              <div className="mt-12 flex justify-between">

                <button 

                  onClick={() => setCurrentQIndex(Math.max(0, currentQIndex - 1))}

                  disabled={currentQIndex === 0}

                  className="px-6 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"

                >

                  上一题
                </button>

                <button 

                  onClick={() => setCurrentQIndex(Math.min(exam.paper!.questions.length - 1, currentQIndex + 1))}

                  disabled={currentQIndex === exam.paper!.questions.length - 1}

                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"

                >

                  下一题
                </button>

              </div>

            </div>

          )}

        </main>

      </div>

    </div>

  );

};



export default ExamPaper;