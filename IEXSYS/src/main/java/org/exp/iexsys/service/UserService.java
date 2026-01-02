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

    /**
     * 绑定或更新手机号（需校验唯一性）。
     */
    User bindPhone(Long userId, String phone);

    /**
     * 按用户名或真实姓名模糊搜索，默认最多返回 20 条。
     */
    java.util.List<User> search(String keyword, Integer limit);
}
