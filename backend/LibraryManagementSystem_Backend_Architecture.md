# Library Management System Backend Architecture

## 1. System Overview

### Core Technologies
- **Spring Boot**: 4.0.3
- **PostgreSQL**: Runtime dependency
- **JWT**: JSON Web Token for authentication
- **Lombok**: Simplifies Java code
- **Spring Security**: For securing the application
- **Spring Data JPA**: For database interactions

### Dependencies (from `pom.xml`)
```xml
<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-security</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-validation</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
        <groupId>org.postgresql</groupId>
        <artifactId>postgresql</artifactId>
        <scope>runtime</scope>
    </dependency>
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-api</artifactId>
        <version>0.11.5</version>
    </dependency>
</dependencies>
```

---

## 2. Database Schema & Entities

### Example Entity: `Book`
```java
@Entity
@Table(name = "books")
public class Book {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @ManyToOne
    @JoinColumn(name = "author_id", nullable = false)
    private Author author;

    @OneToMany(mappedBy = "book")
    private List<Reservation> reservations;
}
```

### Additional Entities

#### `Category`
```java
@Entity
@Table(name = "categories")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Category {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "category_id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "name", nullable = false, unique = true)
    private String name;
}
```

#### `Transaction`
```java
@Entity
@Table(name = "transactions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Transaction {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "transaction_id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "book_id", nullable = false)
    private Book book;
}
```

...additional entities like `Reservation`, `User`, `Fine`, `Notification`, `Author`, and `Publisher`...

---

## 3. Security & Configuration

### JWT Utility (`JwtUtil`)
```java
@Component
public class JwtUtil {
    @Value("${jwt.secret}")
    private String secretKey;

    public String generateToken(String email) {
        return Jwts.builder()
                .setSubject(email)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 1000 * 60 * 60 * 10))
                .signWith(SignatureAlgorithm.HS256, secretKey)
                .compact();
    }
}
```

### Security Configuration (`SecurityConfig`)
```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http.csrf().disable()
            .authorizeRequests()
            .antMatchers("/api/auth/**").permitAll()
            .anyRequest().authenticated();
        return http.build();
    }
}
```

---

## 4. Core Business Logic (Services)

### Example Service: `BookService`
```java
@Service
public class BookService {
    @Transactional
    public void addBook(Book book) {
        bookRepository.save(book);
    }

    @Scheduled(cron = "0 0 * * * ?")
    public void updateBookAvailability() {
        // Logic for updating book availability
    }
}
```

### Additional Services

#### `LibraryAutomationEngine`
```java
@Service
public class LibraryAutomationEngine {
    @Transactional
    public void processReservations() {
        // Logic for processing reservation queues
    }

    @Scheduled(cron = "0 0 0 * * ?")
    public void calculateFines() {
        // Logic for dynamic fine calculation
    }
}
```

#### `UserService`
```java
@Service
public class UserService {
    public User getUserById(UUID id) {
        // Logic to fetch user by ID
    }
}
```

#### `ReservationService`
```java
@Service
public class ReservationService {
    public List<Reservation> getActiveReservations() {
        // Logic to fetch active reservations
    }
}
```

#### `FineService`
```java
@Service
public class FineService {
    public BigDecimal calculateTotalFines(UUID userId) {
        // Logic to calculate total fines for a user
    }
}
```

#### `NotificationService`
```java
@Service
public class NotificationService {
    public List<Notification> getUserNotifications(UUID userId) {
        // Logic to fetch notifications for a user
    }
}
```

#### `TransactionService`
```java
@Service
public class TransactionService {
    public List<Transaction> getUserTransactions(UUID userId) {
        // Logic to fetch transactions for a user
    }
}
```

#### `AuthService`
```java
@Service
public class AuthService {
    public String authenticateUser(String email, String password) {
        // Logic to authenticate user
    }
}
```

#### `ReportService`
```java
@Service
public class ReportService {
    public Map<String, Object> generateReport() {
        // Logic to generate reports
    }
}
```

---

## 5. Data Access (Repositories)

### Example Repository: `BookRepository`
```java
@Repository
public interface BookRepository extends JpaRepository<Book, Long> {
    @Query("SELECT b FROM Book b WHERE b.title LIKE %:title%")
    List<Book> findByTitleContaining(@Param("title") String title);
}
```

### Additional Repositories

#### `ReservationRepository`
```java
@Repository
public interface ReservationRepository extends JpaRepository<Reservation, UUID> {
    @Modifying
    @Query("UPDATE Reservation r SET r.status = 'expired' WHERE r.status = 'active' AND r.expiresAt < CURRENT_TIMESTAMP")
    int expireOldReservations();
}
```

#### `FineRepository`
```java
@Repository
public interface FineRepository extends JpaRepository<Fine, UUID> {
    @Query("SELECT SUM(f.amount) FROM Fine f WHERE f.isPaid = false")
    BigDecimal sumUnpaidFines();
}
```

#### `UserRepository`
```java
@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
}
```

#### `AuthorRepository`
```java
@Repository
public interface AuthorRepository extends JpaRepository<Author, UUID> {
}
```

#### `CategoryRepository`
```java
@Repository
public interface CategoryRepository extends JpaRepository<Category, UUID> {
    boolean existsByName(String name);
}
```

#### `TransactionRepository`
```java
@Repository
public interface TransactionRepository extends JpaRepository<Transaction, UUID> {
    List<Transaction> findByUserId(UUID userId);
    long countByStatus(TransactionStatus status);
}
```

#### `NotificationRepository`
```java
@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {
    List<Notification> findByUserIdOrderByCreatedAtDesc(UUID userId);
}
```

#### `PublisherRepository`
```java
@Repository
public interface PublisherRepository extends JpaRepository<Publisher, UUID> {
    boolean existsByName(String name);
}
```

---

## 6. API Layer (Controllers)

### Example Controller: `BookController`
```java
@RestController
@RequestMapping("/api/books")
public class BookController {
    @GetMapping
    public List<Book> getAllBooks() {
        return bookService.getAllBooks();
    }

    @PostMapping
    public void addBook(@RequestBody Book book) {
        bookService.addBook(book);
    }
}
```

### Additional Controllers

#### `AuthController`
```java
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        // Authentication logic
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        // Registration logic
    }
}
```

#### `UserController`
```java
@RestController
@RequestMapping("/api/users")
public class UserController {
    @GetMapping("/{id}")
    public ResponseEntity<User> getUser(@PathVariable UUID id) {
        // Fetch user details
    }
}
```

#### `ReservationController`
```java
@RestController
@RequestMapping("/api/reservations")
public class ReservationController {
    @GetMapping("/active")
    public List<Reservation> getActiveReservations() {
        // Logic to fetch active reservations
    }
}
```

#### `FineController`
```java
@RestController
@RequestMapping("/api/fines")
public class FineController {
    @GetMapping("/user/{userId}")
    public BigDecimal getUserFines(@PathVariable UUID userId) {
        // Logic to fetch fines for a user
    }
}
```

#### `NotificationController`
```java
@RestController
@RequestMapping("/api/notifications")
public class NotificationController {
    @GetMapping("/user/{userId}")
    public List<Notification> getUserNotifications(@PathVariable UUID userId) {
        // Logic to fetch notifications for a user
    }
}
```

#### `ReportController`
```java
@RestController
@RequestMapping("/api/reports")
public class ReportController {
    @GetMapping
    public Map<String, Object> generateReport() {
        // Logic to generate reports
    }
}
```

#### `TransactionController`
```java
@RestController
@RequestMapping("/api/transactions")
public class TransactionController {
    @GetMapping("/user/{userId}")
    public List<Transaction> getUserTransactions(@PathVariable UUID userId) {
        // Logic to fetch transactions for a user
    }
}
```