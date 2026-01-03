export async function uploadFaceImage(base64Image: string) {
  const res = await fetch('/api/profile/face-image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ faceImage: base64Image }),
    credentials: 'include',
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || '上传失败');
  }
  return res.json();
}
