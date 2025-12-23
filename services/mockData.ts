import { Exam, Paper, Question, QuestionType, ScoreRecord, StudentAnswer, UserProfile } from "../types";

export const MOCK_USERS: UserProfile[] = [
  { id: 1, username: 'teacher', realName: '张老师', email: 't@test.com', phone: '123', userRole: 'Teacher', status: 'Active' },
  { id: 2, username: 'student', realName: '李同学', email: 's@test.com', phone: '456', userRole: 'Student', status: 'Active' },
];

export const MOCK_QUESTIONS: Question[] = [
  {
    questionId: 101, creatorId: 1, questionType: QuestionType.SingleChoice, difficulty: '简单',
    content: '哪个 React Hook 用于处理副作用？',
    options: ['useState', 'useEffect', 'useContext', 'useReducer'],
    answer: 'useEffect', 
    analysis: 'useEffect 是 React 中用于处理副作用（如数据获取、订阅、手动修改 DOM 等）的标准 Hook。',
    defaultScore: 5, tags: ['React', 'Hooks']
  },
  {
    questionId: 102, creatorId: 1, questionType: QuestionType.SingleChoice, difficulty: '简单',
    content: '法国的首都是哪里？',
    options: ['伦敦', '柏林', '巴黎', '马德里'],
    answer: '巴黎', 
    analysis: '巴黎是法国的首都和最大城市。',
    defaultScore: 5, tags: ['地理', '常识']
  },
  {
    questionId: 103, creatorId: 1, questionType: QuestionType.ShortAnswer, difficulty: '中等',
    content: '请简述虚拟 DOM (Virtual DOM) 的概念。',
    answer: '虚拟 DOM 是真实 DOM 的轻量级副本，React 使用它来优化渲染性能...', 
    analysis: '核心点应包含：1. 内存中的 JavaScript 对象结构；2. 与真实 DOM 同步；3. Diff 算法减少重绘。',
    defaultScore: 10, tags: ['React', '原理']
  },
  {
    questionId: 104, creatorId: 1, questionType: QuestionType.TrueFalse, difficulty: '简单',
    content: 'TypeScript 是 JavaScript 的超集。',
    options: ['正确', '错误'],
    answer: '正确', 
    analysis: 'TypeScript 包含了 JavaScript 的所有特性，并添加了静态类型系统。',
    defaultScore: 2, tags: ['TypeScript', '基础']
  }
];

export const MOCK_PAPERS: Paper[] = [
  {
    paperId: 201, paperName: '前端基础测试', creatorId: 1, totalScore: 22, isDraft: false,
    questions: [
      { questionId: 101, questionScore: 5, sequenceNum: 1 },
      { questionId: 102, questionScore: 5, sequenceNum: 2 },
      { questionId: 103, questionScore: 10, sequenceNum: 3 },
      { questionId: 104, questionScore: 2, sequenceNum: 4 },
    ]
  }
];

export const MOCK_EXAMS: Exam[] = [
  {
    examId: 301, paperId: 201, examName: '前端期中考试',
    startTime: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    endTime: new Date(Date.now() + 86400000).toISOString(),   // Tomorrow
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
  // Submitted answers for Exam 302 (Student 2)
  { answerId: 501, examId: 302, studentId: 2, questionId: 101, studentResponse: 'useEffect', isGraded: true, obtainedScore: 5 },
  { answerId: 502, examId: 302, studentId: 2, questionId: 103, studentResponse: '它是一种 Shadow DOM。', isGraded: false, obtainedScore: 0 },
];

export const MOCK_SCORES: ScoreRecord[] = [
  { recordId: 601, examId: 302, studentId: 2, paperId: 201, totalScore: 5, isFinal: false, ranking: 1, examName: '往期考试 - React 基础' }
];