# IEXSYS Apifox 接口测试文档

本文档基于当前项目代码整理，格式参照《测试指南》第 3 部分“在 Apifox 中测试接口”，用于在 Apifox 中快速创建接口集合并验证后端功能。

## 一、创建项目与环境

1. 打开 Apifox，点击`新建项目`，命名为`IEXSYS 接口测试`，确认创建。
2. 左下角点击`环境管理`，新增环境`本地`，添加变量：
   - `baseUrl`：`http://localhost:8080`
3. 保存后将`本地`设为当前环境。

## 二、通用响应格式

所有接口返回统一结构：

```json
{
  "code": 0,
  "message": "success",
  "data": { ... }
}
```

- `code`：0 表示成功，非 0 为失败（如 401 未登录、404 未找到等）。
- `message`：人类可读的提示信息。
- `data`：实际业务数据。

## 三、认证模块（文件夹：认证相关）

### 1. 用户注册

- **请求方法**：POST  
- **URL**：`{{baseUrl}}/api/auth/register`
- **Headers**：`Content-Type: application/json`
- **Body（raw / JSON）**：

```json
{
  "username": "testuser",
  "password": "123456",
  "realName": "测试用户",
  "email": "test@example.com",
  "phone": "13800138000"
}
```

- **说明**：username 2-16 字符、password 6-24 字符。注册成功后会自动写入 Session。
- **成功响应示例**：

```json
{
  "code": 0,
  "message": "注册成功",
  "data": {
    "id": 1,
    "username": "testuser",
    "realName": "测试用户",
    "email": "test@example.com",
    "phone": "13800138000",
    "userRole": "学生",
    "status": "Active"
  }
}
```

### 2. 用户登录

- **请求方法**：POST  
- **URL**：`{{baseUrl}}/api/auth/login`
- **Headers**：`Content-Type: application/json`
- **Body**：

```json
{
  "username": "testuser",
  "password": "123456"
}
```

- **提示**：成功后 Apifox 会自动保存 Cookie（Session），后续接口会自动携带。

### 3. 获取当前用户

- **请求方法**：GET  
- **URL**：`{{baseUrl}}/api/auth/me`
- **说明**：需先完成登录，返回当前 Session 中的用户信息。

### 4. 退出登录

- **请求方法**：POST  
- **URL**：`{{baseUrl}}/api/auth/logout`
- **说明**：清除 Session。

### 5. 绑定手机号

- **请求方法**：POST  
- **URL**：`{{baseUrl}}/api/auth/bind-phone`
- **Headers**：`Content-Type: application/json`
- **Body**：

```json
{
  "phone": "13800138001",
  "code": "123456",
  "wxOpenId": "wx-open-id-optional"
}
```

- **说明**：需已登录；`code`、`wxOpenId` 当前未做校验，可按需填写。

## 四、标签模块（文件夹：标签管理）

### 1. 查询标签列表

- **请求方法**：GET  
- **URL**：`{{baseUrl}}/api/tags`
- **Query 参数（可选）**：
  - `tagType`：按类型筛选，例如`subject`、`difficulty`等。
- **成功响应示例**：

```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "tagId": 1,
      "tagName": "单选题",
      "tagType": "questionType",
      "extraInfo": null,
      "createdAt": "2025-12-22T12:00:00",
      "updatedAt": "2025-12-22T12:00:00"
    }
  ]
}
```

### 2. 创建标签

- **请求方法**：POST  
- **URL**：`{{baseUrl}}/api/tags`
- **Headers**：`Content-Type: application/json`
- **Body**：

```json
{
  "tagName": "判断题",
  "tagType": "questionType",
  "extraInfo": "用于判断题分类"
}
```

- **说明**：`tagName` 需唯一。

## 五、题库模块（文件夹：题目管理）

### 1. 分页查询题目

- **请求方法**：GET  
- **URL**：`{{baseUrl}}/api/questions`
- **Query 参数**：
  - `type`（可选）：题型过滤，例如`single`、`multiple`、`judge`
  - `difficulty`（可选）：难度过滤，例如`easy`、`medium`、`hard`
  - `keyword`（可选）：按内容模糊搜索
  - `page`：页码，默认 1
  - `size`：每页数量，默认 10
- **响应数据**：`list`（题目数组）、`total`、`page`、`size`。

### 2. 创建题目

- **请求方法**：POST  
- **URL**：`{{baseUrl}}/api/questions`
- **Headers**：`Content-Type: application/json`
- **Body**：

```json
{
  "creatorId": 1,
  "questionType": "single",
  "difficulty": "easy",
  "content": "下列哪一项是 JVM 语言？",
  "options": "{\"A\":\"Java\",\"B\":\"C\",\"C\":\"Python\",\"D\":\"Go\"}",
  "answer": "A",
  "defaultScore": 5,
  "tagIds": [1, 2]
}
```

- **说明**：`creatorId` 必填；`options` 为 JSON 字符串；未填写 `defaultScore` 时默认 5 分。
----------------------------------------------------------------------------------------------------

### 3. 更新题目

- **请求方法**：PUT  
- **URL**：`{{baseUrl}}/api/questions/{id}`
- **Body**：与创建一致，`id` 为路径参数。

### 4. 删除题目

- **请求方法**：DELETE  
- **URL**：`{{baseUrl}}/api/questions/{id}`
- **说明**：逻辑删除（停用）。

### 5. 获取题目详情

- **请求方法**：GET  
- **URL**：`{{baseUrl}}/api/questions/{id}`

## 六、试卷模块（文件夹：试卷管理）

### 1. 创建并自动组卷

- **请求方法**：POST  
- **URL**：`{{baseUrl}}/api/papers`
- **Headers**：`Content-Type: application/json`
- **Body**：

```json
{
  "paperName": "期末考试 A 卷",
  "creatorId": 1,
  "draft": true,
  "rules": [
    {
      "questionType": "single",
      "count": 5,
      "scorePerQuestion": 2
    },
    {
      "questionType": "judge",
      "count": 3,
      "scorePerQuestion": 1
    }
  ]
}
```

- **说明**：按规则随机抽题，若题库数量不足会返回错误。

### 2. 按新规则重新自动组卷

- **请求方法**：POST  
- **URL**：`{{baseUrl}}/api/papers/{id}/auto-assemble`
- **Body**：同上 `rules` 结构。

### 3. 手动调整试卷题目

- **请求方法**：POST  
- **URL**：`{{baseUrl}}/api/papers/{id}/questions`
- **Body**：

```json
{
  "draft": false,
  "items": [
    { "questionId": 10, "questionScore": 2, "sequenceNum": 1 },
    { "questionId": 11, "questionScore": 3, "sequenceNum": 2 }
  ]
}
```

- **说明**：完全替换当前试卷的题目列表并重新累计总分。

### 4. 查看试卷详情

- **请求方法**：GET  
- **URL**：`{{baseUrl}}/api/papers/{id}`
- **响应数据**：`paper`（试卷基础信息），`items`（题目明细列表）。

### 5. 按创建人查询试卷列表

- **请求方法**：GET  
- **URL**：`{{baseUrl}}/api/papers`
- **Query 参数**：`creatorId`（可选，按创建人过滤）

---

完成上述接口配置后，可在 Apifox 中按“注册 → 登录 → 业务接口 → 退出登录”的顺序批量执行并验证返回结果。
