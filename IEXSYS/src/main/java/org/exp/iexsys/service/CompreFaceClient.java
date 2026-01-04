package org.exp.iexsys.service;

import com.fasterxml.jackson.annotation.JsonProperty;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.HttpStatusCodeException;

import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.OptionalDouble;
import java.util.stream.Stream;

@Service
public class CompreFaceClient {

    private static final Logger log = LoggerFactory.getLogger(CompreFaceClient.class);

    private final RestTemplate restTemplate;
    private final String baseUrl;
    private final String apiKey;
    private final double threshold;
    private final Double detProbThreshold;

    public CompreFaceClient(@Value("${compreface.base-url:http://localhost:8000}") String baseUrl,
                            @Value("${compreface.api-key:}") String apiKey,
                            @Value("${compreface.verify-threshold:0.9}") double threshold,
                            @Value("${compreface.det-prob-threshold:0.0}") Double detProbThreshold) {
        this.restTemplate = createRestTemplate();
        this.baseUrl = trimTrailingSlash(baseUrl);
        this.apiKey = apiKey;
        this.threshold = threshold;
        this.detProbThreshold = detProbThreshold;
    }

    public FaceMatchResult verifyFaces(String baselineBase64, String capturedBase64) {
        if (apiKey == null || apiKey.isEmpty()) {
            return FaceMatchResult.error("CompreFace api key is missing");
        }
        String normalizedBaseline = normalizeBase64(baselineBase64);
        String normalizedCaptured = normalizeBase64(capturedBase64);
        Map<String, String> payload = new HashMap<>();
        payload.put("source_image", normalizedBaseline);
        payload.put("target_image", normalizedCaptured);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("x-api-key", apiKey);

        String url = baseUrl + "/api/v1/verification/verify";
        if (detProbThreshold != null && detProbThreshold > 0) {
            url = url + "?det_prob_threshold=" + detProbThreshold;
        }
        try {
            ResponseEntity<VerifyResponse> response = restTemplate.postForEntity(url, new HttpEntity<>(payload, headers), VerifyResponse.class);
            VerifyResponse body = response.getBody();
            if (body == null || body.getResult() == null || body.getResult().isEmpty()) {
                return FaceMatchResult.error("CompreFace returned empty result");
            }
            OptionalDouble maxSimilarity = body.getResult().stream()
                    .filter(Objects::nonNull)
                    .flatMap(r -> {
                        List<FaceMatch> matches = r.getFaceMatches();
                        return matches == null ? Stream.empty() : matches.stream();
                    })
                    .map(FaceMatch::getSimilarity)
                    .filter(Objects::nonNull)
                    .mapToDouble(Double::doubleValue)
                    .max();

            if (maxSimilarity.isEmpty()) {
                return FaceMatchResult.error("No face match returned");
            }

            double similarity = maxSimilarity.getAsDouble();
            boolean passed = similarity >= threshold;
            return FaceMatchResult.success(similarity, passed);
        } catch (HttpStatusCodeException ex) {
            String resp = ex.getResponseBodyAsString();
            log.warn("CompreFace verification call failed status={}, body={}", ex.getStatusCode(), resp);
            String parsedMsg = extractErrorMessage(resp);
            String error = parsedMsg != null ? parsedMsg : ("HTTP " + ex.getStatusCode().value() + ": " + resp);
            return FaceMatchResult.error(error);
        } catch (RestClientException ex) {
            log.warn("CompreFace verification call failed", ex);
            return FaceMatchResult.error("Call CompreFace failed: " + ex.getMessage());
        }
    }

    private String trimTrailingSlash(String url) {
        if (url == null) {
            return "";
        }
        if (url.endsWith("/")) {
            return url.substring(0, url.length() - 1);
        }
        return url;
    }

    private String normalizeBase64(String data) {
        if (data == null) return null;
        String trimmed = data.trim();
        int commaIndex = trimmed.indexOf(",");
        if (trimmed.startsWith("data:") && commaIndex > -1) {
            return trimmed.substring(commaIndex + 1);
        }
        return trimmed;
    }

    private RestTemplate createRestTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout((int) Duration.ofSeconds(5).toMillis());
        factory.setReadTimeout((int) Duration.ofSeconds(10).toMillis());
        return new RestTemplate(factory);
    }

    private String extractErrorMessage(String body) {
        if (body == null || body.isEmpty()) {
            return null;
        }
        try {
            String lowered = body.toLowerCase();
            if (lowered.contains("no face is found")) {
                return "No face is found in the given image";
            }
            int msgIndex = body.indexOf("\"message\"");
            if (msgIndex >= 0) {
                int colon = body.indexOf(':', msgIndex);
                int firstQuote = body.indexOf('"', colon + 1);
                int secondQuote = body.indexOf('"', firstQuote + 1);
                if (firstQuote > -1 && secondQuote > firstQuote) {
                    return body.substring(firstQuote + 1, secondQuote);
                }
            }
        } catch (Exception ignored) {
        }
        return null;
    }

    public static class FaceMatchResult {
        private final boolean ok;
        private final boolean passed;
        private final Double similarity;
        private final String error;

        private FaceMatchResult(boolean ok, boolean passed, Double similarity, String error) {
            this.ok = ok;
            this.passed = passed;
            this.similarity = similarity;
            this.error = error;
        }

        public static FaceMatchResult success(double similarity, boolean passed) {
            return new FaceMatchResult(true, passed, similarity, null);
        }

        public static FaceMatchResult error(String error) {
            return new FaceMatchResult(false, false, null, error);
        }

        public boolean isOk() {
            return ok;
        }

        public boolean isPassed() {
            return passed;
        }

        public Double getSimilarity() {
            return similarity;
        }

        public String getError() {
            return error;
        }
    }

    public static class VerifyResponse {
        private List<VerifyResult> result;

        public List<VerifyResult> getResult() {
            return result;
        }

        public void setResult(List<VerifyResult> result) {
            this.result = result;
        }
    }

    public static class VerifyResult {
        @JsonProperty("face_matches")
        private List<FaceMatch> faceMatches;

        public List<FaceMatch> getFaceMatches() {
            return faceMatches;
        }

        public void setFaceMatches(List<FaceMatch> faceMatches) {
            this.faceMatches = faceMatches;
        }
    }

    public static class FaceMatch {
        private Double similarity;

        public Double getSimilarity() {
            return similarity;
        }

        public void setSimilarity(Double similarity) {
            this.similarity = similarity;
        }
    }
}
