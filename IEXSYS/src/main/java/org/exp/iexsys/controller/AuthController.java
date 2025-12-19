package org.exp.iexsys.controller;

import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.exp.iexsys.common.ApiResponse;
import org.exp.iexsys.domain.User;
import org.exp.iexsys.dto.LoginRequest;
import org.exp.iexsys.dto.RegisterRequest;
import org.exp.iexsys.dto.UserProfile;
import org.exp.iexsys.service.UserService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final String SESSION_KEY = "LOGIN_USER";

    private final UserService userService;

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/register")
    public ApiResponse<UserProfile> register(@Valid @RequestBody RegisterRequest request, HttpSession session) {
        User user = userService.register(request);
        UserProfile profile = toProfile(user);
        storeSession(session, profile);
        return ApiResponse.success("注册成功", profile);
    }

    @PostMapping("/login")
    public ApiResponse<UserProfile> login(@Valid @RequestBody LoginRequest request, HttpSession session) {
        User user = userService.login(request.getUsername(), request.getPassword());
        UserProfile profile = toProfile(user);
        storeSession(session, profile);
        return ApiResponse.success("登录成功", profile);
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout(HttpSession session) {
        session.invalidate();
        return ApiResponse.success("已退出");
    }

    @GetMapping("/me")
    public ApiResponse<UserProfile> currentUser(HttpSession session) {
        UserProfile profile = (UserProfile) session.getAttribute(SESSION_KEY);
        if (profile == null) {
            return ApiResponse.failure(401, "未登录");
        }
        return ApiResponse.success(profile);
    }

    private void storeSession(HttpSession session, UserProfile profile) {
        session.setAttribute(SESSION_KEY, profile);
    }

    private UserProfile toProfile(User user) {
        UserProfile profile = new UserProfile();
        profile.setId(user.getId());
        profile.setUsername(user.getUsername());
        profile.setRealName(user.getRealName());
        profile.setEmail(user.getEmail());
        profile.setPhone(user.getPhone());
        profile.setStatus(user.getStatus());
        return profile;
    }
}

