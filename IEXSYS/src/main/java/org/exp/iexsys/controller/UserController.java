package org.exp.iexsys.controller;

import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.exp.iexsys.common.ApiResponse;
import org.exp.iexsys.domain.User;
import org.exp.iexsys.dto.AdminUpdateUserRequest;
import org.exp.iexsys.dto.UserProfile;
import org.exp.iexsys.service.UserService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private static final String SESSION_KEY = "LOGIN_USER";

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public ApiResponse<List<UserProfile>> list(@RequestParam(value = "keyword", required = false) String keyword,
                                               @RequestParam(value = "limit", required = false) Integer limit,
                                               HttpSession session) {
        UserProfile current = (UserProfile) session.getAttribute(SESSION_KEY);
        if (current == null) {
            return ApiResponse.failure(401, "未登录");
        }
        // 老的功能需要老师/管理员查询考生，这里放行 Teacher 和 Admin
        if (!isTeacherOrAdmin(current)) {
            return ApiResponse.failure(403, "无权限");
        }
        List<User> users = userService.search(keyword, limit);
        List<UserProfile> profiles = users.stream().map(this::toProfile).collect(Collectors.toList());
        return ApiResponse.success(profiles);
    }

    @PutMapping("/{id}")
    public ApiResponse<UserProfile> updateUser(@PathVariable("id") Long userId,
                                               @Valid @RequestBody AdminUpdateUserRequest request,
                                               HttpSession session) {
        UserProfile current = (UserProfile) session.getAttribute(SESSION_KEY);
        if (current == null) {
            return ApiResponse.failure(401, "未登录");
        }
        if (!isAdmin(current)) {
            return ApiResponse.failure(403, "仅管理员可修改用户信息");
        }
        User updated = userService.adminUpdateUser(userId, request);
        return ApiResponse.success("更新成功", toProfile(updated));
    }

    private boolean isAdmin(UserProfile profile) {
        return profile != null && "Admin".equalsIgnoreCase(profile.getUserRole());
    }

    private boolean isTeacherOrAdmin(UserProfile profile) {
        if (profile == null || profile.getUserRole() == null) {
            return false;
        }
        String role = profile.getUserRole();
        return "Admin".equalsIgnoreCase(role) || "Teacher".equalsIgnoreCase(role);
    }

    private UserProfile toProfile(User user) {
        UserProfile p = new UserProfile();
        p.setId(user.getId());
        p.setUsername(user.getUsername());
        p.setRealName(user.getRealName());
        p.setEmail(user.getEmail());
        p.setPhone(user.getPhone());
        p.setUserRole(user.getUserRole());
        p.setStatus(user.getStatus());
        return p;
    }
}
