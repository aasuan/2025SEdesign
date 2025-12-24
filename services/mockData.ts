import { Exam, Paper, PaperQuestionItem, Question, ScoreRecord, StudentAnswer, UserProfile } from "../types";

export const MOCK_USERS: UserProfile[] = [
  { id: 1, username: 'teacher', realName: '张老师', email: 't@test.com', phone: '123', userRole: 'Teacher', status: 'Active' },
  { id: 2, username: 'student', realName: '李同学', email: 's@test.com', phone: '456', userRole: 'Student', status: 'Active' },
];

export const MOCK_QUESTIONS: Question[] = [
  {
    questionId: 101,
    creatorId: 1,
    questionType: 'single',
    difficulty: 'easy',
    content: '哪个 React Hook 用于处理副作用？',
    options: { A: 'useState', B: 'useEffect', C: 'useContext', D: 'useReducer' },
    answer: 'B',
    defaultScore: 5,
    tagNames: ['React', 'Hooks'],
  },
  {
    questionId: 102,
    creatorId: 1,
    questionType: 'single',
    difficulty: 'easy',
    content: '法国的首都是哪里？',
    options: { A: '伦敦', B: '柏林', C: '巴黎', D: '马德里' },
    answer: 'C',
    defaultScore: 5,
    tagNames: ['地理', '常识'],
  },
  {
    questionId: 103,
    creatorId: 1,
    questionType: 'short',
    difficulty: 'medium',
    content: '请简述虚拟 DOM (Virtual DOM) 的概念。',
    answer: '虚拟 DOM 是真实 DOM 的轻量级副本，React 使用它来优化渲染性能...',
    defaultScore: 10,
    tagNames: ['React', '原理'],
  },
  {
    questionId: 104,
    creatorId: 1,
    questionType: 'judge',
    difficulty: 'easy',
    content: 'TypeScript 是 JavaScript 的超集。',
    options: { A: '正确', B: '错误' },
    answer: 'A',
    defaultScore: 2,
    tagNames: ['TypeScript', '基础'],
  }
];

const MOCK_ITEMS: PaperQuestionItem[] = [
  { paperId: 201, questionId: 101, questionScore: 5, sequenceNum: 1 },
  { paperId: 201, questionId: 102, questionScore: 5, sequenceNum: 2 },
  { paperId: 201, questionId: 103, questionScore: 10, sequenceNum: 3 },
  { paperId: 201, questionId: 104, questionScore: 2, sequenceNum: 4 },
];

export const MOCK_PAPERS: Paper[] = [
  {
    paperId: 201,
    paperName: '前端基础测试',
    creatorId: 1,
    totalScore: 22,
    draft: false,
    questions: MOCK_ITEMS,
    items: MOCK_ITEMS,
  }
];

export const MOCK_EXAMS: Exam[] = [
  {
    examId: 301, paperId: 201, examName: '前端期中考试',
    startTime: new Date(Date.now() - 86400000).toISOString(),
    endTime: new Date(Date.now() + 86400000).toISOString(),
    durationMinutes: 60, proctorId: 1, status: 'Active'
  },
  {
    examId: 302, paperId: 201, examName: '往期考试 - React 基础',
    startTime: new Date(Date.now() - 172800000).toISOString(),
    endTime: new Date(Date.now() - 86400000).toISOString(),
    durationMinutes: 45, proctorId: 1, status: 'Finished'
  }
];

export const MOCK_ANSWERS: StudentAnswer[] = [
  { answerId: 501, examId: 302, studentId: 2, questionId: 101, studentResponse: 'B', isGraded: true, obtainedScore: 5 },
  { answerId: 502, examId: 302, studentId: 2, questionId: 103, studentResponse: '它是一种Shadow DOM', isGraded: false, obtainedScore: 0 },
];

export const MOCK_SCORES: ScoreRecord[] = [
  { recordId: 601, examId: 302, studentId: 2, paperId: 201, totalScore: 5, isFinal: false, ranking: 1, examName: '往期考试 - React 基础' }
];
