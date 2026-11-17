import { LogIn } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import StatusMessage from '../components/ui/StatusMessage';
import { api } from '../services/api';
import { clearToken, getToken, saveToken } from '../services/auth';

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });

  const isAuthenticated = Boolean(getToken());

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  function validateForm() {
    if (!email.trim()) {
      setError('Please enter your email address.');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return false;
    }

    if (!password) {
      setError('Please enter your password.');
      return false;
    }

    return true;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setTouched({ email: true, password: true });
    setError('');

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api.post('/auth/login', {
        email,
        password
      });

      if (!response?.token) {
        throw new Error('Unable to complete login. Please try again.');
      }

      clearToken();
      saveToken(response.token);
      navigate('/', { replace: true });
    } catch (err) {
      const message = err?.message || 'Unable to sign in. Please check your credentials and try again.';
      const isNetworkError =
        err instanceof TypeError ||
        typeof message === 'string' && /failed to fetch|network|connection refused|timeout/i.test(message);

      setError(
        isNetworkError
          ? 'Unable to connect to the server. Please try again later.'
          : message
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="auth-page-shell">
      <div className="panel auth-card">
        <div className="auth-card-accent" />
        <div className="auth-card-header">
          <h2 className="page-title auth-card-title">iStore Login</h2>
        </div>
        <p className="page-subtitle auth-card-subtitle">Sign in to your account to continue.</p>

        <StatusMessage type="error" className="mb-lg">{error}</StatusMessage>

        <form onSubmit={handleSubmit} className="stack-md" noValidate>
          <label className="form-field">
            <span className="muted">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (touched.email) {
                  setError('');
                }
              }}
              onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
              autoComplete="email"
              placeholder="you@istore.com"
              className="form-control"
              aria-invalid={touched.email && !email.trim()}
            />
          </label>

          <label className="form-field">
            <span className="muted">Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                if (touched.password) {
                  setError('');
                }
              }}
              onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
              autoComplete="current-password"
              placeholder="Enter your password"
              className="form-control"
              aria-invalid={touched.password && !password}
            />
          </label>

          <button type="submit" disabled={isSubmitting} className="btn btn-primary">
            <LogIn size={16} />
            <span>{isSubmitting ? 'Signing in...' : 'Sign in'}</span>
          </button>
        </form>

        <p className="auth-card-link">
          Don't have an account?{' '}
          <Link to="/register" className="auth-card-link-action">
            Create one
          </Link>
        </p>

        <p className="auth-card-footer muted text-sm">
          iStore © 2025
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
