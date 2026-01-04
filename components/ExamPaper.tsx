import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Exam, PaperQuestionItem, Question } from '../types';
import { Clock, CheckCircle, VideoOff, Save } from 'lucide-react';

const ExamPaper: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [exam, setExam] = useState<Exam | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showTimeWarning, setShowTimeWarning] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraReadyRef = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);
  const commandTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoVerifyTimerRef = useRef<NodeJS.Timeout | null>(null);

  const markCameraReady = () => {
    if (!cameraReadyRef.current) {
      cameraReadyRef.current = true;
      setCameraReady(true);
    }
  };

  useEffect(() => {
    cameraReadyRef.current = cameraReady;
  }, [cameraReady]);

  useEffect(() => {
    api.getCurrentUser().then((u) => {
      if (u) setUserId(u.id);
    });
  }, []);

  // enter exam and load questions/answers
  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        await waitForCamera();
        const snapshot = await captureSnapshot();
        await api.verifyFace(Number(id), snapshot);

        const { exam: entered } = await api.enterPortalExam(Number(id));
        const qList = await api.getPortalQuestions(Number(id));
        const mapped = mapPortalQuestions(qList);
        const initialAnswers: Record<number, string> = {};
        mapped.forEach((item) => {
          if ((item as any).studentResponse) {
            initialAnswers[item.questionId] = (item as any).studentResponse;
          }
        });
        setAnswers(initialAnswers);
        setExam({
          ...entered,
          paper: {
            paperId: entered.paperId,
            paperName: entered.examName,
            creatorId: 0,
            totalScore: 0,
            draft: false,
            questions: mapped,
            items: mapped,
          },
        });
        const endFromServer = entered.endTime ? Math.floor((new Date(entered.endTime).getTime() - Date.now()) / 1000) : null;
        const durationLeft = entered.durationMinutes * 60;
        const effectiveLeft = endFromServer != null ? Math.max(0, Math.min(durationLeft, endFromServer)) : durationLeft;
        setTimeLeft(effectiveLeft);
      } catch (err: any) {
        alert(err?.message || '无法进入考试');
        navigate('/my-exams');
      }
    };
    load();
  }, [id, navigate]);

  // load saved progress from LocalStorage
  useEffect(() => {
    if (userId && id) {
      const key = `exam_progress_${userId}_${id}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Object.keys(parsed).length > 0) {
            setAnswers(parsed);
          }
        } catch {
          /* ignore */
        }
      }
    }
  }, [userId, id]);

  // autosave to local
  useEffect(() => {
    if (userId && id) {
      const key = `exam_progress_${userId}_${id}`;
      localStorage.setItem(key, JSON.stringify(answers));
      if (Object.keys(answers).length > 0) {
        setLastSaved(new Date());
      }
    }
  }, [answers, userId, id]);

  // timer
  useEffect(() => {
    if (!exam) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exam?.examId]);

  useEffect(() => {
    if (timeLeft <= 300 && timeLeft > 0) {
      setShowTimeWarning(true);
    }
  }, [timeLeft]);

  // camera
  useEffect(() => {
    const startCamera = async () => {
      try {
        if (navigator.mediaDevices?.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 640, height: 480, facingMode: 'user' },
            audio: false,
          });
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            await videoRef.current.play();
            if (videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0) {
              markCameraReady();
            } else {
              videoRef.current.onloadedmetadata = () => markCameraReady();
              setTimeout(markCameraReady, 500);
            }
          } else {
            markCameraReady();
          }
          setCameraActive(true);
        }
      } catch (err) {
        console.error('Camera access error:', err);
        setCameraActive(false);
      }
    };
    startCamera();
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      if (commandTimerRef.current) clearInterval(commandTimerRef.current);
      if (autoVerifyTimerRef.current) clearInterval(autoVerifyTimerRef.current);
    };
  }, []);

  // bind stream if video ref comes later
  useEffect(() => {
    if (videoRef.current && streamRef.current && !videoRef.current.srcObject) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().then(markCameraReady).catch(() => {});
    }
  });

  const waitForCamera = async () => {
    if (cameraReadyRef.current) return;
    await new Promise<void>((resolve, reject) => {
      const start = Date.now();
      const timer = setInterval(() => {
        if (!cameraReadyRef.current && videoRef.current && videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0) {
          markCameraReady();
        }
        if (cameraReadyRef.current) {
          clearInterval(timer);
          resolve();
        } else if (Date.now() - start > 15000) {
          clearInterval(timer);
          reject(new Error('摄像头未就绪，请检查权限或重试'));
        }
      }, 150);
    });
  };

  const captureSnapshot = async (): Promise<string> => {
    const waitForFrame = async (timeoutMs: number) => {
      const start = Date.now();
      while (Date.now() - start < timeoutMs) {
        const v = videoRef.current;
        if (v && v.videoWidth > 0 && v.videoHeight > 0) return v;
        await new Promise((r) => setTimeout(r, 100));
      }
      return null;
    };

    const video = await waitForFrame(2000);
    if (!video) {
      throw new Error('摄像头不可用');
    }
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('无法获取画布');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.8);
  };

  const runVerification = async () => {
    if (!id) return;
    const snapshot = await captureSnapshot();
    await api.verifyFace(Number(id), snapshot);
  };

  // poll proctor commands
  useEffect(() => {
    if (!id || !userId) return;
    const poll = async () => {
      try {
        const cmds = await api.pollProctorCommands(Number(id), userId);
        for (const cmd of cmds || []) {
          await handleCommand(cmd);
          if (cmd.cmdId) {
            await api.markCommandDelivered(cmd.cmdId);
          }
        }
      } catch (e) {
        // ignore
      }
    };
    poll();
    commandTimerRef.current = setInterval(poll, 10000);
    return () => {
      if (commandTimerRef.current) clearInterval(commandTimerRef.current);
    };
  }, [id, userId]);

  // auto verify every 15 minutes
  useEffect(() => {
    if (!id) return;
    const tick = async () => {
      try {
        await runVerification();
      } catch (e) {
        // ignore auto errors
      }
    };
    autoVerifyTimerRef.current = setInterval(tick, 15 * 60 * 1000);
    return () => {
      if (autoVerifyTimerRef.current) clearInterval(autoVerifyTimerRef.current);
    };
  }, [id]);

  const handleCommand = async (cmd: any) => {
    if (!cmd || !cmd.cmdType) return;
    const type = String(cmd.cmdType);
    if (type === 'warn') {
      alert(cmd.payload || '疑似作弊，警告一次');
    } else if (type === 'force_submit') {
      alert(cmd.payload || '已被监考老师强制交卷');
      await handleSubmit(true);
    } else if (type === 'manual_verify') {
      try {
        await runVerification();
      } catch (e: any) {
        const msg = String(e?.message || '');
        if (msg.toLowerCase().includes('未检测到人脸') || msg.toLowerCase().includes('no face')) {
          alert('未检测到人脸，请调整位置后再次验证');
        } else {
          alert(msg || '人脸验证失败，请重试');
        }
      }
    }
  };

  const handleAnswerChange = async (qId: number, val: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: val }));
    try {
      await api.savePortalAnswer(Number(id), { questionId: qId, studentResponse: val });
      setLastSaved(new Date());
    } catch (err: any) {
      console.warn('保存作答失败', err?.message);
    }
  };

  const handleSubmit = async (auto = false) => {
    if (!exam || isSubmitting) return;
    if (!navigator.onLine) {
      alert('网络断开，答案已保存在本地，请联网后再提交。');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.submitPortalExam(exam.examId);
      if (userId && id) localStorage.removeItem(`exam_progress_${userId}_${id}`);
      if (!auto) {
        alert('提交成功');
      }
      navigate('/results');
    } catch (error: any) {
      alert(error?.message || '提交失败，请稍后重试');
      setIsSubmitting(false);
    }
  };

  const examReady = !!(exam && exam.paper && exam.paper.questions?.length);
  const currentQ = examReady ? exam!.paper!.questions![currentQIndex] : null;
  const qData = currentQ?.question;
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
      <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center z-20">
        <div>
          <h1 className="font-bold text-xl text-gray-800 flex items-center gap-2">
            {examReady ? exam!.examName : '正在加载考场环境...'}
            {lastSaved && (
              <span className="text-xs font-normal text-green-600 bg-green-50 px-2 py-1 rounded-full flex items-center gap-1 border border-green-100">
                <Save size={12} /> 已自动保存
              </span>
            )}
          </h1>
          <p className="text-sm text-gray-500">{examReady ? `考试编号: ${exam!.examId}` : '请稍候'}</p>
        </div>
        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xl font-bold ${
            timeLeft < 300 ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-blue-50 text-blue-600'
          }`}
        >
          <Clock size={24} />
          {formatTime(timeLeft)}
        </div>
      </header>

      {showTimeWarning && (
        <div className="bg-yellow-50 text-yellow-800 px-6 py-3 text-center text-sm font-medium border-b border-yellow-200">
          考试时间仅剩5分钟，请尽快完成并提交。
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-72 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-100">
            <div className="aspect-video bg-black rounded-lg mb-3 relative overflow-hidden flex items-center justify-center">
              <video ref={videoRef} className={`w-full h-full object-cover ${!cameraActive ? 'hidden' : ''}`} muted playsInline />
              {!cameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-red-500 bg-gray-900">
                  <VideoOff size={32} className="mb-2" />
                  <span className="text-xs">请允许浏览器访问摄像头</span>
                </div>
              )}
              {cameraActive && <div className="absolute top-2 right-2 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>}
            </div>
            <p className="text-xs text-center text-gray-400">{cameraActive ? '在线监考中，画面正常' : '请允许浏览器访问摄像头'}</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <h3 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">题目列表</h3>
            <div className="grid grid-cols-4 gap-2">
              {!examReady && <div className="text-xs text-gray-400 col-span-4">正在加载试题...</div>}
              {examReady && exam!.paper!.questions.map((q, idx) => {
                const isAnswered = !!answers[q.questionId];
                const isCurrent = idx === currentQIndex;
                return (
                  <button
                    key={q.questionId}
                    onClick={() => setCurrentQIndex(idx)}
                    className={`h-10 rounded-md text-sm font-medium transition-all ${
                      isCurrent ? 'bg-blue-600 text-white shadow-md' : isAnswered ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
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
              onClick={() => (previewMode ? handleSubmit() : setPreviewMode(true))}
              disabled={isSubmitting}
              className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle size={18} /> {previewMode ? (isSubmitting ? '提交中...' : '提交试卷') : '整卷预览'}
            </button>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-8 md:p-12">
          {!examReady ? (
            <div className="max-w-3xl mx-auto text-center text-gray-500 text-lg">正在加载考场环境...</div>
          ) : previewMode ? (
            <div className="max-w-4xl mx-auto">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">整卷预览</h2>
                  <p className="text-sm text-gray-500">请确认每道题的作答，提交后不可修改。</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setPreviewMode(false)}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    返回答题
                  </button>
                  <button
                    onClick={() => handleSubmit()}
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60"
                  >
                    {isSubmitting ? '提交中...' : '确认提交'}
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {exam.paper.questions.map((q, idx) => {
                  const answered = !!answers[q.questionId];
                  return (
                    <div
                      key={q.questionId}
                      className="flex items-center justify-between p-4 rounded-lg border border-gray-200 bg-white hover:border-blue-200 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                            answered ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <div className="text-sm text-gray-800">
                          <div className="font-medium text-gray-900 line-clamp-1">{q.question?.content || '题目'}</div>
                          <div className="text-xs text-gray-500">分值：{q.questionScore}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setCurrentQIndex(idx);
                          setPreviewMode(false);
                        }}
                        className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        {answered ? '查看/修改' : '去作答'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            qData && (
            <div className="max-w-3xl mx-auto">
              <div className="mb-6">
                <span className="inline-block px-3 py-1 bg-gray-200 rounded-full text-xs font-semibold text-gray-700 mb-3">
                  {getQuestionTypeLabel(qData.questionType)} · {currentQ!.questionScore} 分
                </span>
                <h2 className="text-2xl font-medium text-gray-900 leading-relaxed">
                  {currentQIndex + 1}. {qData.content}
                </h2>
              </div>

              <div className="space-y-4">
                {(qData.questionType === 'single' || qData.questionType === 'judge') &&
                  optionList.map(([key, text]) => (
                    <label
                      key={key}
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        answers[qData.questionId] === key ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50'
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
                      <span className="text-lg text-gray-700">
                        {key}. {text}
                      </span>
                    </label>
                  ))}

                {qData.questionType === 'multiple' &&
                  optionList.map(([key, text]) => {
                    const current = answers[qData.questionId] ? answers[qData.questionId].split(',').filter(Boolean) : [];
                    const selected = new Set(current);
                    const toggle = () => {
                      const next = new Set(selected);
                      if (next.has(key)) next.delete(key);
                      else next.add(key);
                      const joined = Array.from(next).sort().join(',');
                      handleAnswerChange(qData.questionId, joined);
                    };
                    return (
                      <label
                        key={key}
                        className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          selected.has(key) ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50'
                        }`}
                      >
                        <input type="checkbox" checked={selected.has(key)} onChange={toggle} className="w-5 h-5 text-blue-600 focus:ring-blue-500" />
                        <span className="text-lg text-gray-700">
                          {key}. {text}
                        </span>
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
                  onClick={() => {
                    if (currentQIndex === exam!.paper!.questions!.length - 1) {
                      setPreviewMode(true);
                    } else {
                      setCurrentQIndex(Math.min(exam!.paper!.questions!.length - 1, currentQIndex + 1));
                    }
                  }}
                  disabled={false}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {currentQIndex === exam!.paper!.questions!.length - 1 ? '整卷预览' : '下一题'}
                </button>
              </div>
            </div>
            )
          )}
        </main>
      </div>
    </div>
  );
};

function mapPortalQuestions(raw: any[]): PaperQuestionItem[] {
  const parseOptions = (options: any): Record<string, string> | undefined => {
    if (!options) return undefined;
    if (typeof options === 'string') {
      try {
        return JSON.parse(options);
      } catch {
        return undefined;
      }
    }
    return options;
  };
  return (raw || []).map((item: any, idx: number) => {
    const q: Question = {
      questionId: Number(item.questionId),
      creatorId: 0,
      questionType: item.questionType,
      difficulty: item.difficulty,
      content: item.content,
      options: parseOptions(item.options),
      answer: '',
      defaultScore: Number(item.questionScore ?? 0),
      tagIds: [],
      tagNames: [],
    };
    return {
      questionId: Number(item.questionId),
      questionScore: Number(item.questionScore ?? 0),
      sequenceNum: Number(item.sequenceNum ?? idx + 1),
      paperId: 0,
      question: q,
      pqId: item.pqId,
      ...(item.studentResponse ? { studentResponse: item.studentResponse } : {}),
    } as any;
  });
}

export default ExamPaper;
