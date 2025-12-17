# 智慧考试系统 (IEXS)

基于 **Spring Boot 2.7.14** + MyBatis + Redis + MySQL 的智慧考试系统

## 技术栈

- **后端框架**: Spring Boot 2.7.14（内嵌Tomcat）
- **ORM框架**: MyBatis 3.5.x
- **数据库**: MySQL 8.0
- **连接池**: Druid 1.2.18
- **缓存**: Redis (Jedis 4.3.1)
- **构建工具**: Maven
- **JDK版本**: 11

## 功能特性（MVP版本）

### 学生功能
- ✅ 用户注册
- ✅ 用户登录
- ✅ 查看可参加的考试
- ✅ 参加考试
- ✅ 在线答题
- ✅ 提交答案
- ✅ 交卷

### 老师功能
- ✅ 用户注册/登录
- ✅ 手动录入题目（单选、多选、判断、简答）
- ✅ 创建考试
- ✅ 设置考场（选择题目）
- ✅ 查看自己创建的考试

## 项目结构

```
IEXS/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── org/example/
│   │   │       ├── controller/      # 控制器层
│   │   │       ├── entity/          # 实体类
│   │   │       ├── mapper/          # Mapper接口
│   │   │       ├── service/         # Service层
│   │   │       └── util/            # 工具类
│   │   ├── resources/
│   │   │   ├── mapper/              # MyBatis XML映射文件
│   │   │   ├── sql/                 # 数据库初始化脚本
│   │   │   ├── applicationContext.xml
│   │   │   ├── spring-mvc.xml
│   │   │   ├── mybatis-config.xml
│   │   │   ├── db.properties
│   │   │   └── log4j.properties
│   │   └── webapp/
│   │       └── WEB-INF/
│   │           └── web.xml
│   └── test/
└── pom.xml
```

## 环境准备

### 1. 安装MySQL数据库

确保MySQL已安装并运行，然后执行数据库初始化脚本：

```bash
# 连接到MySQL
mysql -u root -p

# 执行初始化脚本
source src/main/resources/sql/init.sql
```

或者在MySQL客户端中直接执行 `src/main/resources/sql/init.sql` 文件。

### 2. 安装Redis

确保Redis已安装并运行：

```bash
# Windows: 下载Redis for Windows并启动redis-server.exe
# Linux/Mac: 
redis-server
```

### 3. 配置数据库连接

编辑 `src/main/resources/db.properties`，修改数据库连接信息：

```properties
jdbc.url=jdbc:mysql://localhost:3306/iexs?useUnicode=true&characterEncoding=utf8&useSSL=false&serverTimezone=Asia/Shanghai
jdbc.username=root
jdbc.password=你的密码
```

### 4. 配置Redis连接

编辑 `src/main/resources/db.properties`，修改Redis连接信息（如需要）：

```properties
redis.host=localhost
redis.port=6379
redis.password=
```

## 运行项目

### 方式一：IDEA直接运行（推荐）⭐

1. 在IDEA中打开项目
2. 等待Maven依赖下载完成
3. 找到 `src/main/java/org/example/IexsApplication.java`
4. 右键选择 `Run 'IexsApplication.main()'`
5. 看到启动成功信息即可

### 方式二：Maven命令运行

```bash
# 在项目根目录执行
mvn spring-boot:run
```

### 方式三：打包为JAR运行

```bash
# 打包
mvn clean package

# 运行jar包
java -jar target/IEXS.jar
```

**注意：** Spring Boot使用内嵌Tomcat，无需外部容器！

## API接口文档

### 用户相关

#### 1. 用户注册
- **URL**: `POST /api/user/register`
- **请求体**:
```json
{
  "username": "student1",
  "password": "123456",
  "realName": "学生1",
  "email": "student1@example.com",
  "role": 0
}
```

#### 2. 用户登录
- **URL**: `POST /api/user/login`
- **请求体**:
```json
{
  "username": "student",
  "password": "student123"
}
```

#### 3. 获取当前用户信息
- **URL**: `GET /api/user/info`
- **需要登录**

### 题目相关（老师）

#### 1. 添加题目
- **URL**: `POST /api/question/add`
- **需要老师权限**
- **请求体**:
```json
{
  "title": "Java中String类是final的吗？",
  "type": "judge",
  "optionA": "是",
  "optionB": "否",
  "correctAnswer": "A",
  "score": 5,
  "difficulty": 1
}
```

#### 2. 查询题目列表
- **URL**: `GET /api/question/list`
- **需要老师权限**

### 考试相关

#### 1. 创建考试（老师）
- **URL**: `POST /api/exam/create`
- **需要老师权限**
- **请求体**:
```json
{
  "examName": "Java基础测试",
  "description": "测试Java基础知识",
  "duration": 60,
  "totalScore": 100,
  "startTime": 1704067200000,
  "endTime": 1704153600000,
  "questionIds": [1, 2, 3]
}
```

#### 2. 查看可参加的考试（学生）
- **URL**: `GET /api/exam/available`

### 考场相关（学生）

#### 1. 参加考试
- **URL**: `POST /api/examRoom/join`
- **请求体**:
```json
{
  "examId": 1
}
```

#### 2. 开始答题
- **URL**: `POST /api/examRoom/start/{examRoomId}`

#### 3. 获取题目列表
- **URL**: `GET /api/examRoom/questions/{examRoomId}`

#### 4. 提交答案
- **URL**: `POST /api/examRoom/submitAnswer`
- **请求体**:
```json
{
  "examRoomId": 1,
  "questionId": 1,
  "answer": "A"
}
```

#### 5. 交卷
- **URL**: `POST /api/examRoom/submit/{examRoomId}`

## 测试账号

数据库初始化脚本中已经创建了测试账号：

- **管理员**: username: `admin`, password: `admin123`
- **老师**: username: `teacher`, password: `teacher123`
- **学生**: username: `student`, password: `student123`

## 注意事项

1. **密码加密**: 当前版本密码为明文存储，生产环境应使用加密（如BCrypt）
2. **Session管理**: 当前使用HttpSession，可考虑使用Redis存储Session
3. **异常处理**: 建议添加全局异常处理器
4. **参数校验**: 建议添加参数校验（如使用Hibernate Validator）
5. **跨域处理**: 如需前后端分离，需要配置CORS

## 后续开发建议

- [ ] 添加密码加密功能
- [ ] 实现JWT或Token认证
- [ ] 添加全局异常处理
- [ ] 添加参数校验
- [ ] 实现文件上传（题目图片等）
- [ ] 添加考试倒计时功能
- [ ] 实现自动阅卷优化
- [ ] 添加成绩统计功能
- [ ] 实现考试防作弊功能
- [ ] 添加消息通知功能

## 开发工具推荐

- **IDEA**: IntelliJ IDEA Ultimate/Community
- **数据库工具**: Navicat, DBeaver, DataGrip
- **API测试**: Postman, Apifox
- **Redis工具**: Redis Desktop Manager

## 许可证

本项目仅用于学习交流。

