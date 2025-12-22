package org.exp.iexsys.dto;

import jakarta.validation.constraints.NotBlank;

public class BindPhoneRequest {

    @NotBlank(message = "手机号不能为空")
    private String phone;

    // 预留验证码或第三方凭证字段
    private String code;
    private String wxOpenId;

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getWxOpenId() {
        return wxOpenId;
    }

    public void setWxOpenId(String wxOpenId) {
        this.wxOpenId = wxOpenId;
    }
}
