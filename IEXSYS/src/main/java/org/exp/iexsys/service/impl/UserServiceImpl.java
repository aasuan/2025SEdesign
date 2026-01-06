package org.exp.iexsys.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.exp.iexsys.domain.User;
import org.exp.iexsys.dto.AdminUpdateUserRequest;
import org.exp.iexsys.dto.RegisterRequest;
import org.exp.iexsys.mapper.UserMapper;
import org.exp.iexsys.service.UserService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@Transactional
public class UserServiceImpl implements UserService {

    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public UserServiceImpl(UserMapper userMapper, PasswordEncoder passwordEncoder) {
        this.userMapper = userMapper;
        this.passwordEncoder = passwordEncoder;
    }

    private static final String ROLE_ADMIN = "Admin";
    private static final String ROLE_TEACHER = "Teacher";
    private static final String ROLE_STUDENT = "Student";
    private static final String STATUS_ACTIVE = "Active";
    private static final String STATUS_INACTIVE = "Inactive";
    private static final String STATUS_LOCKED = "Locked";

    private String normalizeRole(String role) {
        if (!StringUtils.hasText(role)) {
            return ROLE_STUDENT;
        }
        switch (role.trim()) {
            case ROLE_ADMIN:
            case ROLE_TEACHER:
            case ROLE_STUDENT:
                return role.trim();
            default:
                return ROLE_STUDENT;
        }
    }

    private String normalizeStatus(String status) {
        if (!StringUtils.hasText(status)) {
            return STATUS_ACTIVE;
        }
        switch (status.trim()) {
            case STATUS_ACTIVE:
            case STATUS_INACTIVE:
            case STATUS_LOCKED:
                return status.trim();
            default:
                return STATUS_ACTIVE;
        }
    }

    @Override
    public User register(RegisterRequest request) {
        User exists = userMapper.selectByUsername(request.getUsername());
        if (exists != null) {
            throw new IllegalArgumentException("用户名已存在");
        }
        if (StringUtils.hasText(request.getEmail())) {
            User byEmail = userMapper.selectByEmail(request.getEmail());
            if (byEmail != null) {
                throw new IllegalArgumentException("邮箱已被占用");
            }
        }
        if (StringUtils.hasText(request.getPhone())) {
            User byPhone = userMapper.selectByPhone(request.getPhone());
            if (byPhone != null) {
                throw new IllegalArgumentException("手机号已被占用");
            }
        }
        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRealName(request.getRealName());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        // 角色：支持 Admin/Teacher/Student，默认 Student
        user.setUserRole(normalizeRole(request.getUserRole()));
        int rows = userMapper.insert(user);
        if (rows <= 0) {
            throw new IllegalStateException("注册失败，请稍后重试");
        }
        return userMapper.selectById(user.getId());
    }

    @Override
    public User login(String username, String rawPassword) {
        User user = userMapper.selectByUsername(username);
        if (user == null || !passwordEncoder.matches(rawPassword, user.getPassword())) {
            throw new IllegalArgumentException("用户名或密码错误");
        }
        if ("Locked".equalsIgnoreCase(user.getStatus())) {
            throw new IllegalArgumentException("账号已锁定");
        }
        return user;
    }

    @Override
    public User findById(Integer id) {
        return userMapper.selectById(id == null ? null : id.longValue());
    }

    @Override
    public User findByUsername(String username) {
        return userMapper.selectByUsername(username);
    }

    @Override
    public User bindPhone(Long userId, String phone) {
        if (userId == null) {
            throw new IllegalArgumentException("未登录");
        }
        if (!StringUtils.hasText(phone)) {
            throw new IllegalArgumentException("手机号不能为空");
        }
        User byPhone = userMapper.selectByPhone(phone);
        if (byPhone != null && !byPhone.getId().equals(userId)) {
            throw new IllegalArgumentException("手机号已被其他账号绑定");
        }
        int updated = userMapper.updatePhone(userId, phone);
        if (updated <= 0) {
            throw new IllegalStateException("绑定手机号失败，请稍后再试");
        }
        return userMapper.selectById(userId);
    }

    @Override
    public User updateFaceImage(Long userId, String faceImageBase64) {
        if (userId == null) {
            throw new IllegalArgumentException("未登录");
        }
        if (!StringUtils.hasText(faceImageBase64)) {
            throw new IllegalArgumentException("人脸图片不能为空");
        }
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new IllegalArgumentException("用户不存在");
        }
        try {
            ObjectNode node = StringUtils.hasText(user.getExtraInfo())
                    ? (ObjectNode) objectMapper.readTree(user.getExtraInfo())
                    : objectMapper.createObjectNode();
            node.put("faceImage", faceImageBase64.trim());
            String updated = objectMapper.writeValueAsString(node);
            int rows = userMapper.updateExtraInfo(userId, updated);
            if (rows <= 0) {
                throw new IllegalStateException("保存人脸信息失败，请稍后重试");
            }
            return userMapper.selectById(userId);
        } catch (Exception e) {
            throw new IllegalStateException("保存人脸信息失败，请稍后重试", e);
        }
    }

    @Override
    public java.util.List<User> search(String keyword, Integer limit) {
        int rows = (limit == null || limit <= 0 || limit > 50) ? 20 : limit;
        String kw = StringUtils.hasText(keyword) ? keyword.trim() : "";
        return userMapper.searchByKeyword(kw, rows);
    }

    @Override
    public User adminUpdateUser(Long userId, AdminUpdateUserRequest request) {
        if (userId == null) {
            throw new IllegalArgumentException("用户ID不能为空");
        }
        User existing = userMapper.selectById(userId);
        if (existing == null) {
            throw new IllegalArgumentException("用户不存在");
        }
        String username = request.getUsername();
        if (!StringUtils.hasText(username)) {
            throw new IllegalArgumentException("用户名不能为空");
        }
        User byUsername = userMapper.selectByUsername(username.trim());
        if (byUsername != null && !byUsername.getId().equals(userId)) {
            throw new IllegalArgumentException("用户名已被占用");
        }
        String email = request.getEmail();
        if (StringUtils.hasText(email)) {
            User byEmail = userMapper.selectByEmail(email.trim());
            if (byEmail != null && !byEmail.getId().equals(userId)) {
                throw new IllegalArgumentException("邮箱已被占用");
            }
        }
        String phone = request.getPhone();
        if (StringUtils.hasText(phone)) {
            User byPhone = userMapper.selectByPhone(phone.trim());
            if (byPhone != null && !byPhone.getId().equals(userId)) {
                throw new IllegalArgumentException("手机号已被其他账户绑定");
            }
        }
        existing.setUsername(username.trim());
        existing.setRealName(request.getRealName());
        existing.setEmail(StringUtils.hasText(email) ? email.trim() : null);
        existing.setPhone(StringUtils.hasText(phone) ? phone.trim() : null);
        existing.setUserRole(normalizeRole(request.getUserRole()));
        existing.setStatus(normalizeStatus(request.getStatus()));
        int rows = userMapper.updateUser(existing);
        if (rows <= 0) {
            throw new IllegalStateException("更新用户失败，请稍后重试");
        }
        return userMapper.selectById(userId);
    }
}
