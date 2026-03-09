import React, { useState, useRef, useEffect } from 'react';
import { Icon } from '../Icon';
import styles from './Dropdown.module.css';

export interface DropdownOption {
  label: string;
  value: string;
}

export interface DropdownProps {
  options: DropdownOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  label
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className={styles.wrapper} ref={dropdownRef}>
      {label && <label className={styles.label}>{label}</label>}
      
      <div 
        className={`${styles.trigger} ${isOpen ? styles.triggerActive : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={selectedOption ? styles.selectedText : styles.placeholder}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        
        <Icon
          name="chevron-down"
          size={16}
          className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
        />
      </div>

      {isOpen && (
        <ul className={styles.menu}>
          {options.map((option) => (
            <li 
              key={option.value}
              className={`${styles.menuItem} ${value === option.value ? styles.menuItemActive : ''}`}
              onClick={() => handleSelect(option.value)}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};