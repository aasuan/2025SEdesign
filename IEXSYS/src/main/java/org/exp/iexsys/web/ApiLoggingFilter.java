package org.exp.iexsys.web;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingRequestWrapper;
import org.springframework.web.util.ContentCachingResponseWrapper;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

/**
 * 记录前后端通信的简单日志，控制台输出 API 请求/响应。
 */
@Component
public class ApiLoggingFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(ApiLoggingFilter.class);
    private static final int MAX_BODY_LENGTH = 2048;
    private static final int MAX_CACHE_BYTES = 8 * 1024;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        // 仅记录接口请求
        if (!request.getRequestURI().startsWith("/api")) {
            filterChain.doFilter(request, response);
            return;
        }

        ContentCachingRequestWrapper requestWrapper = new ContentCachingRequestWrapper(request, MAX_CACHE_BYTES);
        ContentCachingResponseWrapper responseWrapper = new ContentCachingResponseWrapper(response);
        long start = System.currentTimeMillis();
        try {
            filterChain.doFilter(requestWrapper, responseWrapper);
        } finally {
            long cost = System.currentTimeMillis() - start;
            String reqBody = trimBody(new String(requestWrapper.getContentAsByteArray(), StandardCharsets.UTF_8));
            String resBody = trimBody(new String(responseWrapper.getContentAsByteArray(), StandardCharsets.UTF_8));
            log.info("API {} {} {}ms status={} reqBody={} resBody={}",
                    request.getMethod(),
                    request.getRequestURI(),
                    cost,
                    responseWrapper.getStatus(),
                    reqBody,
                    resBody);
            // 将响应内容写回客户端
            responseWrapper.copyBodyToResponse();
        }
    }

    private String trimBody(String body) {
        if (body == null) {
            return "";
        }
        String cleaned = body.replaceAll("\\s+", " ").trim();
        if (cleaned.length() > MAX_BODY_LENGTH) {
            return cleaned.substring(0, MAX_BODY_LENGTH) + "...(truncated)";
        }
        return cleaned;
    }
}
