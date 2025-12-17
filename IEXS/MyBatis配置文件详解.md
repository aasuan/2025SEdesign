# MyBatis 配置文件详解

## 文件作用概述

`mybatis-config.xml` 是 **MyBatis 框架的核心配置文件**，它定义了 MyBatis 的全局配置信息，类似于 Spring 的 `applicationContext.xml`。

## 文件在项目中的位置

```
IEXS/src/main/resources/mybatis-config.xml
```

## 工作流程

### 1. 加载时机

```
应用启动 → Spring 加载 applicationContext.xml 
       → SqlSessionFactoryBean 读取 mybatis-config.xml
       → 创建 SqlSessionFactory 对象
       → 用于后续创建 SqlSession（数据库会话）
```

**在 Spring 中的配置位置：**

```xml
<!-- applicationContext.xml -->
<bean id="sqlSessionFactory" class="org.mybatis.spring.SqlSessionFactoryBean">
    <property name="configLocation" value="classpath:mybatis-config.xml"/>
    <!-- ... -->
</bean>
```

### 2. 执行流程

```
1. Spring 启动时读取 mybatis-config.xml
   ↓
2. 解析 <settings> 配置全局行为
   ↓
3. 扫描 <typeAliases> 注册类型别名
   ↓
4. 扫描 <mappers> 找到所有 Mapper 接口和 XML
   ↓
5. 生成 SqlSessionFactory 对象
   ↓
6. 运行时通过 SqlSessionFactory 创建 SqlSession
   ↓
7. SqlSession 执行 Mapper 方法，根据配置进行映射
```

---

## 配置项详解

### 一、XML 声明和 DTD

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE configuration
        PUBLIC "-//mybatis.org//DTD Config 3.0//EN"
        "http://mybatis.org/dtd/mybatis-3-config.dtd">
```

**作用：**
- 声明 XML 版本和编码（UTF-8 支持中文）
- DTD 定义文件结构，IDE 可以提供自动提示和验证

---

### 二、`<settings>` 全局设置

这是 **最重要的配置部分**，控制 MyBatis 的核心行为。

#### 1. `mapUnderscoreToCamelCase` - 驼峰命名转换

```xml
<setting name="mapUnderscoreToCamelCase" value="true"/>
```

**作用：** 自动将数据库字段的下划线命名转换为 Java 的驼峰命名

**示例：**

```java
// 数据库字段（下划线）
CREATE TABLE user (
    user_name VARCHAR(50),      // 数据库字段
    create_time DATETIME         // 数据库字段
);

// Java 实体类（驼峰）
public class User {
    private String userName;     // 自动映射到 user_name
    private Date createTime;     // 自动映射到 create_time
}
```

**效果：**
- ✅ 启用后：`user_name` → `userName`
- ❌ 不启用：需要手动在 Mapper XML 中写映射关系

**实际影响：**
```xml
<!-- 不需要这样写了 -->
<result property="userName" column="user_name"/>

<!-- 可以直接这样 -->
<result property="userName"/>  <!-- 自动映射 -->
```

---

#### 2. `cacheEnabled` - 二级缓存

```xml
<setting name="cacheEnabled" value="true"/>
```

**作用：** 开启 MyBatis 的二级缓存（Mapper 级别缓存）

**缓存层级：**

```
一级缓存（SqlSession 级别）
  ├─ 同一个 SqlSession 中，相同 SQL 查询会使用缓存
  ├─ 默认开启，无需配置
  └─ 作用范围：单次会话

二级缓存（Mapper 级别）
  ├─ 跨 SqlSession 共享缓存数据
  ├─ 需要手动开启（cacheEnabled=true）
  └─ 作用范围：整个应用
```

**使用场景：**

```java
// 场景1：频繁查询相同数据
Exam exam1 = examMapper.selectById(1);  // 第一次：查询数据库
Exam exam2 = examMapper.selectById(1);  // 第二次：从缓存获取（如果开启了二级缓存）

// 场景2：减少数据库压力
// 查询所有学生列表，1000次请求，只有第一次查数据库
```

**注意事项：**
- 需要实体类实现 `Serializable` 接口
- 需要在 Mapper XML 中添加 `<cache/>` 标签
- 更新操作会清空相关缓存

---

#### 3. `lazyLoadingEnabled` - 延迟加载

```xml
<setting name="lazyLoadingEnabled" value="true"/>
<setting name="aggressiveLazyLoading" value="false"/>
```

**作用：** 实现关联对象的懒加载，只在需要时才查询

**示例场景：**

```java
// 考试实体
public class Exam {
    private Integer id;
    private String examName;
    private List<Question> questions;  // 关联题目列表
}

// 情况1：只需要考试基本信息
Exam exam = examMapper.selectById(1);
System.out.println(exam.getExamName());  // ✅ 只查询 exam 表

// 情况2：需要题目列表
exam.getQuestions().size();  // ✅ 这时才查询 question 表
```

**配置说明：**

| 配置项 | 值 | 含义 |
|--------|-----|------|
| `lazyLoadingEnabled` | `true` | 开启延迟加载 |
| `aggressiveLazyLoading` | `false` | 按需加载（访问属性时才加载） |
| `aggressiveLazyLoading` | `true` | 积极加载（访问任何属性都加载所有） |

**性能对比：**

```
不启用延迟加载：
  SELECT * FROM exam WHERE id = 1;
  SELECT * FROM question WHERE exam_id = 1;  ← 即使不需要也会查询

启用延迟加载：
  SELECT * FROM exam WHERE id = 1;           ← 只查询需要的
  (当调用 exam.getQuestions() 时才执行)
```

---

#### 4. `logImpl` - 日志实现

```xml
<setting name="logImpl" value="STDOUT_LOGGING"/>
```

**作用：** 配置 MyBatis 的日志输出方式

**可选值：**

| 值 | 说明 | 适用场景 |
|---|------|---------|
| `STDOUT_LOGGING` | 输出到控制台 | 开发调试 |
| `SLF4J` | 使用 SLF4J 框架 | 生产环境（推荐） |
| `LOG4J` | 使用 Log4j | 传统项目 |
| `LOG4J2` | 使用 Log4j2 | 新项目 |

**输出示例：**

```
==>  Preparing: SELECT * FROM user WHERE id = ?
==> Parameters: 1(Integer)
<==    Columns: id, username, password, real_name
<==        Row: 1, student, student123, 李同学
<==      Total: 1
```

**为什么能看到 SQL：**
- MyBatis 会打印执行的 SQL 和参数
- 开发时非常有用，可以看到实际执行的 SQL
- 生产环境建议改为 SLF4J，通过 log4j.properties 控制日志级别

---

### 三、`<typeAliases>` 类型别名

```xml
<typeAliases>
    <package name="org.example.entity"/>
</typeAliases>
```

**作用：** 为 Java 类型设置别名，简化 Mapper XML 中的类型引用

**使用前（完整类名）：**

```xml
<!-- UserMapper.xml -->
<select id="selectById" resultType="org.example.entity.User">
    SELECT * FROM user WHERE id = #{id}
</select>

<insert id="insert" parameterType="org.example.entity.User">
    INSERT INTO user ...
</insert>
```

**使用后（别名）：**

```xml
<!-- UserMapper.xml -->
<select id="selectById" resultType="User">
    SELECT * FROM user WHERE id = #{id}
</select>

<insert id="insert" parameterType="User">
    INSERT INTO user ...
</insert>
```

**别名规则：**
- 默认别名：类名首字母小写（`User` → `user`）
- 也可以自定义：`<typeAlias type="org.example.entity.User" alias="UserBean"/>`

**实际效果：**
- 减少重复的包名
- 代码更简洁
- 提高可读性

---

### 四、`<mappers>` Mapper 注册

```xml
<mappers>
    <package name="org.example.mapper"/>
</mappers>
```

**作用：** 告诉 MyBatis 在哪里找到 Mapper 接口和对应的 XML 文件

**工作过程：**

```
1. 扫描 org.example.mapper 包
   ↓
2. 找到所有 Mapper 接口（如 UserMapper.java）
   ↓
3. 在 resources/mapper 目录找对应的 XML（如 UserMapper.xml）
   ↓
4. 将接口方法和 XML 中的 SQL 绑定
   ↓
5. 生成代理对象，供 Service 层调用
```

**其他配置方式对比：**

```xml
<!-- 方式1：扫描包（推荐，当前使用） -->
<mappers>
    <package name="org.example.mapper"/>
</mappers>

<!-- 方式2：指定具体 Mapper -->
<mappers>
    <mapper resource="mapper/UserMapper.xml"/>
    <mapper resource="mapper/ExamMapper.xml"/>
</mappers>

<!-- 方式3：指定类路径 -->
<mappers>
    <mapper class="org.example.mapper.UserMapper"/>
</mappers>
```

**为什么用包扫描：**
- ✅ 自动发现所有 Mapper
- ✅ 新增 Mapper 无需修改配置
- ✅ 减少配置工作

---

## 完整工作流程图

```
┌─────────────────────────────────────────┐
│   应用启动 (Spring Context)              │
└───────────────┬─────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│  applicationContext.xml                  │
│  └─ SqlSessionFactoryBean                │
│      └─ configLocation: mybatis-config  │
└───────────────┬─────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│  读取 mybatis-config.xml                 │
│  ┌───────────────────────────────────┐  │
│  │ 1. 解析 <settings>                │  │
│  │    - 驼峰转换规则                 │  │
│  │    - 缓存配置                     │  │
│  │    - 延迟加载规则                 │  │
│  │    - 日志输出方式                 │  │
│  ├───────────────────────────────────┤  │
│  │ 2. 注册 <typeAliases>             │  │
│  │    - User → org.example.entity.User│ │
│  ├───────────────────────────────────┤  │
│  │ 3. 扫描 <mappers>                 │  │
│  │    - 找到所有 Mapper 接口          │  │
│  │    - 绑定对应的 XML 文件           │  │
│  └───────────────────────────────────┘  │
└───────────────┬─────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│  创建 SqlSessionFactory                  │
│  (数据库会话工厂)                         │
└───────────────┬─────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│  Service 调用 Mapper 方法                │
│  userService.getUserById(1)             │
└───────────────┬─────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│  MyBatis 执行流程                        │
│  1. 根据配置转换参数（驼峰等）           │
│  2. 执行 SQL（打印日志）                 │
│  3. 结果映射（下划线→驼峰）              │
│  4. 返回对象                            │
└─────────────────────────────────────────┘
```

---

## 实际项目中的应用

### 示例：查询用户

**1. Service 层调用：**

```java
// UserServiceImpl.java
public User getUserById(Integer id) {
    return userMapper.selectById(id);  // 调用 Mapper
}
```

**2. MyBatis 执行：**

```xml
<!-- UserMapper.xml -->
<select id="selectById" resultType="User">
    SELECT id, username, real_name, create_time 
    FROM user 
    WHERE id = #{id}
</select>
```

**3. 配置生效过程：**

```
① mapUnderscoreToCamelCase = true
   → real_name 自动映射到 realName
   → create_time 自动映射到 createTime

② logImpl = STDOUT_LOGGING
   → 控制台输出：
     ==> Preparing: SELECT ... WHERE id = ?
     ==> Parameters: 1(Integer)
     <== Total: 1

③ typeAliases
   → resultType="User" 解析为 org.example.entity.User

④ 返回对象
   → User{id=1, username="student", realName="李同学", ...}
```

---

## 常见问题

### Q1: 为什么有时候 SQL 字段映射不上？

**A:** 检查 `mapUnderscoreToCamelCase` 是否开启，或者字段名是否匹配

```java
// ❌ 错误：数据库是 user_name，Java 也是 user_name
private String user_name;  

// ✅ 正确：数据库是 user_name，Java 是 userName
private String userName;
```

### Q2: 如何关闭日志输出？

**A:** 修改 `logImpl` 或使用 SLF4J 并通过 log4j.properties 控制

```xml
<!-- 方式1：改为 SLF4J -->
<setting name="logImpl" value="SLF4J"/>

<!-- 方式2：关闭 MyBatis 日志 -->
<!-- 在 log4j.properties 中添加 -->
log4j.logger.org.mybatis=WARN
```

### Q3: 二级缓存什么时候会失效？

**A:** 
- 执行 UPDATE/DELETE/INSERT 操作
- 手动调用 `sqlSession.clearCache()`
- 配置文件修改后

### Q4: 延迟加载不生效？

**A:** 
- 确保 `lazyLoadingEnabled=true`
- 确保 `aggressiveLazyLoading=false`
- 检查是否使用了 `fetchType="eager"`

---

## 总结

`mybatis-config.xml` 是 MyBatis 的**核心配置文件**，它：

1. ✅ **定义全局行为**：通过 `<settings>` 控制框架的核心功能
2. ✅ **简化代码**：通过 `<typeAliases>` 减少冗长的类型声明
3. ✅ **自动发现**：通过 `<mappers>` 自动注册 Mapper 接口
4. ✅ **提高效率**：缓存、延迟加载等优化数据库操作

**记住：** 这个文件在应用启动时只加载一次，之后所有数据库操作都会遵循这些配置规则！

