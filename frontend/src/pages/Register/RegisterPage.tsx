import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './RegisterPage.module.css';
import { InputField } from '../../components/atoms/InputField/InputField';
import { Button } from '../../components/atoms/Button/Button';

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

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please try again.');
      return;
    }

    // API constraint: password minimum 8 characters (RegisterRequest)
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setIsLoading(true);

    // TODO: POST /api/v1/auth/register — body: RegisterRequest { email*, password*(min 8), fullName? }
    // The payload matching RegisterRequest schema:
    const payload = {
      fullName: fullName,
      email: email,
      password: password // The Spring Boot backend will hash this into password_hash
    };

    console.log('Sending Registration DTO to backend:', payload);
    
    // Simulate backend network delay
    setTimeout(() => {
      setIsLoading(false);
      alert(`Registration Successful for ${fullName}!\nYou can now log in using your email.`);
    }, 1500);
  };

  return (
    <div className={styles.pageWrapper}>
      
      <div className={styles.cornerLogo}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
        </svg>
      </div>

      <div className={styles.registerCard}>
        
        <div className={styles.header}>
          <h1 className={styles.brand}>BookStop</h1>
          <h2 className={styles.welcome}>Registration</h2>
          <p className={styles.subText}>For Members</p>
        </div>

        <form onSubmit={handleRegister} className={styles.form}>
          
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
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {showPassword ? (
                  <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></>
                ) : (
                  <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></>
                )}
              </svg>
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
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {showConfirm ? (
                  <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></>
                ) : (
                  <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></>
                )}
              </svg>
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