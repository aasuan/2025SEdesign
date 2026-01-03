package org.exp.iexsys.controller;

import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.exp.iexsys.common.ApiResponse;
import org.exp.iexsys.domain.User;
import org.exp.iexsys.dto.FaceImageUploadRequest;
import org.exp.iexsys.dto.UserProfile;
import org.exp.iexsys.service.UserService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    private static final String SESSION_KEY = "LOGIN_USER";
    private final UserService userService;

    public ProfileController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/face-image")
    public ApiResponse<UserProfile> uploadFace(@Valid @RequestBody FaceImageUploadRequest request,
                                               HttpSession session) {
        UserProfile current = (UserProfile) session.getAttribute(SESSION_KEY);
        if (current == null) {
            return ApiResponse.failure(401, "未登录");
        }
        User updated = userService.updateFaceImage(current.getId(), request.getFaceImage());
        UserProfile profile = toProfile(updated);
        session.setAttribute(SESSION_KEY, profile);
        return ApiResponse.success("人脸上传成功", profile);
    }

    private UserProfile toProfile(User user) {
        UserProfile profile = new UserProfile();
        profile.setId(user.getId());
        profile.setUsername(user.getUsername());
        profile.setRealName(user.getRealName());
        profile.setEmail(user.getEmail());
        profile.setPhone(user.getPhone());
        profile.setUserRole(user.getUserRole());
        profile.setStatus(user.getStatus());
        return profile;
    }
}
