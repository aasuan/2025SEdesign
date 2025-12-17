package org.exp.iexsys.service;

import org.exp.iexsys.domain.User;
import org.exp.iexsys.dto.RegisterRequest;

public interface UserService {

    /**
     * 注册新用户。
     */
    User register(RegisterRequest request);

    /**
     * 登录校验。
     */
    User login(String username, String rawPassword);

    User findById(Integer id);

    User findByUsername(String username);
}

