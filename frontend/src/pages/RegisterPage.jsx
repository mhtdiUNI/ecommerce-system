import { UserPlus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import StatusMessage from '../components/ui/StatusMessage';
import { api } from '../services/api';
import { getToken } from '../services/auth';

function RegisterPage() {
  const navigate = useNavigate();
  const isAuthenticated = Boolean(getToken());

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  if (isAuthenticated) {
    return null;
  }
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState({ fullName: false, email: false, password: false, confirmPassword: false });

  function validateForm() {
    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return false;
    }

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
      setError('Please choose a password.');
      return false;
    }

    if (!confirmPassword) {
      setError('Please confirm your password.');
      return false;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return false;
    }

    return true;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setTouched({ fullName: true, email: true, password: true, confirmPassword: true });
    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await api.post('/auth/register', {
        name: fullName,
        email,
        password
      });

      setSuccess('Registration successful. Redirecting to login...');
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 1500);
    } catch (err) {
      const message = err?.message || 'Unable to register. Please check your details and try again.';
      const isNetworkError =
        err instanceof TypeError ||
        (typeof message === 'string' && /failed to fetch|network|connection refused|timeout/i.test(message));

      setError(
        isNetworkError
          ? 'Unable to connect to the server. Please try again later.'
          : message
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-page-shell">
      <div className="panel auth-card">
        <div className="auth-card-accent" />
        <div className="auth-card-header">
          <h2 className="page-title auth-card-title">iStore Register</h2>
        </div>
        <p className="page-subtitle auth-card-subtitle">Create a new account to get started.</p>

        <StatusMessage type="error" className="mb-lg">{error}</StatusMessage>
        <StatusMessage type="success" className="mb-lg">{success}</StatusMessage>

        <form onSubmit={handleSubmit} className="stack-md" noValidate>
          <label className="form-field">
            <span className="muted">Full Name</span>
            <input
              type="text"
              value={fullName}
              onChange={(event) => {
                setFullName(event.target.value);
                if (touched.fullName) setError('');
              }}
              onBlur={() => setTouched((prev) => ({ ...prev, fullName: true }))}
              placeholder="Your full name"
              className="form-control"
              aria-invalid={touched.fullName && !fullName.trim()}
            />
          </label>

          <label className="form-field">
            <span className="muted">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                if (touched.email) setError('');
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
                if (touched.password) setError('');
              }}
              onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
              autoComplete="new-password"
              placeholder="Enter your password"
              className="form-control"
              aria-invalid={touched.password && !password}
            />
            <p className="auth-helper-text">
              Use at least 8 characters for a strong password.
            </p>
          </label>

          <label className="form-field">
            <span className="muted">Confirm Password</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => {
                setConfirmPassword(event.target.value);
                if (touched.confirmPassword) setError('');
              }}
              onBlur={() => setTouched((prev) => ({ ...prev, confirmPassword: true }))}
              autoComplete="new-password"
              placeholder="Confirm your password"
              className="form-control"
              aria-invalid={touched.confirmPassword && !confirmPassword}
            />
          </label>

          <button type="submit" disabled={isSubmitting} className="btn btn-primary">
            <UserPlus size={16} />
            <span>{isSubmitting ? 'Creating account...' : 'Create account'}</span>
          </button>
        </form>

        <p className="auth-card-link">
          Already have an account?{' '}
          <Link to="/login" className="auth-card-link-action">
            Sign in
          </Link>
        </p>

        <p className="auth-card-footer muted text-sm">
          iStore © 2025
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;
