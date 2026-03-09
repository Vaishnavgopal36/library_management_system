import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './LoginPage.module.css';
import { InputField } from '../../components/atoms/InputField/InputField';
import { Button } from '../../components/atoms/Button/Button';
import { Icon } from '../../components/atoms/Icon';
import { useAuth } from '../../context/AuthContext';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const user = await login({ email, password });
      navigate(user.role === 'admin' ? '/admin/dashboard' : '/member/dashboard', { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed. Please try again.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.pageWrapper}>
      
      {/* Top Left Logo Icon */}
      <div className={styles.cornerLogo}>
        <Icon name="book-logo" size={48} strokeWidth={1.5} stroke="var(--color-text-primary)" />
      </div>

      <div className={styles.loginCard}>
        
        <div className={styles.header}>
          <h1 className={styles.brand}>BookStop</h1>
          <h2 className={styles.welcome}>Welcome Back !</h2>
          <p className={styles.subText}>Sign in to continue to yourDigital Library</p>
        </div>

        <form onSubmit={handleLogin} className={styles.form}>
          
          {error && (
            <p style={{ color: 'var(--color-error, #ef4444)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
              {error}
            </p>
          )}

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
              <Icon name={showPassword ? 'eye' : 'eye-off'} size={18} />
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