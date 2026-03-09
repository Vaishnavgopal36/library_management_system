import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './RegisterPage.module.css';
import { Icon } from '../../components/atoms/Icon';
import { InputField } from '../../components/atoms/InputField/InputField';
import { Button } from '../../components/atoms/Button/Button';
import { authService } from '../../services/auth.service';

export const RegisterPage: React.FC = () => {
  // States matching the DB schema (excluding auto-generated fields)
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please try again.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setIsLoading(true);
    try {
      await authService.register({ fullName, email, password });
      setSuccess(true);
      setTimeout(() => navigate('/login', { replace: true }), 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.pageWrapper}>
      
      <div className={styles.cornerLogo}>
        <Icon name="book-logo" size={48} stroke="var(--color-text-primary)" strokeWidth={1.5} />
      </div>

      <div className={styles.registerCard}>
        
        <div className={styles.header}>
          <h1 className={styles.brand}>BookStop</h1>
          <h2 className={styles.welcome}>Registration</h2>
          <p className={styles.subText}>For Members</p>
        </div>

        <form onSubmit={handleRegister} className={styles.form}>
          
          {error && (
            <p style={{ color: 'var(--color-danger-600)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              {error}
            </p>
          )}
          {success && (
            <p style={{ color: 'var(--color-success-600)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              Registration successful! Redirecting to login…
            </p>
          )}

          <div className={styles.inputGroup}>
            <InputField 
              label="Full Name" 
              placeholder="Reinhard Kenson" 
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <InputField 
              label=" Email ID" 
              type="email"
              placeholder="kenson@bookstop.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className={styles.inputGroup} style={{ position: 'relative' }}>
            <InputField 
              label="Password" 
              type={showPassword ? 'text' : 'password'} 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="button" className={styles.eyeButton} onClick={() => setShowPassword(!showPassword)}>
              <Icon name={showPassword ? 'eye' : 'eye-off'} size={18} />
            </button>
          </div>

          <div className={styles.inputGroup} style={{ position: 'relative', marginBottom: '1.5rem' }}>
            <InputField 
              label="Confirm Password" 
              type={showConfirm ? 'text' : 'password'} 
              placeholder="••••••••" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              error={error}
            />
            <button type="button" className={styles.eyeButton} onClick={() => setShowConfirm(!showConfirm)}>
              <Icon name={showConfirm ? 'eye' : 'eye-off'} size={18} />
            </button>
          </div>

          <Button 
            type="submit" 
            variant="primary" 
            size="lg" 
            className={styles.submitButton}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Register'}
          </Button>

        </form>

        <p className={styles.loginPrompt}>
          Already a User? <Link to="/login" className={styles.loginLink}>Login now</Link>
        </p>

      </div>
    </div>
  );
};