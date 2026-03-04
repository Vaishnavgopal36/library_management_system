import React from 'react';
import styles from './InputField.module.css';

export interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
  error?: string;
}

export const InputField: React.FC<InputFieldProps> = ({
  label,
  icon,
  error,
  className = '',
  ...props
}) => {
  const inputClasses = [
    styles.input,
    icon ? styles.withIcon : '',
    error ? styles.inputError : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={styles.wrapper}>
      {label && <label className={styles.label}>{label}</label>}
      <div className={styles.inputContainer}>
        {icon && <span className={styles.iconWrapper}>{icon}</span>}
        <input className={inputClasses} {...props} />
      </div>
      {error && <span className={styles.errorMessage}>{error}</span>}
    </div>
  );
};