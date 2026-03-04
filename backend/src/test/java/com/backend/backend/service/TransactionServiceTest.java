package com.backend.backend.service;

import com.backend.backend.dto.response.TransactionResponse;
import com.backend.backend.entity.Book;
import com.backend.backend.entity.Transaction;
import com.backend.backend.entity.User;
import com.backend.backend.entity.enums.TransactionStatus;
import com.backend.backend.repository.BookRepository;
import com.backend.backend.repository.FineRepository;
import com.backend.backend.repository.ReservationRepository;
import com.backend.backend.repository.TransactionRepository;
import com.backend.backend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TransactionServiceTest {

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private BookRepository bookRepository;

    @Mock
    private FineRepository fineRepository;

    @Mock
    private ReservationRepository reservationRepository;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private TransactionService transactionService;

    @Test
    void markLostTransitionsIssuedTransaction() {
        UUID transactionId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        UUID bookId = UUID.randomUUID();

        User user = User.builder()
                .id(userId)
                .email("member@bookstop.com")
                .fullName("Library Member")
                .build();
        Book book = Book.builder()
                .id(bookId)
                .title("Domain-Driven Design")
                .build();
        Transaction transaction = Transaction.builder()
                .id(transactionId)
                .user(user)
                .book(book)
                .status(TransactionStatus.issued)
                .build();

        when(transactionRepository.findById(transactionId)).thenReturn(Optional.of(transaction));
        when(transactionRepository.save(any(Transaction.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TransactionResponse response = transactionService.markLost(transactionId);

        assertEquals("lost", response.getStatus());
        verify(transactionRepository).save(transaction);
    }

    @Test
    void markLostRejectsReturnedTransaction() {
        UUID transactionId = UUID.randomUUID();

        Transaction transaction = Transaction.builder()
                .id(transactionId)
                .status(TransactionStatus.returned)
                .build();

        when(transactionRepository.findById(transactionId)).thenReturn(Optional.of(transaction));

        IllegalStateException exception = assertThrows(
                IllegalStateException.class,
                () -> transactionService.markLost(transactionId)
        );

        assertEquals("Cannot mark a returned transaction as lost.", exception.getMessage());
        verify(transactionRepository, never()).save(any(Transaction.class));
    }
}
