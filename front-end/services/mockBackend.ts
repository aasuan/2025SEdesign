import { Exam, Question, QuestionType, Submission, User, UserRole, ExamStats } from "../types";

// Mock Data Store
let MOCK_EXAMS: Exam[] = [
  {
    id: 'exam-001',
    title: 'Java EE 企业级开发基础',
    description: '期中考试，涵盖 Servlet, JSP 和 Spring Boot 基础知识。',
    durationMinutes: 45,
    startTime: new Date().toISOString(),
    endTime: new Date(Date.now() + 86400000 * 7).toISOString(),
    status: 'PUBLISHED',
    totalPoints: 100,
    questions: [
      {
        id: 'q1',
        content: '在 Java EE 中，使用哪个注解来定义 Servlet？',
        type: QuestionType.SINGLE_CHOICE,
        options: ['@WebServlet', '@Controller', '@Service', '@Component'],
        correctAnswer: '@WebServlet',
        difficulty: 'EASY',
        tags: ['JavaEE', 'Servlet']
      },
      {
        id: 'q2',
        content: 'Spring Boot 遵循“约定优于配置”的原则。',
        type: QuestionType.TRUE_FALSE,
        options: ['正确', '错误'],
        correctAnswer: '正确',
        difficulty: 'EASY',
        tags: ['Spring Boot']
      },
      {
        id: 'q3',
        content: '请简述 Spring Bean 的生命周期。',
        type: QuestionType.SHORT_ANSWER,
        correctAnswer: '实例化、属性填充、初始化、销毁',
        difficulty: 'HARD',
        tags: ['Spring', 'Core']
      }
    ]
  }
];

const MOCK_SUBMISSIONS: Submission[] = [];

// Service Methods simulating REST API calls to Java Backend

export const loginMock = async (role: UserRole): Promise<User> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id: role === UserRole.TEACHER ? 'teacher-1' : 'student-1',
        name: role === UserRole.TEACHER ? '邓布利多教授' : '哈利·波特',
        role: role,
        avatarUrl: `https://picsum.photos/200`
      });
    }, 500);
  });
};

export const fetchExams = async (role: UserRole): Promise<Exam[]> => {
  return new Promise((resolve) => setTimeout(() => resolve(MOCK_EXAMS), 400));
};

export const saveExam = async (exam: Exam): Promise<void> => {
  return new Promise((resolve) => {
    MOCK_EXAMS.push(exam);
    setTimeout(resolve, 600);
  });
};

export const updateExam = async (updatedExam: Exam): Promise<void> => {
    return new Promise((resolve) => {
        MOCK_EXAMS = MOCK_EXAMS.map(e => e.id === updatedExam.id ? updatedExam : e);
        setTimeout(resolve, 600);
    });
};

export const deleteExam = async (examId: string): Promise<void> => {
    return new Promise((resolve) => {
        MOCK_EXAMS = MOCK_EXAMS.filter(e => e.id !== examId);
        setTimeout(resolve, 400);
    });
};

export const submitExamAnswers = async (submission: Submission): Promise<void> => {
  return new Promise((resolve) => {
    MOCK_SUBMISSIONS.push(submission);
    setTimeout(resolve, 800);
  });
};

export const getExamStats = async (examId: string): Promise<ExamStats> => {
    // Simulate aggregation query
    return {
        examId,
        averageScore: 78.5,
        passRate: 85,
        scoreDistribution: [
            { range: '0-59', count: 2 },
            { range: '60-79', count: 12 },
            { range: '80-89', count: 15 },
            { range: '90-100', count: 8 },
        ]
    };
}

export const getStudentHistory = async (studentId: string): Promise<Submission[]> => {
    return MOCK_SUBMISSIONS.filter(s => s.studentId === studentId);
}