import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from './SearchDropdown.module.css';

export interface SearchDropdownOption {
  id: string;
  primary: string;   // main display text (e.g. book title or user full name)
  secondary?: string; // sub text (e.g. author or email)
}

interface SearchDropdownProps {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onSelect: (option: SearchDropdownOption) => void;
  /** Called to fetch results. Should be debounced externally or rely on internal debounce. */
  search: (query: string) => Promise<SearchDropdownOption[]>;
  error?: string;
  required?: boolean;
  autoFocus?: boolean;
  disabled?: boolean;
  /** Minimum characters before searching (default 1) */
  minChars?: number;
}

export const SearchDropdown: React.FC<SearchDropdownProps> = ({
  label,
  placeholder = 'Type to search…',
  value,
  onChange,
  onSelect,
  search,
  error,
  required,
  autoFocus,
  disabled,
  minChars = 1,
}) => {
  const [results, setResults] = useState<SearchDropdownOption[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const doSearch = useCallback(
    (q: string) => {
      if (q.trim().length < minChars) {
        setResults([]);
        setIsOpen(false);
        return;
      }
      setIsSearching(true);
      search(q.trim())
        .then((res) => {
          setResults(res);
          setIsOpen(res.length > 0);
        })
        .catch(() => setResults([]))
        .finally(() => setIsSearching(false));
    },
    [search, minChars],
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    onChange(q);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => doSearch(q), 300);
  };

  const handleSelect = (opt: SearchDropdownOption) => {
    onChange(opt.primary);
    onSelect(opt);
    setIsOpen(false);
    setResults([]);
  };

  return (
    <div className={styles.wrapper} ref={wrapRef}>
      <label className={styles.label}>
        {label}{required && <span className={styles.required}> *</span>}
      </label>
      <div className={styles.inputWrap}>
        <input
          className={`${styles.input} ${error ? styles.inputError : ''}`}
          type="text"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          autoFocus={autoFocus}
          disabled={disabled}
          autoComplete="off"
          onFocus={() => { if (results.length > 0) setIsOpen(true); }}
        />
        {isSearching && <span className={styles.spinner} />}
      </div>
      {error && <p className={styles.errorMsg}>{error}</p>}
      {isOpen && results.length > 0 && (
        <ul className={styles.dropdown} role="listbox">
          {results.map((opt) => (
            <li
              key={opt.id}
              className={styles.dropdownItem}
              role="option"
              aria-selected={false}
              onMouseDown={() => handleSelect(opt)}
            >
              <span className={styles.optPrimary}>{opt.primary}</span>
              {opt.secondary && <span className={styles.optSecondary}>{opt.secondary}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
