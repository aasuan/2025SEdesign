package org.exp.iexsys.controller;

import jakarta.validation.Valid;
import org.exp.iexsys.common.ApiResponse;
import org.exp.iexsys.domain.Exam;
import org.exp.iexsys.domain.ExamParticipant;
import org.exp.iexsys.dto.ExamRequest;
import org.exp.iexsys.dto.ParticipantAddRequest;
import org.exp.iexsys.service.ExamService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/exams")
public class ExamController {

    private final ExamService examService;

    public ExamController(ExamService examService) {
        this.examService = examService;
    }

    @GetMapping
    public ApiResponse<List<Exam>> list(@RequestParam(value = "status", required = false) String status,
                                        @RequestParam(value = "startFrom", required = false)
                                        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startFrom,
                                        @RequestParam(value = "startTo", required = false)
                                        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTo) {
        return ApiResponse.success(examService.list(status, startFrom, startTo));
    }

    @PostMapping
    public ApiResponse<Exam> create(@Valid @RequestBody ExamRequest request) {
        return ApiResponse.success("created", examService.create(toExam(request)));
    }

    @PutMapping("/{id}")
    public ApiResponse<Exam> update(@PathVariable("id") Long id, @Valid @RequestBody ExamRequest request) {
        return ApiResponse.success("updated", examService.update(id, toExam(request)));
    }

    @GetMapping("/{id}")
    public ApiResponse<Exam> detail(@PathVariable("id") Long id) {
        Exam exam = examService.findById(id);
        if (exam == null) {
            return ApiResponse.failure(404, "Exam not found");
        }
        return ApiResponse.success(exam);
    }

    @GetMapping("/{id}/participants")
    public ApiResponse<List<ExamParticipant>> participants(@PathVariable("id") Long id) {
        return ApiResponse.success(examService.listParticipants(id));
    }

    @PostMapping("/{id}/participants")
    public ApiResponse<Void> addParticipants(@PathVariable("id") Long id, @Valid @RequestBody ParticipantAddRequest request) {
        examService.addParticipants(id, request.getStudentIds());
        return ApiResponse.success("participants added");
    }

    @PostMapping("/{id}/publish")
    public ApiResponse<Exam> publish(@PathVariable("id") Long id) {
        return ApiResponse.success("published", examService.publish(id));
    }

    @PostMapping("/{id}/cancel")
    public ApiResponse<Exam> cancel(@PathVariable("id") Long id) {
        return ApiResponse.success("canceled", examService.cancel(id));
    }

    private Exam toExam(ExamRequest request) {
        Exam exam = new Exam();
        exam.setPaperId(request.getPaperId());
        exam.setExamName(request.getExamName());
        exam.setStartTime(request.getStartTime());
        exam.setEndTime(request.getEndTime());
        exam.setDurationMinutes(request.getDurationMinutes());
        exam.setProctorId(request.getProctorId());
        exam.setStatus(request.getStatus());
        exam.setAntiCheatSettings(request.getAntiCheatSettings());
        exam.setExtraInfo(request.getExtraInfo());
        return exam;
    }
}
