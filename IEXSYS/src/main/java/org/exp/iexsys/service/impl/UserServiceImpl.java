package org.exp.iexsys.service.impl;

import org.exp.iexsys.domain.User;
import org.exp.iexsys.dto.RegisterRequest;
import org.exp.iexsys.mapper.UserMapper;
import org.exp.iexsys.service.UserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.security.crypto.password.PasswordEncoder;

@Service
@Transactional
public class UserServiceImpl implements UserService {

    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    public UserServiceImpl(UserMapper userMapper, PasswordEncoder passwordEncoder) {
        this.userMapper = userMapper;
        this.passwordEncoder = passwordEncoder;
    }

    private static final String ROLE_ADMIN = "Admin";
    private static final String ROLE_TEACHER = "Teacher";
    private static final String ROLE_STUDENT = "Student";

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
            throw new IllegalArgumentException("账户已锁定");
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
            throw new IllegalArgumentException("手机号已被其他账户绑定");
        }
        int updated = userMapper.updatePhone(userId, phone);
        if (updated <= 0) {
            throw new IllegalStateException("绑定手机号失败，请稍后再试");
        }
        return userMapper.selectById(userId);
    }
}

