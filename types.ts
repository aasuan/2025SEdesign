export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface UserProfile {
  id: number;
  username: string;
  realName: string;
  email: string;
  phone: string;
  userRole: 'Admin' | 'Teacher' | 'Student';
  status: 'Active' | 'Inactive' | 'Locked';
}

export enum QuestionType {
  SingleChoice = 'SingleChoice',
  MultiChoice = 'MultiChoice',
  TrueFalse = 'TrueFalse',
  ShortAnswer = 'ShortAnswer',
  FillBlank = 'FillBlank', // Added FillBlank
  Programming = 'Programming'
}

export interface Question {
  questionId: number;
  creatorId: number;
  questionType: QuestionType;
  difficulty: '简单' | '中等' | '困难';
  content: string;
  options?: string[]; // JSON string in DB, array here for ease
  answer: string;
  analysis?: string; // Added explanation/analysis
  defaultScore: number;
  tags: string[]; // Changed to string[]
}

export interface PaperQuestionItem {
  questionId: number;
  questionScore: number;
  sequenceNum: number;
  // Hydrated for UI
  question?: Question;
}

export interface Paper {
  paperId: number;
  paperName: string;
  creatorId: number;
  totalScore: number;
  isDraft: boolean;
  questions: PaperQuestionItem[];
}

export interface Exam {
  examId: number;
  paperId: number;
  examName: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  proctorId: number;
  status: 'Pending' | 'Active' | 'Finished' | 'Canceled';
  paper?: Paper; // Hydrated for UI
}

export interface StudentAnswer {
  answerId: number;
  examId: number;
  studentId: number;
  questionId: number;
  studentResponse: string;
  isGraded: boolean;
  obtainedScore: number;
  graderId?: number;
  gradeTime?: string;
  question?: Question; // Hydrated
}

export interface ScoreRecord {
  recordId: number;
  examId: number;
  studentId: number;
  paperId: number;
  totalScore: number;
  isFinal: boolean;
  ranking: number;
  examName?: string; // Hydrated
}

export interface DashboardStats {
  totalExams: number;
  activeExams: number;
  pendingGrading: number;
  averageScore?: number;
}