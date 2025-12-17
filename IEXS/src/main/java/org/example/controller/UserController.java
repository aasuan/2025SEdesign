package org.example.controller;

import org.example.entity.User;
import org.example.service.UserService;
import org.example.util.JsonResult;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpSession;
import java.util.HashMap;
import java.util.Map;

/**
 * 用户控制器
 */
@RestController
@RequestMapping("/api/user")
public class UserController {

    @Autowired
    private UserService userService;

    /**
     * 用户注册
     */
    @PostMapping("/register")
    public JsonResult<Map<String, Object>> register(@RequestBody User user) {
        boolean success = userService.register(user);
        if (success) {
            Map<String, Object> data = new HashMap<>();
            data.put("userId", user.getId());
            return JsonResult.success("注册成功", data);
        }
        return JsonResult.error("注册失败，用户名已存在");
    }

    /**
     * 用户登录
     */
    @PostMapping("/login")
    public JsonResult<Map<String, Object>> login(@RequestBody Map<String, String> params, HttpSession session) {
        String username = params.get("username");
        String password = params.get("password");
        
        User user = userService.login(username, password);
        if (user != null) {
            // 保存用户信息到session
            session.setAttribute("user", user);
            Map<String, Object> data = new HashMap<>();
            data.put("userId", user.getId());
            data.put("username", user.getUsername());
            data.put("realName", user.getRealName());
            data.put("role", user.getRole());
            return JsonResult.success("登录成功", data);
        }
        return JsonResult.error("用户名或密码错误");
    }

    /**
     * 用户退出
     */
    @PostMapping("/logout")
    public JsonResult<Void> logout(HttpSession session) {
        session.invalidate();
        return JsonResult.success("退出成功");
    }

    /**
     * 获取当前登录用户信息
     */
    @GetMapping("/info")
    public JsonResult<Map<String, Object>> getCurrentUser(HttpSession session) {
        User user = (User) session.getAttribute("user");
        if (user != null) {
            Map<String, Object> data = new HashMap<>();
            data.put("userId", user.getId());
            data.put("username", user.getUsername());
            data.put("realName", user.getRealName());
            data.put("role", user.getRole());
            return JsonResult.success(data);
        }
        return JsonResult.error(401, "未登录");
    }
}

