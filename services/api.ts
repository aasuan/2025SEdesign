import { MOCK_USERS, MOCK_EXAMS, MOCK_PAPERS, MOCK_QUESTIONS, MOCK_ANSWERS, MOCK_SCORES } from './mockData';
import { UserProfile, Exam, Paper, Question, StudentAnswer, ScoreRecord } from '../types';

// Simulate network delay
// Reduced delays for better UI responsiveness
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class ApiService {
  private currentUser: UserProfile | null = null;
  private exams = [...MOCK_EXAMS];
  private papers = [...MOCK_PAPERS];
  private questions = [...MOCK_QUESTIONS];
  private answers = [...MOCK_ANSWERS];
  private scores = [...MOCK_SCORES];

  // Auth
  async login(username: string): Promise<UserProfile> {
    await delay(100); // Reduced from 500
    const user = MOCK_USERS.find(u => u.username === username);
    if (!user) throw new Error('Invalid credentials');
    this.currentUser = user;
    return user;
  }

  async getCurrentUser(): Promise<UserProfile | null> {
    return this.currentUser;
  }

  async logout(): Promise<void> {
    this.currentUser = null;
  }

  // Profile Management
  async updateUserProfile(data: Partial<UserProfile>): Promise<UserProfile> {
    await delay(300);
    if (!this.currentUser) throw new Error("Not logged in");
    
    // Update local mock data
    const userIndex = MOCK_USERS.findIndex(u => u.id === this.currentUser!.id);
    if (userIndex !== -1) {
      MOCK_USERS[userIndex] = { ...MOCK_USERS[userIndex], ...data };
      this.currentUser = { ...MOCK_USERS[userIndex] }; // Update session
    }
    return this.currentUser;
  }

  async sendVerificationCode(contact: string): Promise<string> {
    await delay(500);
    // In reality, send email/SMS. Here, we simulate it.
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`[Mock] Verification Code for ${contact}: ${code}`);
    // Use alert to simulate receiving SMS/Email in this demo environment
    alert(`[模拟验证码] 您的验证码是: ${code}`);
    return code;
  }

  async changePassword(newPassword: string, code: string): Promise<void> {
    await delay(500);
    if (!code || code.length !== 6) throw new Error("验证码无效");
    // In a real app, verify code and update password hash
    console.log('[Mock] Password changed successfully');
  }

  // Teacher Methods
  async getExams(status?: string): Promise<Exam[]> {
    await delay(50); // Reduced from 300
    let result = this.exams;
    if (status) {
      result = result.filter(e => e.status === status);
    }
    // Hydrate
    return result.map(e => ({
      ...e,
      paper: this.papers.find(p => p.paperId === e.paperId)
    }));
  }

  async getPapers(): Promise<Paper[]> {
    await delay(50);
    return this.papers;
  }

  async createPaper(paper: Omit<Paper, 'paperId'>): Promise<Paper> {
    await delay(100);
    const newPaper = { ...paper, paperId: Date.now() };
    this.papers.push(newPaper);
    return newPaper;
  }

  async updatePaper(paper: Paper): Promise<Paper> {
    await delay(100);
    const index = this.papers.findIndex(p => p.paperId === paper.paperId);
    if (index !== -1) {
      this.papers[index] = { ...paper };
      return this.papers[index];
    }
    throw new Error('Paper not found');
  }

  async deletePaper(paperId: number): Promise<void> {
    await delay(100);
    // Ensure both are numbers for comparison
    this.papers = this.papers.filter(p => p.paperId !== Number(paperId));
  }

  async createExam(exam: Omit<Exam, 'examId'>): Promise<Exam> {
    await delay(100); // Reduced from 500
    const newExam = { ...exam, examId: Date.now() };
    this.exams.push(newExam);
    return newExam;
  }

  async updateExam(exam: Exam): Promise<Exam> {
    await delay(100);
    const index = this.exams.findIndex(e => e.examId === exam.examId);
    if (index !== -1) {
      this.exams[index] = { ...exam };
      return this.exams[index];
    }
    throw new Error('Exam not found');
  }

  async deleteExam(examId: number): Promise<void> {
    await delay(100);
    // Ensure both are numbers for comparison
    this.exams = this.exams.filter(e => e.examId !== Number(examId));
  }

  async getQuestions(query?: string): Promise<Question[]> {
    await delay(50); // Reduced from 300
    if (!query) return this.questions;
    
    const lowerQuery = query.toLowerCase();
    return this.questions.filter(q => 
      q.content.toLowerCase().includes(lowerQuery) || 
      q.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  async createQuestion(question: Omit<Question, 'questionId' | 'creatorId'>): Promise<Question> {
    await delay(100); // Reduced from 400
    const newQuestion: Question = {
      ...question,
      questionId: Date.now(),
      creatorId: this.currentUser?.id || 1
    };
    this.questions.push(newQuestion);
    return newQuestion;
  }

  async updateQuestion(question: Question): Promise<Question> {
    await delay(100); // Reduced from 400
    const index = this.questions.findIndex(q => q.questionId === question.questionId);
    if (index !== -1) {
      this.questions[index] = { ...question };
      return this.questions[index];
    }
    throw new Error('Question not found');
  }

  async deleteQuestion(questionId: number): Promise<void> {
    await delay(100);
    this.questions = this.questions.filter(q => q.questionId !== Number(questionId));
  }

  async getUngradedAnswers(): Promise<StudentAnswer[]> {
    await delay(50); // Reduced from 400
    return this.answers.filter(a => !a.isGraded).map(a => ({
      ...a,
      question: this.questions.find(q => q.questionId === a.questionId)
    }));
  }

  async gradeAnswer(answerId: number, score: number): Promise<void> {
    await delay(50); // Reduced from 300
    const ans = this.answers.find(a => a.answerId === answerId);
    if (ans) {
      ans.obtainedScore = score;
      ans.isGraded = true;
      ans.graderId = this.currentUser?.id;

      // Update total score in score record
      const record = this.scores.find(s => s.examId === ans.examId && s.studentId === ans.studentId);
      if (record) {
        // Recalculate total
        const allExamAnswers = this.answers.filter(a => a.examId === ans.examId && a.studentId === ans.studentId);
        record.totalScore = allExamAnswers.reduce((sum, a) => sum + (a.obtainedScore || 0), 0);
      }
    }
  }

  // Student Methods
  async getMyExams(): Promise<Exam[]> {
    await delay(50); // Reduced from 300
    // In real app, check participant list. Here return all active.
    return this.exams.filter(e => e.status === 'Active');
  }

  async getExamDetails(examId: number): Promise<Exam | undefined> {
    await delay(50); // Reduced from 300
    const exam = this.exams.find(e => e.examId === examId);
    if (!exam) return undefined;
    const paper = this.papers.find(p => p.paperId === exam.paperId);
    if (paper) {
      // Hydrate questions
      paper.questions = paper.questions.map(pq => ({
        ...pq,
        question: this.questions.find(q => q.questionId === pq.questionId)
      }));
      exam.paper = paper;
    }
    return exam;
  }

  async submitExamAnswers(examId: number, answers: { questionId: number, response: string }[]): Promise<void> {
    await delay(200); // Reduced from 800
    
    const exam = this.exams.find(e => e.examId === examId);
    const paper = this.papers.find(p => p.paperId === exam?.paperId);

    let currentTotalScore = 0;

    answers.forEach(ans => {
      const question = this.questions.find(q => q.questionId === ans.questionId);
      const paperQuestion = paper?.questions.find(pq => pq.questionId === ans.questionId);
      // Use the score defined in the paper, fallback to default
      const maxScore = paperQuestion?.questionScore || question?.defaultScore || 0;

      let score = 0;
      let isGraded = false;

      // Auto-grade logic for objective types
      const isObjective = 
        question?.questionType === 'SingleChoice' || 
        question?.questionType === 'TrueFalse' ||
        question?.questionType === 'MultiChoice';

      if (isObjective) {
        const studentRes = ans.response ? ans.response.trim() : '';
        const correctRes = question?.answer ? question.answer.trim() : '';
        
        score = studentRes === correctRes ? maxScore : 0;
        isGraded = true;
      }

      this.answers.push({
        answerId: Math.floor(Math.random() * 100000),
        examId,
        studentId: this.currentUser?.id || 0,
        questionId: ans.questionId,
        studentResponse: ans.response,
        isGraded,
        obtainedScore: score
      });
      
      currentTotalScore += score;
    });

    // Create a score record placeholder
    // Check if record exists
    const existingRecordIndex = this.scores.findIndex(s => s.examId === examId && s.studentId === this.currentUser?.id);
    if (existingRecordIndex !== -1) {
        this.scores[existingRecordIndex].totalScore = currentTotalScore;
    } else {
        this.scores.push({
            recordId: Date.now(),
            examId,
            studentId: this.currentUser?.id || 0,
            paperId: exam?.paperId || 0,
            totalScore: currentTotalScore, 
            isFinal: false,
            ranking: 0
        });
    }
  }

  async getMyScores(): Promise<ScoreRecord[]> {
    await delay(50); // Reduced from 300
    return this.scores.filter(s => s.studentId === this.currentUser?.id);
  }

  async getExamStats(examId: number): Promise<number[]> {
     // Mock stats: return random scores for chart
     return Array.from({length: 20}, () => Math.floor(Math.random() * 100));
  }

  // New method for fetching detailed result
  async getStudentExamResult(examId: number): Promise<{ exam: Exam, answers: StudentAnswer[], scoreRecord?: ScoreRecord } | null> {
    await delay(50);
    const exam = await this.getExamDetails(examId);
    if (!exam || !this.currentUser) return null;

    const answers = this.answers.filter(a => a.examId === examId && a.studentId === this.currentUser?.id);
    const scoreRecord = this.scores.find(s => s.examId === examId && s.studentId === this.currentUser?.id);

    return { exam, answers, scoreRecord };
  }
}

export const api = new ApiService();