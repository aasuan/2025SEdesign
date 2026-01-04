import {
  ApiResponse,
  Difficulty,
  Paper,
  PaperQuestionItem,
  PaperRule,
  Exam,
  ExamParticipant,
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

  // Legacy mock stores (used only as fallbacks for non-implemented modules)
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
    const toNumberArray = (val: any): number[] => {
      if (Array.isArray(val)) {
        return val.map((v) => Number(v)).filter((v) => !Number.isNaN(v));
      }
      if (typeof val === 'string') {
        return val
          .split(/[;,]/)
          .map((v) => Number(v.trim()))
          .filter((v) => !Number.isNaN(v));
      }
      return [];
    };

    const toStringArray = (val: any): string[] => {
      if (Array.isArray(val)) {
        return val.map((v) => String(v)).filter((v) => v.trim().length > 0);
      }
      if (typeof val === 'string') {
        return val
          .split(/[;,]/)
          .map((v) => v.trim())
          .filter((v) => v.length > 0);
      }
      return [];
    };

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
      tagIds: toNumberArray(raw.tagIds),
      tagNames: toStringArray(raw.tagNames),
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

  private normalizeExam(raw: any): Exam {
    return {
      examId: Number(raw.examId ?? raw.id),
      paperId: Number(raw.paperId),
      examName: raw.examName ?? raw.name,
      startTime: raw.startTime ?? raw.start_time,
      endTime: raw.endTime ?? raw.end_time,
      durationMinutes: Number(raw.durationMinutes ?? raw.duration_minutes ?? 0),
      proctorId: Number(raw.proctorId ?? 0),
      status: (raw.status ?? 'Pending') as Exam['status'],
      paper: this.papersCache.find((p) => p.paperId === Number(raw.paperId)),
    };
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

  async updateUserProfile(payload: { realName?: string; email?: string; phone?: string }): Promise<UserProfile> {
    try {
      const data = await this.request<UserProfile>('/api/profile/basic', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      this.currentUser = data;
      return data;
    } catch (e) {
      // fallback: merge locally to避免前端报错
      const merged = { ...(this.currentUser as any), ...payload } as UserProfile;
      this.currentUser = merged;
      return merged;
    }
  }

  async uploadFaceImage(faceImage: string): Promise<UserProfile> {
    const data = await this.request<UserProfile>('/api/profile/face-image', {
      method: 'POST',
      body: JSON.stringify({ faceImage }),
    });
    this.currentUser = data;
    return data;
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
    tagIds?: number[];
    page?: number;
    size?: number;
  }): Promise<Question[]> {
    const search = new URLSearchParams();
    if (params?.keyword) search.set('keyword', params.keyword);
    if (params?.type) search.set('type', params.type);
    if (params?.difficulty) search.set('difficulty', params.difficulty);
    if (params?.tagIds && params.tagIds.length) search.set('tagIds', params.tagIds.join(','));
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

  /* ---------------------- Exams (backend) ---------------------- */
  async getExams(status?: string): Promise<Exam[]> {
    const search = status ? `?status=${encodeURIComponent(status)}` : '';
    try {
      const data = await this.request<Exam[]>(`/api/exams${search}`);
      // Ensure papers are cached for display
      if (this.papersCache.length === 0) {
        try {
          await this.listPapers();
        } catch {
          /* ignore cache warm failure */
        }
      }
      return data.map((e) => this.normalizeExam(e));
    } catch {
      // fallback to mock
      let result = this.exams;
      if (status) {
        result = result.filter((e) => e.status === status);
      }
      return result.map((e) => ({
        ...e,
        paper: this.papersCache.find((p) => p.paperId === e.paperId) || MOCK_PAPERS.find((p) => p.paperId === e.paperId),
      }));
    }
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

  async createExam(exam: Partial<Exam>) {
    const payload = { ...exam };
    const data = await this.request<Exam>('/api/exams', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const normalized = this.normalizeExam(data);
    return normalized;
  }

  async updateExam(exam: Partial<Exam> & { examId: number }) {
    const payload = { ...exam };
    const data = await this.request<Exam>(`/api/exams/${exam.examId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return this.normalizeExam(data);
  }

  async deleteExam(examId: number) {
    // backend无删除接口，用取消替代
    await this.request<Exam>(`/api/exams/${examId}/cancel`, { method: 'POST' });
  }

  async setExamParticipants(examId: number, studentIds: number[]) {
    return this.request<void>(`/api/exams/${examId}/participants`, {
      method: 'POST',
      body: JSON.stringify({ studentIds }),
    });
  }

  async getExamParticipants(examId: number): Promise<ExamParticipant[]> {
    try {
      const data = await this.request<any[]>(`/api/exams/${examId}/participants`);
      return (data || []).map((p) => ({
        studentId: Number(p.studentId ?? p.student_id),
        username: p.username,
        realName: p.realName ?? p.real_name,
        joinStatus: p.joinStatus ?? p.join_status,
        joinTime: p.joinTime ?? p.join_time,
        submitTime: p.submitTime ?? p.submit_time,
        status: (p.joinStatus ?? p.join_status) || undefined,
        submitted: (() => {
          const raw = (p.joinStatus ?? p.join_status ?? '') as string;
          return raw.toLowerCase() === 'submitted' || Boolean(p.submitTime ?? p.submit_time);
        })(),
      }));
    } catch {
      return [];
    }
  }

  async searchUsers(keyword: string, limit = 20): Promise<UserProfile[]> {
    const query = new URLSearchParams();
    if (keyword) query.set('keyword', keyword);
    if (limit) query.set('limit', String(limit));
    return this.request<UserProfile[]>(`/api/users?${query.toString()}`);
  }

  async getPortalExams(): Promise<Exam[]> {
    const data = await this.request<Array<{ exam: any; participant: any }>>('/api/portal/exams');
    if (!Array.isArray(data)) return [];
    return data.map((row) => {
      const exam = this.normalizeExam(row.exam || row);
      const participant = row.participant || {};
      (exam as any).participant = participant;
      (exam as any).joinStatus = participant.joinStatus ?? participant.join_status;
      return exam;
    });
  }

  async verifyFace(examId: number, capturedImage: string) {
    return this.request<void>(`/api/portal/exams/${examId}/face-verify`, {
      method: 'POST',
      body: JSON.stringify({ capturedImage }),
    });
  }

  /* ---------------------- Proctor / Alerts ---------------------- */
  async triggerManualVerify(examId: number, notes?: string) {
    return this.request<void>(`/api/proctor/commands/manual-verify?examId=${examId}`, {
      method: 'POST',
      body: notes ? JSON.stringify({ notes }) : undefined,
    });
  }

  async listProctorAlerts(examId: number) {
    return this.request<ProctorAlert[]>(`/api/proctor/alerts?examId=${examId}`);
  }

  async warnAlert(alertId: number, notes?: string) {
    return this.request<ProctorAlert>(`/api/proctor/alerts/${alertId}/warn`, {
      method: 'POST',
      body: notes ? JSON.stringify({ notes }) : undefined,
    });
  }

  async forceSubmitAlert(alertId: number, notes?: string) {
    return this.request<ProctorAlert>(`/api/proctor/alerts/${alertId}/force-submit`, {
      method: 'POST',
      body: notes ? JSON.stringify({ notes }) : undefined,
    });
  }

  async pollProctorCommands(examId: number, studentId: number) {
    return this.request<ProctorCommand[]>(`/api/proctor/commands?examId=${examId}&studentId=${studentId}`);
  }

  async markCommandDelivered(cmdId: number) {
    return this.request<void>(`/api/proctor/commands/${cmdId}/delivered`, { method: 'POST' });
  }

  async enterPortalExam(examId: number) {
    const data = await this.request<{ exam: any; participant: any }>(`/api/portal/exams/${examId}/enter`, {
      method: 'POST',
    });
    return {
      exam: this.normalizeExam(data.exam),
      participant: data.participant,
    };
  }

  async getPortalQuestions(examId: number) {
    const data = await this.request<any[]>(`/api/portal/exams/${examId}/questions`);
    return data || [];
  }

  async savePortalAnswer(examId: number, payload: { questionId: number; studentResponse: string }) {
    return this.request(`/api/portal/exams/${examId}/answers`, {
      method: 'POST',
      body: JSON.stringify({ ...payload, saveTime: new Date().toISOString() }),
    });
  }

  async submitPortalExam(examId: number) {
    return this.request(`/api/portal/exams/${examId}/submit`, { method: 'POST' });
  }

  async getMyExams(): Promise<Exam[]> {
    return this.getPortalExams();
  }

  async getExamDetails(examId: number): Promise<Exam | undefined> {
    try {
      const data = await this.request<Exam>(`/api/exams/${examId}`);
      const exam = this.normalizeExam(data);
      if (!exam.paper && exam.paperId) {
        try {
          exam.paper = await this.getPaperDetail(exam.paperId);
        } catch {
          /* ignore paper fetch failure */
        }
      }
      return exam;
    } catch {
      const exam = this.exams.find((e) => e.examId === examId);
      if (!exam) return undefined;
      const paper = this.papersCache.find((p) => p.paperId === exam.paperId);
      return { ...exam, paper };
    }
  }

  async getUngradedAnswers(examId?: number): Promise<StudentAnswer[]> {
    try {
      const query = examId ? `?examId=${examId}` : '';
      const data = await this.request<any[]>(`/api/grading/ungraded${query}`);
      return (data || []).map((row) => {
        const q = row.question
          ? this.normalizeQuestion(row.question)
          : row.questionId
          ? this.normalizeQuestion({
              questionId: row.questionId,
              questionType: row.questionType || row.question_type,
              difficulty: row.difficulty,
              content: row.content,
              options: row.options,
              answer: row.answer,
              defaultScore: row.defaultScore ?? row.default_score,
            })
          : undefined;
        return {
          answerId: Number(row.answerId ?? row.answer_id),
          examId: Number(row.examId ?? row.exam_id),
          studentId: Number(row.studentId ?? row.student_id),
          questionId: Number(row.questionId ?? row.question_id),
          studentResponse: row.studentResponse ?? row.student_response ?? '',
          isGraded: row.graded ?? row.isGraded ?? row.is_graded ?? false,
          obtainedScore: Number(row.obtainedScore ?? row.obtained_score ?? 0),
          graderId: row.graderId ?? row.grader_id,
          gradeTime: row.gradeTime ?? row.grade_time,
          questionScore: Number(row.questionScore ?? row.question_score ?? q?.defaultScore ?? 0),
          question: q,
        };
      });
    } catch {
      return this.answers.filter((a) => !a.isGraded);
    }
  }

  async gradeAnswer(answerId: number, score: number, examId?: number, comment?: string): Promise<void> {
    if (!examId) {
      throw new Error('缺少考试ID，无法提交评分');
    }
    await this.request(`/api/grading/answers/${answerId}/grade`, {
      method: 'POST',
      body: JSON.stringify({ score, comment: comment?.trim() || undefined, examId }),
    });
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

  async getMyScores(): Promise<{ records: ScoreRecord[]; summary: any }> {
    const data = await this.request<{ records: ScoreRecord[]; summary: any }>('/api/scores/me');
    return data;
  }

  async getExamStats() {
    return Array.from({ length: 20 }, () => Math.floor(Math.random() * 100));
  }

  async getStudentExamResult(examId: number) {
    try {
      const data = await this.request<{ exam: any; paper: any; answers: any[]; scoreRecord: any }>(
        `/api/scores/me/detail?examId=${examId}`,
        { method: 'GET' },
      );
      const exam = this.normalizeExam(data.exam);
      let paper = data.paper;
      if (paper) {
        paper.questions = (paper.questions || paper.items || []).map((it: any) => ({
          ...it,
          question: it.question ? this.normalizeQuestion(it.question) : undefined,
        }));
        paper.items = paper.questions;
      } else if (exam.paperId) {
        try {
          paper = await this.getPaperDetail(exam.paperId);
        } catch {
          paper = undefined;
        }
      }
      const answers = (data.answers || []).map((a) => ({
        answerId: a.answerId ?? a.answer_id,
        examId: a.examId ?? a.exam_id,
        studentId: a.studentId ?? a.student_id,
        questionId: a.questionId ?? a.question_id,
        studentResponse: a.studentResponse ?? a.student_response,
        isGraded: a.isGraded ?? a.is_graded ?? false,
        obtainedScore: a.obtainedScore ?? a.obtained_score ?? 0,
        graderId: a.graderId ?? a.grader_id,
        gradeTime: a.gradeTime ?? a.grade_time,
        questionScore: a.questionScore ?? a.question_score ?? a.question?.defaultScore,
        question: a.question ? this.normalizeQuestion(a.question) : undefined,
      })) as any[];
      const scoreRecord = data.scoreRecord
        ? {
            recordId: data.scoreRecord.recordId ?? data.scoreRecord.record_id,
            examId: data.scoreRecord.examId ?? data.scoreRecord.exam_id,
            studentId: data.scoreRecord.studentId ?? data.scoreRecord.student_id,
            paperId: data.scoreRecord.paperId ?? data.scoreRecord.paper_id,
            totalScore: Number(data.scoreRecord.totalScore ?? data.scoreRecord.total_score ?? 0),
            isFinal: !!(data.scoreRecord.isFinal ?? data.scoreRecord.is_final),
            ranking: data.scoreRecord.ranking,
          }
        : undefined;
      return { exam: { ...exam, paper }, answers, scoreRecord };
    } catch (err) {
      throw err;
    }
  }
}

export const api = new ApiService();
