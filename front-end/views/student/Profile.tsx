import React, { useState } from 'react';
import { uploadFaceImage } from '../../services/profileApi';

const Profile: React.FC = () => {
  const [preview, setPreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setPreview(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!preview) {
      alert('请先选择一张人脸照片');
      return;
    }
    setUploading(true);
    try {
      await uploadFaceImage(preview);
      alert('人脸上传成功，请在考试前完成验证');
    } catch (err: any) {
      alert(err?.message || '上传失败');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm max-w-3xl">
      <h2 className="text-2xl font-bold text-slate-800 mb-2">个人中心 - 基本信息</h2>
      <p className="text-sm text-slate-500 mb-6">
        请在考试前上传本人清晰正脸照片，系统将用于进入考试时的人脸验证。
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-2">选择人脸照片</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="block w-full text-sm text-slate-700"
          />
          <p className="text-xs text-slate-400 mt-1">建议上传无遮挡、正脸、高于 200x200 像素的清晰照片。</p>
        </div>

        {preview && (
          <div className="flex items-center gap-4">
            <div className="w-32 h-32 rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
              <img src={preview} alt="face preview" className="w-full h-full object-cover" />
            </div>
            <div className="text-sm text-slate-500">
              预览：如果照片不合适，请重新选择。
            </div>
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={uploading}
          className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-60"
        >
          {uploading ? '上传中...' : '保存人脸照片'}
        </button>
      </div>
    </div>
  );
};

export default Profile;
