package org.exp.iexsys.service.impl;

import org.exp.iexsys.domain.User;
import org.exp.iexsys.dto.RegisterRequest;
import org.exp.iexsys.mapper.UserMapper;
import org.exp.iexsys.service.UserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
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

    @Override
    public User register(RegisterRequest request) {
        User exists = userMapper.selectByUsername(request.getUsername());
        if (exists != null) {
            throw new IllegalArgumentException("用户名已存在");
        }
        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRealName(request.getRealName());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
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
}

