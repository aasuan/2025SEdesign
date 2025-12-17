package org.example.util;

import java.io.Serializable;

/**
 * 统一返回结果类
 */
public class JsonResult<T> implements Serializable {
    private Integer code; // 状态码：200-成功，其他-失败
    private String message; // 提示信息
    private T data; // 数据

    public JsonResult() {
    }

    public JsonResult(Integer code, String message) {
        this.code = code;
        this.message = message;
    }

    public JsonResult(Integer code, String message, T data) {
        this.code = code;
        this.message = message;
        this.data = data;
    }

    public static <T> JsonResult<T> success() {
        return new JsonResult<>(200, "操作成功");
    }

    public static <T> JsonResult<T> success(T data) {
        return new JsonResult<>(200, "操作成功", data);
    }

    public static <T> JsonResult<T> success(String message, T data) {
        return new JsonResult<>(200, message, data);
    }

    public static <T> JsonResult<T> error(String message) {
        return new JsonResult<>(500, message);
    }

    public static <T> JsonResult<T> error(Integer code, String message) {
        return new JsonResult<>(code, message);
    }

    public Integer getCode() {
        return code;
    }

    public void setCode(Integer code) {
        this.code = code;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public T getData() {
        return data;
    }

    public void setData(T data) {
        this.data = data;
    }
}

