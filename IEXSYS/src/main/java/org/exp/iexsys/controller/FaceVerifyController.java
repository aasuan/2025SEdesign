package org.exp.iexsys.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.exp.iexsys.common.ApiResponse;
import org.exp.iexsys.domain.User;
import org.exp.iexsys.dto.UserProfile;
import org.exp.iexsys.service.CompreFaceClient;
import org.exp.iexsys.service.ProctorService;
import org.exp.iexsys.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/portal/exams")
public class FaceVerifyController {

    private static final Logger log = LoggerFactory.getLogger(FaceVerifyController.class);
    private static final String SESSION_KEY = "LOGIN_USER";
    private final UserService userService;
    private final CompreFaceClient comprefaceClient;
    private final ProctorService proctorService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public FaceVerifyController(UserService userService, CompreFaceClient comprefaceClient, ProctorService proctorService) {
        this.userService = userService;
        this.comprefaceClient = comprefaceClient;
        this.proctorService = proctorService;
    }

    @PostMapping("/{id}/face-verify")
    public ApiResponse<String> verify(@PathVariable("id") Long examId,
                                      @Valid @RequestBody FaceVerifyRequest req,
                                      HttpSession session) {
        UserProfile profile = (UserProfile) session.getAttribute(SESSION_KEY);
        if (profile == null || profile.getId() == null) {
            return ApiResponse.failure(401, "not logged in");
        }
        User user = userService.findById(profile.getId().intValue());
        if (user == null) {
            return ApiResponse.failure(401, "user not found");
        }

        String baseline = extractFaceImage(user.getExtraInfo());
        if (baseline == null || baseline.isEmpty()) {
            return ApiResponse.failure(400, "未上传人脸，请先在个人中心-基本信息上传");
        }
        if (req.getCapturedImage() == null || req.getCapturedImage().isEmpty()) {
            return ApiResponse.failure(400, "未获取到当前摄像头图片");
        }

        CompreFaceClient.FaceMatchResult result = comprefaceClient.verifyFaces(baseline, req.getCapturedImage());
        if (!result.isOk()) {
            String error = result.getError() == null ? "未知错误" : result.getError();
            boolean noFace = error.toLowerCase().contains("no face");
            proctorService.createAlert(examId, profile.getId(), req.getCapturedImage(), result.getSimilarity(), error);
            String tip = noFace ? "未检测到人脸，请正对摄像头后重试" : ("face service error: " + error);
            return ApiResponse.failure(400, tip);
        }

        double similarity = result.getSimilarity() == null ? 0.0 : result.getSimilarity();
        if (!result.isPassed()) {
            log.info("Face verify failed examId={}, user={}, similarity={}", examId, profile.getUsername(), similarity);
            proctorService.createAlert(examId, profile.getId(), req.getCapturedImage(), result.getSimilarity(), "verify failed");
            return ApiResponse.failure(400, "face verification failed, similarity=" + similarity);
        }
        log.info("Face verify success examId={}, user={}, similarity={}", examId, profile.getUsername(), similarity);
        return ApiResponse.success("face verified, similarity=" + similarity);
    }

    private String extractFaceImage(String extraInfo) {
        if (extraInfo == null || extraInfo.isEmpty()) return null;
        try {
            JsonNode node = objectMapper.readTree(extraInfo);
            JsonNode face = node.get("faceImage");
            if (face != null && face.isTextual()) {
                return face.asText();
            }
        } catch (Exception e) {
            log.warn("Failed to parse extra_info for faceImage", e);
        }
        return null;
    }

    public static class FaceVerifyRequest {
        @NotBlank
        private String capturedImage;

        public String getCapturedImage() {
            return capturedImage;
        }

        public void setCapturedImage(String capturedImage) {
            this.capturedImage = capturedImage;
        }
    }
}
