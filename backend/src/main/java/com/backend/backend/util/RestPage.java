package com.backend.backend.util;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.domain.Page;

import java.util.List;

/**
 * A fully Jackson-serializable pagination envelope.
 *
 * <p>Replaces the previous {@code PageImpl}-subclass approach.  Spring Data's
 * internal types ({@code PageImpl}, {@code PageRequest}, {@code Sort}, etc.)
 * carry no Jackson {@code @JsonCreator} constructors, so any attempt to
 * deserialize them from Redis JSON would fail with
 * "no Creators, like default constructor, exist".
 *
 * <p>This class contains ONLY plain Java scalar / collection fields that
 * Jackson can serialize and deserialize without any custom configuration.
 * A static factory {@link #of(Page)} converts any Spring {@code Page<T>}
 * into a {@code RestPage<T>} before the result is handed back through the
 * {@code @Cacheable} proxy.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RestPage<T> {

    private List<T> content;
    private int     pageNumber;
    private int     pageSize;
    private long    totalElements;
    private int     totalPages;
    private boolean last;

    /**
     * Converts any Spring {@link Page} into a flat, Redis-safe {@link RestPage}.
     * Call this inside every {@code @Cacheable} method instead of returning
     * the raw Spring {@code Page} directly.
     */
    public static <T> RestPage<T> of(Page<T> page) {
        return new RestPage<>(
                page.getContent(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isLast()
        );
    }
}
