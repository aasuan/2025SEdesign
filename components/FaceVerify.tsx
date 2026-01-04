import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api';
import { Camera, RefreshCw, ShieldCheck, XCircle } from 'lucide-react';

const FaceVerify: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<'idle' | 'verifying' | 'passed' | 'failed'>('idle');
  const [message, setMessage] = useState<string>('请允许摄像头权限，准备进行人脸验证');

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (err: any) {
        setStatus('failed');
        setMessage(err?.message || '摄像头不可用，请检查权限或设备');
      }
    };
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

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
    if (!video) throw new Error('摄像头未就绪');
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('无法获取画布');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.85);
  };

  const handleVerify = async () => {
    if (!id) return;
    setStatus('verifying');
    setMessage('正在进行人脸验证...');
    try {
      const img = await captureSnapshot();
      await api.verifyFace(Number(id), img);
      setStatus('passed');
      setMessage('人脸验证通过，即将进入考试');
      setTimeout(() => navigate(`/take-exam/${id}`), 800);
    } catch (err: any) {
      setStatus('failed');
      setMessage(err?.message || '人脸验证失败，请重试');
    }
  };

  const handleBack = () => {
    navigate('/my-exams');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 w-full max-w-3xl space-y-6">
        <div className="flex items-center gap-3">
          <ShieldCheck className="text-blue-600" size={28} />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">人脸验证</h1>
            <p className="text-gray-500 text-sm">进入考试前需要通过人脸核验</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="aspect-video bg-black rounded-xl overflow-hidden relative">
              <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
              {!streamRef.current && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black/50 text-sm">
                  <Camera size={20} className="mb-2" />
                  <span>正在请求摄像头权限...</span>
                </div>
              )}
            </div>
            <div className="text-xs text-gray-500">请确保光线充足、正对摄像头，避免遮挡。</div>
          </div>

          <div className="flex flex-col gap-4">
            <div
              className={`p-4 rounded-xl text-sm ${
                status === 'passed'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : status === 'failed'
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-gray-50 text-gray-700 border border-gray-200'
              }`}
            >
              {message}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleVerify}
                disabled={status === 'verifying'}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {status === 'verifying' ? '验证中...' : '开始验证'}
              </button>
              <button
                type="button"
                onClick={handleVerify}
                className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
              >
                <RefreshCw size={16} /> 重试
              </button>
              <button
                type="button"
                onClick={handleBack}
                className="px-4 py-3 bg-white text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <XCircle size={16} /> 返回
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaceVerify;
