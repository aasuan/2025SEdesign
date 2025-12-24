export enum UserRole {
  STUDENT = 'STUDENT',
  TEACHER = 'TEACHER',
  ADMIN = 'ADMIN'
}

export enum QuestionType {
  SINGLE_CHOICE = 'SINGLE_CHOICE',
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  TRUE_FALSE = 'TRUE_FALSE',
  FILL_IN_THE_BLANK = 'FILL_IN_THE_BLANK',
  SHORT_ANSWER = 'SHORT_ANSWER'
}

export interface Question {
  id: string;
  content: string;
  type: QuestionType;
  options?: string[];
  correctAnswer: string | string[];
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  tags: string[];
  explanation?: string;
}

export interface Exam {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  startTime: string;
  endTime: string;
  questions: Question[];
  status: 'DRAFT' | 'PUBLISHED' | 'COMPLETED';
  totalPoints: number;
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
}

export interface Submission {
  id: string;
  examId: string;
  studentId: string;
  answers: Record<string, string | string[]>;
  score: number;
  submittedAt: string;
  aiAnalysis?: string;
}

// Stats for Charts
export interface ExamStats {
  examId: string;
  averageScore: number;
  passRate: number;
  scoreDistribution: { range: string; count: number }[];
}