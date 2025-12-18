# Redis 安装和使用指南（Windows）

本项目使用 Redis 来存储 Session 数据。在 Windows 系统上，有以下几种方式使用 Redis：

## 方案一：使用内存 Session（临时方案，无需安装 Redis）⭐ 推荐用于快速测试

如果您只是想快速测试登录注册功能，可以暂时使用内存 Session，无需安装 Redis。

### 步骤：
1. 修改 `application.properties` 文件
2. 注释掉或删除 Redis 相关配置
3. 将 Session 存储类型改为 `none` 或使用默认的内存存储

**修改后的配置：**
```properties
# 注释掉 Redis 配置
# spring.data.redis.host=localhost
# spring.data.redis.port=6379
# spring.data.redis.database=0spring.application.name=IEXSYS

## Database
spring.datasource.url=jdbc:mysql://localhost:3306/online_exam_system?useUnicode=true&characterEncoding=utf-8&useSSL=false&serverTimezone=Asia/Shanghai
spring.datasource.username=root
spring.datasource.password=123456
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

## Session 配置（使用内存 Session，无需 Redis）
# 注释掉 Redis 配置，使用默认的内存 Session
# spring.data.redis.host=localhost
# spring.data.redis.port=6379
# spring.data.redis.database=0
# spring.session.store-type=redis
# spring.session.redis.namespace=iexsys:session
spring.session.timeout=30m

## MyBatis
mybatis.mapper-locations=classpath:mapper/*.xml
mybatis.type-aliases-package=org.exp.iexsys.domain
mybatis.configuration.map-underscore-to-camel-case=true

## Misc
server.port=8080
spring.jackson.time-zone=Asia/Shanghai

# 使用内存 Session（默认）
# spring.session.store-type=redis
```

或者直接删除 Redis 相关配置行，Spring Boot 会默认使用内存 Session。

**注意：** 使用内存 Session 时，应用重启后所有 Session 会丢失，用户需要重新登录。但对于开发测试来说完全够用。

---

## 方案二：使用 Docker（推荐）⭐ 推荐用于生产环境

如果您已经安装了 Docker Desktop，这是最简单的方式。

### 步骤：

1. **启动 Redis 容器**
   打开 PowerShell 或 CMD，执行：
   ```bash
   docker run -d --name redis-iexsys -p 6379:6379 redis:latest
   ```

2. **验证 Redis 是否运行**
   ```bash
   docker ps
   ```
   应该能看到 `redis-iexsys` 容器正在运行

3. **停止 Redis（需要时）**
   ```bash
   docker stop redis-iexsys
   ```

4. **启动已停止的 Redis**
   ```bash
   docker start redis-iexsys
   ```

5. **删除 Redis 容器（需要时）**
   ```bash
   docker stop redis-iexsys
   docker rm redis-iexsys
   ```

**优点：**
- 安装简单，一条命令即可
- 与 Linux 环境一致
- 易于管理和清理

---

## 方案三：使用 WSL（Windows Subsystem for Linux）

如果您已经安装了 WSL，可以在 WSL 中安装 Redis。

### 步骤：

1. **打开 WSL 终端**
   在开始菜单搜索 "Ubuntu" 或 "WSL"

2. **更新软件包列表**
   ```bash
   sudo apt update
   ```

3. **安装 Redis**
   ```bash
   sudo apt install redis-server -y
   ```

4. **启动 Redis 服务**
   ```bash
   sudo service redis-server start
   ```

5. **设置 Redis 开机自启（可选）**
   ```bash
   sudo systemctl enable redis-server
   ```

6. **验证 Redis 是否运行**
   ```bash
   redis-cli ping
   ```
   应该返回 `PONG`

**优点：**
- 使用官方 Redis
- 性能好
- 适合长期使用

---

## 方案四：使用 Memurai（Windows 原生 Redis）

Memurai 是 Windows 上的 Redis 兼容实现。

### 步骤：

1. **下载 Memurai**
   - 访问：https://www.memurai.com/get-memurai
   - 下载免费开发版

2. **安装 Memurai**
   - 运行安装程序
   - 按照向导完成安装

3. **启动 Memurai**
   - 安装后，Memurai 会作为 Windows 服务自动启动
   - 可以在 Windows 服务管理器中查看和管理

4. **验证是否运行**
   - 打开 PowerShell，执行：
   ```bash
   redis-cli ping
   ```
   如果返回 `PONG` 说明运行正常

**优点：**
- Windows 原生支持
- 作为系统服务运行
- 与 Redis 完全兼容

---

## 方案五：使用 Redis for Windows（不推荐）

**注意：** 官方 Redis 不支持 Windows，但有一些第三方编译版本。这些版本可能不稳定，不推荐用于生产环境。

如果您仍想使用，可以搜索 "Redis for Windows" 或 "Memurai"（推荐使用 Memurai）。

---

## 验证 Redis 连接

无论使用哪种方案，都可以通过以下方式验证 Redis 是否正常工作：

### 方法 1：使用 redis-cli（如果已安装）
```bash
redis-cli ping
```
返回 `PONG` 表示连接成功。

### 方法 2：启动 Spring Boot 应用
如果 Redis 配置正确，应用启动时不会报错。如果连接失败，会看到类似错误：
```
Unable to connect to Redis
```

### 方法 3：查看应用日志
启动应用后，检查日志中是否有 Redis 连接相关的错误信息。

---

## 快速测试方案对比

| 方案 | 安装难度 | 适用场景 | 推荐度 |
|------|---------|---------|--------|
| 内存 Session | ⭐ 最简单 | 快速测试、开发 | ⭐⭐⭐⭐⭐ |
| Docker | ⭐⭐ 简单 | 开发、测试、生产 | ⭐⭐⭐⭐⭐ |
| WSL | ⭐⭐⭐ 中等 | 开发、测试 | ⭐⭐⭐⭐ |
| Memurai | ⭐⭐ 简单 | Windows 开发 | ⭐⭐⭐⭐ |
| Redis for Windows | ⭐⭐⭐ 中等 | 不推荐 | ⭐⭐ |

---

## 推荐方案

### 如果您只是想快速测试：
👉 **使用方案一（内存 Session）**，修改配置文件即可，无需安装任何东西。

### 如果您需要长期使用：
👉 **使用方案二（Docker）**，如果已安装 Docker；否则使用 **方案四（Memurai）**。

---

## 修改配置使用内存 Session（快速方案）

如果您选择使用内存 Session，可以按照以下步骤修改：

1. 打开 `src/main/resources/application.properties`
2. 注释掉或删除以下行：
   ```properties
   # spring.data.redis.host=localhost
   # spring.data.redis.port=6379
   # spring.data.redis.database=0
   # spring.session.store-type=redis
   # spring.session.redis.namespace=iexsys:session
   ```
3. 保存文件
4. 重启应用

这样应用就会使用内存 Session，无需 Redis。

---

## 常见问题

### Q: 使用内存 Session 有什么限制？
A: 应用重启后所有 Session 会丢失，用户需要重新登录。但对于开发测试完全够用。

### Q: Docker 方案需要什么？
A: 需要安装 Docker Desktop for Windows。下载地址：https://www.docker.com/products/docker-desktop

### Q: 如何检查 Redis 是否在运行？
A: 
- Docker: `docker ps` 查看容器
- WSL: `redis-cli ping` 或 `sudo service redis-server status`
- Memurai: 查看 Windows 服务管理器

### Q: Redis 默认端口是什么？
A: 6379，这是 Redis 的标准端口。

### Q: 可以修改 Redis 端口吗？
A: 可以，但需要同时修改 `application.properties` 中的配置。

---

**建议：** 对于快速测试，直接使用内存 Session 即可。如果需要更接近生产环境，使用 Docker 方案。

