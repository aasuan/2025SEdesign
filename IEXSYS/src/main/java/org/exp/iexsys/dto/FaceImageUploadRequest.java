package org.exp.iexsys.dto;

import jakarta.validation.constraints.NotBlank;

public class FaceImageUploadRequest {
    @NotBlank
    private String faceImage;

    public String getFaceImage() {
        return faceImage;
    }

    public void setFaceImage(String faceImage) {
        this.faceImage = faceImage;
    }
}
