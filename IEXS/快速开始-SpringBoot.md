# Spring Boot 版本快速开始指南

## 第一步：环境准备

### 1. 安装MySQL
- 下载并安装MySQL 8.0
- 启动MySQL服务
- 使用root账号登录

### 2. 安装Redis（可选）
- Windows: 下载Redis for Windows，解压后运行 `redis-server.exe`
- Linux: `sudo apt-get install redis-server`
- Mac: `brew install redis` 然后 `brew services start redis`

**注意：** 如果未安装Redis，系统仍可正常运行（只是无法使用Redis缓存功能）

### 3. 配置数据库
编辑 `src/main/resources/application.yml`，修改数据库密码：

```yaml
spring:
  datasource:
    username: root
    password: 你的MySQL密码
```

## 第二步：初始化数据库

1. 打开MySQL客户端（命令行或Navicat等工具）
2. 执行 `src/main/resources/sql/init.sql` 文件
   - 命令行方式：`mysql -u root -p < src/main/resources/sql/init.sql`
   - 或在MySQL客户端中直接复制粘贴SQL内容执行

这将创建：
- 数据库 `iexs`
- 6张数据表
- 3个测试账号（admin/teacher/student）

## 第三步：启动项目

### 方式一：使用IDEA（最简单）⭐

1. **打开项目**
   - File -> Open -> 选择 `IEXS` 目录

2. **等待Maven下载依赖**
   - IDEA会自动识别pom.xml并下载依赖
   - 底部状态栏会显示下载进度

3. **直接运行**
   - 找到 `src/main/java/org/example/IexsApplication.java`
   - 右键点击 -> `Run 'IexsApplication.main()'`
   - 或点击类名旁边的绿色运行按钮

4. **查看启动日志**
   - 控制台会显示启动信息
   - 看到 "智慧考试系统启动成功！" 即可

### 方式二：使用Maven命令

```bash
# 进入项目目录
cd IEXS

# 运行（会自动编译）
mvn spring-boot:run
```

### 方式三：打包运行

```bash
# 打包
mvn clean package

# 运行jar包
java -jar target/IEXS.jar
```

**启动成功后访问：**
- 测试页面：http://localhost:8080/index.html
- Druid监控：http://localhost:8080/druid（用户名：admin，密码：admin123）
- API接口：http://localhost:8080/api/user/info

## 第四步：测试系统

### 方法1：使用测试页面（推荐）
访问 http://localhost:8080/index.html

### 方法2：使用Postman/Apifox

#### 1. 学生登录
```
POST http://localhost:8080/api/user/login
Content-Type: application/json

{
  "username": "student",
  "password": "student123"
}
```

#### 2. 查看可参加的考试
```
GET http://localhost:8080/api/exam/available
```

#### 3. 老师登录后添加题目
```
POST http://localhost:8080/api/user/login
{
  "username": "teacher",
  "password": "teacher123"
}

POST http://localhost:8080/api/question/add
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

## Spring Boot 特性

### ✅ 自动配置
- 无需配置Tomcat，内嵌服务器自动启动
- 数据源自动配置
- MyBatis自动集成

### ✅ 简化配置
- 所有配置集中在 `application.yml`
- 无需 `web.xml`
- 无需复杂的XML配置

### ✅ 开发工具
- 热部署支持（修改代码自动重启）
- 丰富的监控端点
- 更好的日志配置

### ✅ 生产就绪
- 打包为独立jar文件
- 一键部署
- 内嵌Tomcat，无需外部容器

## 常见问题

### 1. 端口被占用
**解决方案：** 修改 `application.yml`：
```yaml
server:
  port: 8081  # 改为其他端口
```

### 2. 数据库连接失败
**解决方案：** 
- 检查MySQL服务是否启动
- 检查 `application.yml` 中的数据库配置
- 确认数据库已创建（执行init.sql）

### 3. Redis连接失败
**解决方案：**
- 如果未安装Redis，可以注释掉Redis相关配置
- 或在 `application.yml` 中配置正确的Redis地址

### 4. Maven依赖下载失败
**解决方案：**
- 检查网络连接
- 配置Maven镜像（推荐阿里云镜像）
- File -> Settings -> Build -> Build Tools -> Maven

### 5. 编译错误
**解决方案：**
- 确保JDK版本是11
- File -> Project Structure -> Project SDK 选择JDK 11
- 清理并重新构建：Build -> Rebuild Project

### 6. 热部署不生效
**解决方案：**
1. IDEA：`File` -> `Settings` -> `Build` -> `Compiler` -> 勾选 `Build project automatically`
2. IDEA：`Ctrl+Shift+A` -> 搜索 `Registry` -> 勾选 `compiler.automake.allow.when.app.running`

## 测试账号

| 角色   | 用户名    | 密码        |
|--------|-----------|-------------|
| 管理员 | admin     | admin123    |
| 老师   | teacher   | teacher123  |
| 学生   | student   | student123  |

## 监控和管理

### Druid监控页面
- 地址：http://localhost:8080/druid
- 用户名：admin
- 密码：admin123
- 功能：SQL监控、连接池监控、Web应用监控

## 下一步

1. 熟悉Spring Boot自动配置
2. 查看 `Spring Boot迁移说明.md` 了解详细变化
3. 使用Postman测试各个API接口
4. 根据需要扩展功能

## 需要帮助？

- 查看 `README.md` 了解完整功能
- 查看 `Spring Boot迁移说明.md` 了解技术细节
- 检查日志文件：`logs/iexs.log`
- 查看启动日志中的错误信息

