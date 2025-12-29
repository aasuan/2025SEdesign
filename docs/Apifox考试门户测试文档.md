# IEXSYS 考试管理与学生门户 Apifox 测试指引

> 适配当前后端 `/api` 路由（含 Exam 管理与 Portal 进入作答）。认证仍沿用 Session（JSESSIONID）。

## 1. 环境
- 环境变量：`baseUrl = http://localhost:8080`
- 先通过 `/api/auth/register` 或 `/api/auth/login` 获取 Session（Apifox 自动存 Cookie）。

## 2. 通用响应
```json
{
  "code": 0,
  "message": "success",
  "data": {}
}
```
- `code != 0` 表示失败（401/404/业务错误等）。

## 3. 考试管理（Exam，需登录且具备管理身份）提供apifox测试文档，放在docs文件夹内
### 3.1 创建考试
- 方法：POST `{{baseUrl}}/api/exams`
- Headers：`Content-Type: application/json`
- Body：
```json
{
  "paperId": 1,
  "examName": "期末考试A卷",
  "startTime": "2025-12-31T09:00:00",
  "endTime": "2025-12-31T11:00:00",
  "durationMinutes": 120,
  "proctorId": 2,
  "status": "Pending",
  "antiCheatSettings": "{\"faceCheck\":true}"
}
```

### 3.2 更新考试
- 方法：PUT `{{baseUrl}}/api/exams/{id}`
- Body 同创建；未提供的 status 继承原值。

### 3.3 查询考试
- 方法：GET `{{baseUrl}}/api/exams?status=Pending&startFrom=2025-12-30T00:00:00&startTo=2026-01-02T00:00:00`
- 方法：GET `{{baseUrl}}/api/exams/{id}`

### 3.4 考生名单
- 查看：GET `{{baseUrl}}/api/exams/{id}/participants`
- 导入/新增：POST `{{baseUrl}}/api/exams/{id}/participants`
```json
{ "studentIds": [3, 4, 5] }
```

### 3.5 发布 / 取消
- 发布：POST `{{baseUrl}}/api/exams/{id}/publish`
- 取消：POST `{{baseUrl}}/api/exams/{id}/cancel`

## 4. 学生考试门户（Portal，需已登录学生）
### 4.1 可参与考试列表
- GET `{{baseUrl}}/api/portal/exams`

### 4.2 进入考试
- POST `{{baseUrl}}/api/portal/exams/{id}/enter`
- 说明：校验时间窗口，状态为 Joined。

### 4.3 心跳
- POST `{{baseUrl}}/api/portal/exams/{id}/heartbeat`
- 说明：刷新在线时间，可用于切屏监测。

### 4.4 行为/异常事件上报
- POST `{{baseUrl}}/api/portal/exams/{id}/events`
```json
{
  "eventType": "tab-switch",
  "detail": "切出页面 5s",
  "occurredAt": "2025-12-31T09:30:00"
}
```

### 4.5 获取试题
- GET `{{baseUrl}}/api/portal/exams/{id}/questions`
- 返回：序号、分值、题干、选项，以及是否已答/已保存内容（不返回标准答案）。

### 4.6 保存作答
- POST `{{baseUrl}}/api/portal/exams/{id}/answers`
```json
{
  "questionId": 10,
  "studentResponse": "A",
  "saveTime": "2025-12-31T09:35:00"
}
```
- 说明：幂等 upsert，允许断点续答。

### 4.7 交卷
- POST `{{baseUrl}}/api/portal/exams/{id}/submit`
- 说明：标记 Submitted，不做自动阅卷（后续评分模块可扩展）。

## 5. 建议的 Apifox 调试顺序
1) 登录（/auth/login）→ 2) 管理端创建考试并发布 → 3) 导入考生 → 4) 学生端列出可参与考试 → 5) enter → 6) heartbeat → 7) questions → 8) answers（多题）→ 9) submit。

## 6. 已实现接口清单（考试与门户）
- 考试管理：`GET/POST /api/exams`，`GET/PUT /api/exams/{id}`，`GET/POST /api/exams/{id}/participants`，`POST /api/exams/{id}/publish`，`POST /api/exams/{id}/cancel`
- 门户：`GET /api/portal/exams`，`POST /api/portal/exams/{id}/enter`，`POST /api/portal/exams/{id}/heartbeat`，`POST /api/portal/exams/{id}/events`，`GET /api/portal/exams/{id}/questions`，`POST /api/portal/exams/{id}/answers`，`POST /api/portal/exams/{id}/submit`
