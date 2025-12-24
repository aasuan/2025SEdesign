import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Exam, StudentAnswer, ScoreRecord } from '../types';
import { CheckCircle, XCircle, ArrowLeft, AlertCircle, HelpCircle, Clock, CheckSquare } from 'lucide-react';

const StudentResultDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<{ exam: Exam; answers: StudentAnswer[]; scoreRecord?: ScoreRecord } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      api.getStudentExamResult(Number(id)).then(res => {
        setData(res);
        setLoading(false);
      });
    }
  }, [id]);

  if (loading) return <div className="p-8 text-center text-gray-500">加载中...</div>;
  if (!data || !data.exam.paper) return <div className="p-8 text-center text-red-500">未找到考试记录</div>;

  const { exam, answers, scoreRecord } = data;

  const getAnswerForQuestion = (qId: number) => answers.find(a => a.questionId === qId);

  // Helper for normalizing strings for comparison
  const normalize = (str: string | undefined) => str ? str.trim() : '';
  const normalizeStrict = (str: string | undefined) => str ? str.trim().toLowerCase() : '';
  
  // Helper for multi-choice set comparison (e.g. "A,B" == "B, A")
  const normalizeSet = (str: string | undefined) => {
    if (!str) return '';
    return str.split(/[,，]/).map(s => s.trim().toLowerCase()).sort().join(',');
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={20} /> 返回列表
        </button>
        <div className="text-right">
          <p className="text-sm text-gray-500">试卷总分: {exam.paper.totalScore}</p>
          <div className="flex items-baseline gap-2 justify-end">
            <span className="text-sm text-gray-600">你的得分:</span>
            <span className={`text-3xl font-bold ${
              (scoreRecord?.totalScore || 0) >= (exam.paper.totalScore * 0.6) ? 'text-green-600' : 'text-red-600'
            }`}>
              {scoreRecord?.totalScore || 0}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
        <div className="p-6 border-b border-gray-100 bg-gray-50">
          <h1 className="text-2xl font-bold text-gray-800">{exam.examName} - 答题解析</h1>
          <p className="text-gray-500 mt-1 text-sm">提交时间: {new Date(exam.endTime).toLocaleString()}</p>
        </div>
      </div>

      <div className="space-y-6">
        {exam.paper.questions.map((item, index) => {
          const q = item.question!;
          const userAnswer = getAnswerForQuestion(q.questionId);
          
          // Identify objective questions
          const isObjective = 
            q.questionType === 'single' || 
            q.questionType === 'judge' ||
            q.questionType === 'multiple';

          // Determine Status
          let status: 'correct' | 'wrong' | 'pending' | 'partial' = 'wrong';
          
          if (!userAnswer) {
             status = 'wrong'; // Unanswered
          } else if (isObjective) {
             // Robust comparison logic
             const userResp = userAnswer.studentResponse;
             const correctResp = q.answer;

             // Check 1: Exact Match (trimmed)
             if (normalize(userResp) === normalize(correctResp)) {
                status = 'correct';
             } 
             // Check 2: Case Insensitive
             else if (normalizeStrict(userResp) === normalizeStrict(correctResp)) {
                status = 'correct';
             }
             // Check 3: Set match (for multi-choice "A,B" vs "B,A")
             else if (normalizeSet(userResp) === normalizeSet(correctResp)) {
                status = 'correct';
             }
             else {
                status = 'wrong';
             }
          } else {
             // For subjective/other questions, rely on graded status and obtained score
             if (!userAnswer.isGraded) {
                status = 'pending';
             } else if (userAnswer.obtainedScore >= item.questionScore) {
                status = 'correct';
             } else if (userAnswer.obtainedScore > 0) {
                status = 'partial';
             } else {
                status = 'wrong';
             }
          }

          // Styles based on status
          const borderClass = 
             status === 'correct' ? 'border-l-green-500' :
             status === 'wrong' ? 'border-l-red-500' :
             status === 'pending' ? 'border-l-orange-400' :
             'border-l-yellow-500';

          const bgBadgeClass = 
             status === 'correct' ? 'bg-green-100 text-green-700' :
             status === 'wrong' ? 'bg-red-100 text-red-700' :
             status === 'pending' ? 'bg-orange-100 text-orange-700' :
             'bg-yellow-100 text-yellow-700';

          return (
            <div 
              key={q.questionId} 
              id={`q-${q.questionId}`}
              className={`bg-white rounded-xl shadow-sm border-l-4 overflow-hidden ${borderClass}`}
            >
              <div className="p-6">
                <div className="flex items-start gap-3 mb-4">
                  <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${bgBadgeClass}`}>
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 leading-relaxed">
                      {q.content} 
                      <span className="ml-2 text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                        {item.questionScore} 分
                      </span>
                    </h3>
                  </div>
                  <div className="flex-shrink-0">
                    {status === 'correct' && <CheckCircle className="text-green-500" size={24} />}
                    {status === 'wrong' && <XCircle className="text-red-500" size={24} />}
                    {status === 'pending' && <Clock className="text-orange-400" size={24} />}
                    {status === 'partial' && <CheckSquare className="text-yellow-500" size={24} />}
                  </div>
                </div>

                {/* Options (for objective types with options defined) */}
                {isObjective && q.options && (
                  <div className="space-y-2 mb-6 ml-11">
                    {Object.entries(q.options).map(([key, text], i) => {
                      const responseKeys = normalizeSet(userAnswer?.studentResponse).split(','); // already lowercased
                      const answerKeys = normalizeSet(q.answer).split(',');
                      const isSelected = responseKeys.includes(key.toLowerCase()) || normalize(userAnswer?.studentResponse) === key;
                      const isActualCorrect = answerKeys.includes(key.toLowerCase()) || normalize(q.answer) === key;

                      let rowClass = "border-gray-200 hover:bg-gray-50";
                      if (isSelected && isActualCorrect) rowClass = "bg-green-50 border-green-200 text-green-700";
                      else if (isSelected && !isActualCorrect) rowClass = "bg-red-50 border-red-200 text-red-700";
                      else if (!isSelected && isActualCorrect) rowClass = "bg-green-50 border-green-200 text-green-700 border-dashed"; 

                      return (
                        <div key={i} className={`p-3 rounded-lg border ${rowClass} flex items-center justify-between`}>
                          <span>{key}. {text}</span>
                          {isActualCorrect && <CheckCircle size={16} />}
                          {isSelected && !isActualCorrect && <XCircle size={16} />}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Text Answer Display (Subjective OR Objective if match failed drastically) */}
                {!isObjective && (
                  <div className="mb-6 ml-11 p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">你的回答</p>
                    <p className="text-gray-800 whitespace-pre-wrap">{userAnswer?.studentResponse || '(未作答)'}</p>
                  </div>
                )}

                {/* Analysis Section */}
                <div className="ml-11 pt-4 border-t border-gray-100">
                  <div className="flex gap-6 text-sm">
                    <div className="flex-1">
                      <p className="font-bold text-gray-700 mb-1 flex items-center gap-1">
                        <CheckCircle size={14} className="text-green-600"/> 正确答案
                      </p>
                      <p className="text-green-700 font-medium">{q.answer}</p>
                    </div>
                    {/* Always show score if answered */}
                    {userAnswer && (
                       <div className="flex-1">
                          <p className="font-bold text-gray-700 mb-1">得分</p>
                          <div className="flex items-center gap-2">
                            <p className={`font-medium ${
                              status === 'correct' ? 'text-green-600' :
                              status === 'wrong' ? 'text-red-600' :
                              status === 'partial' ? 'text-yellow-600' : 'text-orange-500'
                            }`}>
                              {userAnswer.obtainedScore} / {item.questionScore}
                            </p>
                            {status === 'pending' && <span className="text-xs text-orange-400 bg-orange-50 px-1 rounded border border-orange-100">待阅卷</span>}
                          </div>
                       </div>
                    )}
                  </div>
                  
                  {q.analysis && (
                    <div className="mt-4 bg-blue-50 p-4 rounded-lg text-sm text-blue-900">
                      <p className="font-bold mb-1 flex items-center gap-1">
                        <HelpCircle size={14} /> 解析
                      </p>
                      {q.analysis}
                    </div>
                  )}

                  {!isObjective && !userAnswer?.isGraded && (
                    <div className="mt-2 text-xs text-orange-500 flex items-center gap-1">
                      <AlertCircle size={12} /> 该题目暂未评分，当前得分仅供参考。
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StudentResultDetail;
