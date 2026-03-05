import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './LoginPage.module.css';
import { InputField } from '../../components/atoms/InputField/InputField';
import { Button } from '../../components/atoms/Button/Button';

export const LoginPage: React.FC = () => {
  // Field name matches LoginRequest.email (POST /api/v1/auth/login)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // TODO: POST /api/v1/auth/login — body: LoginRequest { email, password }
    // Note: role for routing must come from the API response (JWT/role field), not be inferred from the email string
    console.log('Attempting login with:', { email, password });
    
    setTimeout(() => {
      setIsLoading(false);
      if (email.toLowerCase().includes('admin')) {
        navigate('/admin/dashboard');
      } else {
        navigate('/member/dashboard');
      }
    }, 1500);
  };

  return (
    <div className={styles.pageWrapper}>
      
      {/* Top Left Logo Icon */}
      <div className={styles.cornerLogo}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
        </svg>
      </div>

      <div className={styles.loginCard}>
        
        <div className={styles.header}>
          <h1 className={styles.brand}>BookStop</h1>
          <h2 className={styles.welcome}>Welcome Back !</h2>
          <p className={styles.subText}>Sign in to continue to yourDigital Library</p>
        </div>

        <form onSubmit={handleLogin} className={styles.form}>
          
          <div className={styles.inputGroup}>
            <InputField 
              label="Email" 
              type="email"
              placeholder="email@bookstop.com" 
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
            {/* Password Toggle Eye Icon */}
            <button 
              type="button"
              className={styles.eyeButton}
              onClick={() => setShowPassword(!showPassword)}
              aria-label="Toggle password visibility"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {showPassword ? (
                  <>
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </>
                ) : (
                  <>
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </>
                )}
              </svg>
            </button>
          </div>

          <div className={styles.formOptions}>
            <label className={styles.rememberMe}>
              <input type="checkbox" className={styles.checkbox} />
              <span>Remember me</span>
            </label>
            
          </div>

          <Button 
            type="submit" 
            variant="primary" 
            size="lg" 
            className={styles.submitButton}
            disabled={isLoading}
          >
            {isLoading ? 'Authenticating...' : 'Login'}
          </Button>

        </form>

        <p className={styles.registerPrompt}>
          New User? <Link to="/register" className={styles.registerLink}>Register Here</Link>
        </p>

      </div>
    </div>
  );
};