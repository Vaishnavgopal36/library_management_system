package com.backend.backend.service;

import com.backend.backend.dto.response.BookResponse;
import com.backend.backend.entity.Transaction;
import com.backend.backend.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class RecommendationService {

    /** Fallback query when a user has no borrowing history. */
    private static final String COLD_START_QUERY = "bestsellers award winning classic";

    /** Maximum number of recommendations to return to the caller. */
    private static final int MAX_RECOMMENDATIONS = 10;

    private final TransactionRepository transactionRepository;
    private final SemanticSearchService semanticSearchService;

    /**
     * Returns a personalised list of book recommendations for the given user.
     *
     * <p><b>Algorithm:</b>
     * <ol>
     *   <li>Fetch the user's 3 most recent issued transactions.</li>
     *   <li>If there is no history, fall back to a cold-start semantic query
     *       ("bestsellers award winning classic") to ensure the endpoint always
     *       returns useful results for new members.</li>
     *   <li>Join the titles of the recently-borrowed books into a single
     *       whitespace-delimited string and use it as the semantic query.
     *       The embedding model treats it as a combined concept, naturally
     *       finding books in the same thematic neighbourhood.</li>
     *   <li>Remove any books the user has already borrowed in those 3
     *       transactions so recommendations are always fresh.</li>
     *   <li>Cap results at {@value MAX_RECOMMENDATIONS}.</li>
     * </ol>
     *
     * <p>Query cost: 1 history fetch + 1 vector search + 1 batch stock query = 3
     * database round-trips regardless of the number of results.
     *
     * @param userId the UUID of the member requesting recommendations
     * @return ordered list of recommended books, most semantically similar first
     */
    @Transactional(readOnly = true)
    public List<BookResponse> getRecommendationsForUser(UUID userId) {
        List<Transaction> recentTransactions =
                transactionRepository.findTop3ByUser_IdOrderByCheckoutDateDesc(userId);

        // Cold start — no borrowing history yet
        if (recentTransactions.isEmpty()) {
            log.debug("No history for user {} — using cold-start query", userId);
            return semanticSearchService.searchBooks(COLD_START_QUERY)
                    .stream()
                    .limit(MAX_RECOMMENDATIONS)
                    .collect(Collectors.toList());
        }

        // Collect IDs of already-borrowed books for the exclusion filter
        Set<UUID> alreadyBorrowedIds = recentTransactions.stream()
                .map(t -> t.getBook().getId())
                .collect(Collectors.toSet());

        // Build combined query from titles of the 3 most recent books
        String combinedTitles = recentTransactions.stream()
                .map(t -> t.getBook().getTitle())
                .collect(Collectors.joining(" "));

        log.debug("Recommendation query for user {}: \"{}\"", userId, combinedTitles);

        return semanticSearchService.searchBooks(combinedTitles)
                .stream()
                .filter(book -> !alreadyBorrowedIds.contains(book.getId()))
                .limit(MAX_RECOMMENDATIONS)
                .collect(Collectors.toList());
    }
}
