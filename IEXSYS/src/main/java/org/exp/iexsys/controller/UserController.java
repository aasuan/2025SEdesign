package org.exp.iexsys.controller;

import org.exp.iexsys.common.ApiResponse;
import org.exp.iexsys.domain.User;
import org.exp.iexsys.dto.UserProfile;
import org.exp.iexsys.service.UserService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public ApiResponse<List<UserProfile>> list(@RequestParam(value = "keyword", required = false) String keyword,
                                               @RequestParam(value = "limit", required = false) Integer limit) {
        List<User> users = userService.search(keyword, limit);
        List<UserProfile> profiles = users.stream().map(this::toProfile).collect(Collectors.toList());
        return ApiResponse.success(profiles);
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

