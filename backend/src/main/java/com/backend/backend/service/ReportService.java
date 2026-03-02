package com.backend.backend.service;

import com.backend.backend.entity.enums.TransactionStatus;
import com.backend.backend.repository.BookRepository;
import com.backend.backend.repository.FineRepository;
import com.backend.backend.repository.TransactionRepository;
import com.backend.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final BookRepository bookRepository;
    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;
    private final FineRepository fineRepository;

    @Transactional(readOnly = true)
    public Map<String, Object> generateSystemAnalytics() {
        Map<String, Object> analytics = new HashMap<>();
        
        // Note: You will need to add these method signatures to your JPA Repositories
        analytics.put("totalActiveBooks", bookRepository.countByIsArchivedFalse());
        analytics.put("totalActiveUsers", userRepository.countByIsActiveTrue());
        analytics.put("currentlyIssuedBooks", transactionRepository.countByStatus(TransactionStatus.issued));
        analytics.put("totalUnpaidFinesValue", fineRepository.sumAmountByIsPaidFalse());

        return analytics;
    }
}
