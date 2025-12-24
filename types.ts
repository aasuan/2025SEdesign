export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export type Difficulty = 'easy' | 'medium' | 'hard';
export type QuestionType = 'single' | 'multiple' | 'judge' | 'short';

export interface UserProfile {
  id: number;
  username: string;
  realName?: string;
  email?: string;
  phone?: string;
  userRole?: string;
  status?: string;
}

export interface Tag {
  tagId: number;
  tagName: string;
  tagType: string;
  extraInfo?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Question {
  questionId: number;
  creatorId: number;
  questionType: QuestionType;
  difficulty: Difficulty;
  content: string;
  options?: Record<string, string> | null;
  answer: string;
  defaultScore: number;
  active?: boolean;
  tagIds?: number[];
  tagNames?: string[];
  analysis?: string;
}

export interface QuestionListResult {
  list: Question[];
  total: number;
  page: number;
  size: number;
}

export interface PaperQuestionItem {
  pqId?: number;
  paperId: number;
  questionId: number;
  questionScore: number;
  sequenceNum: number;
  question?: Question;
}

export interface PaperRule {
  questionType: QuestionType;
  count: number;
  scorePerQuestion?: number;
}

export interface Paper {
  paperId: number;
  paperName: string;
  creatorId: number;
  totalScore: number;
  draft: boolean;
  extraInfo?: string;
  items?: PaperQuestionItem[];
  questions?: PaperQuestionItem[]; // alias for UI compatibility
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
  paper?: Paper;
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
  question?: Question;
}

export interface ScoreRecord {
  recordId: number;
  examId: number;
  studentId: number;
  paperId: number;
  totalScore: number;
  isFinal: boolean;
  ranking: number;
  examName?: string;
}

export interface DashboardStats {
  totalExams: number;
  activeExams: number;
  pendingGrading: number;
  averageScore?: number;
}
