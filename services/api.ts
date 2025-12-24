import {
  ApiResponse,
  Difficulty,
  Paper,
  PaperQuestionItem,
  PaperRule,
  Question,
  QuestionListResult,
  QuestionType,
  ScoreRecord,
  StudentAnswer,
  Tag,
  UserProfile,
} from '../types';
import { MOCK_ANSWERS, MOCK_EXAMS, MOCK_PAPERS, MOCK_SCORES } from './mockData';

const BASE_URL = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:8080';

class ApiService {
  private currentUser: UserProfile | null = null;
  private questionsCache: Question[] = [];
  private papersCache: Paper[] = [];

  // Mock-only stores (exam module not covered by backend)
  private exams = [...MOCK_EXAMS];
  private answers = [...MOCK_ANSWERS];
  private scores = [...MOCK_SCORES];

  /* ---------------------- helpers ---------------------- */
  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(init.headers || {}),
      },
      ...init,
    });

    const text = await res.text();
    let body: ApiResponse<T>;
    try {
      body = text ? JSON.parse(text) : { code: res.status, message: res.statusText, data: null as any };
    } catch (err) {
      throw new Error(`响应解析失败: ${text}`);
    }

    if (!res.ok || body.code !== 0) {
      throw new Error(body?.message || `HTTP ${res.status}`);
    }
    return body.data;
  }

  private parseOptions(raw: any): Record<string, string> | undefined {
    if (!raw) return undefined;
    try {
      return typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch {
      return undefined;
    }
  }

  private normalizeQuestion(raw: any): Question {
    return {
      questionId: Number(raw.questionId),
      creatorId: Number(raw.creatorId),
      questionType: raw.questionType as QuestionType,
      difficulty: raw.difficulty as Difficulty,
      content: raw.content,
      options: this.parseOptions(raw.options),
      answer: raw.answer,
      defaultScore: Number(raw.defaultScore ?? 0),
      active: raw.active ?? raw.isActive,
      tagIds: raw.tagIds,
      tagNames: raw.tagNames,
    };
  }

  private normalizePaperItems(items?: any[]): PaperQuestionItem[] {
    return (items || []).map((it: any, idx: number) => ({
      pqId: it.pqId ?? it.id,
      paperId: Number(it.paperId),
      questionId: Number(it.questionId),
      questionScore: Number(it.questionScore ?? 0),
      sequenceNum: Number(it.sequenceNum ?? idx + 1),
      question: it.question ? this.normalizeQuestion(it.question) : undefined,
    }));
  }

  private normalizePaper(raw: any): Paper {
    const items = this.normalizePaperItems(raw.items || raw.questions);
    return {
      paperId: Number(raw.paperId),
      paperName: raw.paperName,
      creatorId: Number(raw.creatorId),
      totalScore: Number(raw.totalScore ?? 0),
      draft: !!(raw.draft ?? raw.isDraft),
      extraInfo: raw.extraInfo,
      items,
      questions: items,
    };
  }

  private requireLogin(): number {
    if (!this.currentUser?.id) {
      throw new Error('请先登录再进行操作');
    }
    return this.currentUser.id;
  }

  /* ---------------------- Auth ---------------------- */
  async register(payload: {
    username: string;
    password: string;
    realName?: string;
    email?: string;
    phone?: string;
  }): Promise<UserProfile> {
    const data = await this.request<UserProfile>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    this.currentUser = data;
    return data;
  }

  async login(username: string, password: string): Promise<UserProfile> {
    const data = await this.request<UserProfile>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    this.currentUser = data;
    return data;
  }

  async getCurrentUser(): Promise<UserProfile | null> {
    try {
      const data = await this.request<UserProfile>('/api/auth/me');
      this.currentUser = data;
      return data;
    } catch (err: any) {
      this.currentUser = null;
      if (String(err?.message || '').includes('401')) return null;
      return null;
    }
  }

  async logout(): Promise<void> {
    try {
      await this.request<void>('/api/auth/logout', { method: 'POST' });
    } finally {
      this.currentUser = null;
    }
  }

  /* ---------------------- Tags ---------------------- */
  async listTags(tagType?: string): Promise<Tag[]> {
    const query = tagType ? `?tagType=${encodeURIComponent(tagType)}` : '';
    return this.request<Tag[]>(`/api/tags${query}`);
  }

  async createTag(payload: { tagName: string; tagType: string; extraInfo?: string }): Promise<Tag> {
    return this.request<Tag>('/api/tags', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /* ---------------------- Questions ---------------------- */
  async getQuestions(params?: {
    keyword?: string;
    type?: QuestionType;
    difficulty?: Difficulty;
    page?: number;
    size?: number;
  }): Promise<Question[]> {
    const search = new URLSearchParams();
    if (params?.keyword) search.set('keyword', params.keyword);
    if (params?.type) search.set('type', params.type);
    if (params?.difficulty) search.set('difficulty', params.difficulty);
    search.set('page', String(params?.page || 1));
    search.set('size', String(params?.size || 50));

    const resp = await this.request<QuestionListResult>(`/api/questions?${search.toString()}`);
    const list = resp.list.map((q) => this.normalizeQuestion(q));
    this.questionsCache = list;
    return list;
  }

  async getQuestionById(id: number): Promise<Question> {
    const data = await this.request<Question>(`/api/questions/${id}`);
    const q = this.normalizeQuestion(data);
    return q;
  }

  async createQuestion(payload: {
    questionType: QuestionType;
    difficulty: Difficulty;
    content: string;
    options?: Record<string, string>;
    answer: string;
    defaultScore?: number;
    tagIds?: number[];
  }): Promise<Question> {
    const creatorId = this.requireLogin();
    const body = {
      ...payload,
      creatorId,
      options: payload.options ? JSON.stringify(payload.options) : undefined,
      defaultScore: payload.defaultScore ?? 5,
    };
    const data = await this.request<Question>('/api/questions', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    const q = this.normalizeQuestion(data);
    this.questionsCache.unshift(q);
    return q;
  }

  async updateQuestion(payload: {
    questionId: number;
    questionType: QuestionType;
    difficulty: Difficulty;
    content: string;
    options?: Record<string, string>;
    answer: string;
    defaultScore?: number;
    tagIds?: number[];
  }): Promise<Question> {
    const body = {
      ...payload,
      options: payload.options ? JSON.stringify(payload.options) : undefined,
      defaultScore: payload.defaultScore ?? 5,
    };
    const data = await this.request<Question>(`/api/questions/${payload.questionId}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    const q = this.normalizeQuestion(data);
    this.questionsCache = this.questionsCache.map((item) =>
      item.questionId === q.questionId ? q : item
    );
    return q;
  }

  async deleteQuestion(questionId: number): Promise<void> {
    await this.request<void>(`/api/questions/${questionId}`, { method: 'DELETE' });
    this.questionsCache = this.questionsCache.filter((q) => q.questionId !== questionId);
  }

  /* ---------------------- Papers ---------------------- */
  async listPapers(creatorId?: number): Promise<Paper[]> {
    const query = creatorId ? `?creatorId=${creatorId}` : '';
    const data = await this.request<Paper[]>(`/api/papers${query}`);
    const mapped = data.map((p) => this.normalizePaper(p));
    this.papersCache = mapped;
    return mapped;
  }

  async getPaperDetail(paperId: number): Promise<Paper> {
    const data = await this.request<{ paper: any; items: any[] }>(`/api/papers/${paperId}`);
    const paper = this.normalizePaper(data.paper);
    const items = this.normalizePaperItems(data.items);
    paper.items = items;
    paper.questions = items;
    return paper;
  }

  async createPaper(payload: { paperName: string; draft?: boolean; rules: PaperRule[] }): Promise<Paper> {
    const creatorId = this.requireLogin();
    const data = await this.request<Paper>('/api/papers', {
      method: 'POST',
      body: JSON.stringify({
        ...payload,
        creatorId,
      }),
    });
    const paper = this.normalizePaper(data);
    this.papersCache.unshift(paper);
    return paper;
  }

  async autoAssemblePaper(paperId: number, rules: PaperRule[]): Promise<Paper> {
    const data = await this.request<Paper>(`/api/papers/${paperId}/auto-assemble`, {
      method: 'POST',
      body: JSON.stringify({ rules }),
    });
    const paper = this.normalizePaper(data);
    this.papersCache = this.papersCache.map((p) => (p.paperId === paper.paperId ? paper : p));
    return paper;
  }

  async updatePaperQuestions(paperId: number, items: PaperQuestionItem[], draft?: boolean): Promise<Paper> {
    const data = await this.request<Paper>(`/api/papers/${paperId}/questions`, {
      method: 'POST',
      body: JSON.stringify({ draft, items }),
    });
    const paper = this.normalizePaper(data);
    this.papersCache = this.papersCache.map((p) => (p.paperId === paper.paperId ? paper : p));
    return paper;
  }

  /* ---------------------- Mock-based exam module (unchanged) ---------------------- */
  async getExams(status?: string) {
    let result = this.exams;
    if (status) {
      result = result.filter((e) => e.status === status);
    }
    return result.map((e) => ({
      ...e,
      paper: this.papersCache.find((p) => p.paperId === e.paperId) || MOCK_PAPERS.find((p) => p.paperId === e.paperId),
    }));
  }

  async getPapers(): Promise<Paper[]> {
    if (this.papersCache.length === 0) {
      try {
        await this.listPapers();
      } catch {
        this.papersCache = [...MOCK_PAPERS];
      }
    }
    return this.papersCache;
  }

  async createExam(exam: any) {
    const newExam = { ...exam, examId: Date.now() };
    this.exams.push(newExam);
    return newExam;
  }

  async updateExam(exam: any) {
    const index = this.exams.findIndex((e) => e.examId === exam.examId);
    if (index !== -1) {
      this.exams[index] = { ...exam };
      return this.exams[index];
    }
    throw new Error('Exam not found');
  }

  async deleteExam(examId: number) {
    this.exams = this.exams.filter((e) => e.examId !== Number(examId));
  }

  async getUngradedAnswers(): Promise<StudentAnswer[]> {
    return this.answers.filter((a) => !a.isGraded);
  }

  async gradeAnswer(answerId: number, score: number): Promise<void> {
    const ans = this.answers.find((a) => a.answerId === answerId);
    if (ans) {
      ans.obtainedScore = score;
      ans.isGraded = true;
      const record = this.scores.find((s) => s.examId === ans.examId && s.studentId === ans.studentId);
      if (record) {
        const allExamAnswers = this.answers.filter((a) => a.examId === ans.examId && a.studentId === ans.studentId);
        record.totalScore = allExamAnswers.reduce((sum, a) => sum + (a.obtainedScore || 0), 0);
      }
    }
  }

  async getMyExams() {
    return this.exams.filter((e) => e.status === 'Active');
  }

  async getExamDetails(examId: number) {
    const exam = this.exams.find((e) => e.examId === examId);
    if (!exam) return undefined;
    const paper = this.papersCache.find((p) => p.paperId === exam.paperId);
    return { ...exam, paper };
  }

  async submitExamAnswers(examId: number, answers: { questionId: number; response: string }[]): Promise<void> {
    answers.forEach((ans) => {
      this.answers.push({
        answerId: Math.floor(Math.random() * 100000),
        examId,
        studentId: this.currentUser?.id || 0,
        questionId: ans.questionId,
        studentResponse: ans.response,
        isGraded: true,
        obtainedScore: 0,
      });
    });
  }

  async getMyScores(): Promise<ScoreRecord[]> {
    return this.scores.filter((s) => s.studentId === this.currentUser?.id);
  }

  async getExamStats() {
    return Array.from({ length: 20 }, () => Math.floor(Math.random() * 100));
  }

  async getStudentExamResult(examId: number) {
    const exam = await this.getExamDetails(examId);
    if (!exam || !this.currentUser) return null;
    const answers = this.answers.filter((a) => a.examId === examId && a.studentId === this.currentUser?.id);
    const scoreRecord = this.scores.find((s) => s.examId === examId && s.studentId === this.currentUser?.id);
    return { exam, answers, scoreRecord };
  }
}

export const api = new ApiService();
