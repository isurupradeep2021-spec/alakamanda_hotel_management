package com.hotelmanagement.controller;

import com.hotelmanagement.dto.PayrollRunActionRequest;
import com.hotelmanagement.dto.PayrollRunRequest;
import com.hotelmanagement.entity.PayrollRun;
import com.hotelmanagement.entity.PayrollRunStatus;
import com.hotelmanagement.service.PayrollRunService;
import com.lowagie.text.Document;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfWriter;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payroll/runs")
@RequiredArgsConstructor
public class PayrollRunController {

    private final PayrollRunService payrollRunService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public PayrollRun create(@Valid @RequestBody PayrollRunRequest request) {
        return payrollRunService.createDraftRun(request);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public List<PayrollRun> list(@RequestParam(required = false) PayrollRunStatus status) {
        return payrollRunService.listRuns(status);
    }

    @GetMapping("/{runId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public PayrollRun get(@PathVariable Long runId) {
        return payrollRunService.getRun(runId);
    }

    @PostMapping("/{runId}/manager-review")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public PayrollRun managerReview(@PathVariable Long runId,
                                    @RequestBody(required = false) PayrollRunActionRequest request) {
        return payrollRunService.moveToManagerReview(runId, request == null ? null : request.getNote());
    }

    @PostMapping("/{runId}/admin-approve")
    @PreAuthorize("hasRole('ADMIN')")
    public PayrollRun adminApprove(@PathVariable Long runId,
                                   @RequestBody(required = false) PayrollRunActionRequest request) {
        return payrollRunService.approveByAdmin(runId, request == null ? null : request.getNote());
    }

    @PostMapping("/{runId}/finance-release")
    @PreAuthorize("hasRole('ADMIN')")
    public PayrollRun financeRelease(@PathVariable Long runId,
                                     @RequestBody(required = false) PayrollRunActionRequest request) {
        return payrollRunService.releaseByFinance(runId, request == null ? null : request.getNote());
    }

    @DeleteMapping("/{runId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public void delete(@PathVariable Long runId) {
        payrollRunService.deleteRun(runId);
    }

    @GetMapping("/dashboard")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public Map<String, Object> dashboard() {
        return payrollRunService.dashboard();
    }

    @GetMapping("/reports/monthly-summary")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public Map<String, Object> monthlySummary(@RequestParam Integer year,
                                              @RequestParam Integer month) {
        return payrollRunService.monthlySummary(year, month);
    }

    @GetMapping("/reports/ytd")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public Map<String, Object> ytd(@RequestParam String employeeCode,
                                   @RequestParam Integer year) {
        return payrollRunService.ytd(employeeCode, year);
    }

    @GetMapping("/reports/tax-liability")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public List<Map<String, Object>> taxLiability(@RequestParam Integer year) {
        return payrollRunService.taxLiability(year);
    }

    @GetMapping("/reports/cost-trend")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public List<Map<String, Object>> costTrend(@RequestParam(defaultValue = "12") Integer months) {
        return payrollRunService.payrollCostTrend(months);
    }

    @GetMapping("/reports/export")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<byte[]> exportMonthlySummary(@RequestParam Integer year,
                                                       @RequestParam Integer month,
                                                       @RequestParam(defaultValue = "excel") String format) {
        Map<String, Object> report = payrollRunService.monthlySummary(year, month);
        if ("pdf".equalsIgnoreCase(format)) {
            return pdf(report, year, month);
        }
        return csv(report, year, month);
    }

    private ResponseEntity<byte[]> csv(Map<String, Object> report, Integer year, Integer month) {
        StringBuilder sb = new StringBuilder();
        sb.append("year,month,recordCount,totalNet\n");
        sb.append(year).append(",")
                .append(month).append(",")
                .append(report.getOrDefault("recordCount", 0)).append(",")
                .append(report.getOrDefault("totalNet", 0)).append("\n");

        byte[] bytes = sb.toString().getBytes(StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=payroll-summary-" + year + "-" + month + ".csv")
                .contentType(MediaType.TEXT_PLAIN)
                .body(bytes);
    }

    private ResponseEntity<byte[]> pdf(Map<String, Object> report, Integer year, Integer month) {
        try {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            Document doc = new Document();
            PdfWriter.getInstance(doc, out);
            doc.open();
            doc.add(new Paragraph("Payroll Monthly Summary"));
            doc.add(new Paragraph("Period: " + year + "-" + String.format("%02d", month)));
            doc.add(new Paragraph("Record Count: " + report.getOrDefault("recordCount", 0)));
            doc.add(new Paragraph("Total Net: " + report.getOrDefault("totalNet", 0)));
            doc.add(new Paragraph("By Department: " + report.getOrDefault("byDepartment", Map.of())));
            doc.add(new Paragraph("By Contract Type: " + report.getOrDefault("byContractType", Map.of())));
            doc.close();
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=payroll-summary-" + year + "-" + month + ".pdf")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(out.toByteArray());
        } catch (Exception e) {
            throw new IllegalStateException("Failed to generate PDF export", e);
        }
    }
}
