import React, { useState, useEffect } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { validateEmail, validatePassword } from './validation';
import VerificationCodeInput from './VerificationCodeInput';

interface AuthProps {
  onAuthSuccess: (sessionId: string, user: any) => void;
}

export default function Auth({ onAuthSuccess }: AuthProps) {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  // Email verification states
  const [showVerification, setShowVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const emailValidation = validateEmail(email);
  const passwordValidation = validatePassword(password);

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const sendVerificationCode = async () => {
    if (!emailValidation.isValid || !name) {
      setError('Please enter a valid email and name first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3001/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      });

      const data = await response.json();

      if (data.success) {
        setCodeSent(true);
        setShowVerification(true);
        setResendTimer(60);
        setError(null);
      } else {
        setError(data.error || 'Failed to send verification code');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationComplete = (code: string) => {
    setVerificationCode(code);
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3001/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });

      const data = await response.json();

      if (data.success) {
        if (data.canvasToken) {
          localStorage.setItem('canvasToken', data.canvasToken);
        }
        onAuthSuccess(data.sessionId, data.user);
      } else {
        setError(data.error || 'Google login failed');
      }
    } catch (err) {
      setError('Failed to connect to auth server');
    } finally {
      setLoading(false);
    }
  };

  const handleCredentialsAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!emailValidation.isValid) {
      setError(emailValidation.error || 'Invalid email');
      setLoading(false);
      return;
    }

    if (isSignup && !passwordValidation.isValid) {
      setError(passwordValidation.errors[0] || 'Invalid password');
      setLoading(false);
      return;
    }

    if (isSignup && !verificationCode) {
      setError('Please verify your email first');
      setLoading(false);
      return;
    }

    const endpoint = isSignup ? '/auth/signup' : '/auth/login';
    const body = isSignup
      ? { email, password, name, verificationCode }
      : { email, password };

    try {
      const response = await fetch(`http://localhost:3001${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.success) {
        if (data.canvasToken) {
          localStorage.setItem('canvasToken', data.canvasToken);
        }
        onAuthSuccess(data.sessionId, data.user);
      } else {
        setError(data.error || 'Authentication failed');
      }
    } catch (err) {
      setError('Failed to connect to auth server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    }}>
      <div style={{
        maxWidth: '480px',
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: '24px',
        padding: '48px 40px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '8px',
          }}>
            SnapSyllabus
          </h1>
          <p style={{ color: '#64748b', fontSize: '15px', margin: 0 }}>
            AI-powered study assistant for Canvas
          </p>
        </div>

        {/* Google Sign In */}
        <div style={{ marginBottom: '32px' }}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError('Google sign in failed')}
            useOneTap
          />
        </div>

        {/* Divider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          margin: '32px 0',
          color: '#94a3b8',
        }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
          <span style={{ padding: '0 16px', fontSize: '13px', fontWeight: '500' }}>OR</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }} />
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleCredentialsAuth}>
          {isSignup && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#334155',
              }}>
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="John Doe"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '12px',
                  fontSize: '15px',
                  transition: 'all 0.2s',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>
          )}

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#334155',
            }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setEmailTouched(true)}
              required
              placeholder="you@example.com"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: `2px solid ${emailTouched && !emailValidation.isValid ? '#ef4444' : '#e2e8f0'}`,
                borderRadius: '12px',
                fontSize: '15px',
                transition: 'all 0.2s',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => e.target.style.borderColor = emailTouched && !emailValidation.isValid ? '#ef4444' : '#667eea'}
              onBlur={(e) => {
                setEmailTouched(true);
                e.target.style.borderColor = emailValidation.isValid ? '#e2e8f0' : '#ef4444';
              }}
            />
            {emailTouched && !emailValidation.isValid && (
              <div style={{
                color: '#ef4444',
                fontSize: '13px',
                marginTop: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}>
                <span>⚠️</span>
                {emailValidation.error}
              </div>
            )}
          </div>

          {/* Email Verification - Only for Signup */}
          {isSignup && (
            <div style={{ marginBottom: '20px' }}>
              {!showVerification ? (
                <button
                  type="button"
                  onClick={sendVerificationCode}
                  disabled={loading || !emailValidation.isValid || !name}
                  style={{
                    width: '100%',
                    padding: '14px',
                    background: loading || !emailValidation.isValid || !name
                      ? '#cbd5e1'
                      : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: loading || !emailValidation.isValid || !name ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: loading || !emailValidation.isValid || !name ? 'none' : '0 4px 12px rgba(16, 185, 129, 0.3)',
                  }}
                  onMouseEnter={(e) => {
                    if (!loading && emailValidation.isValid && name) {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = loading || !emailValidation.isValid || !name ? 'none' : '0 4px 12px rgba(16, 185, 129, 0.3)';
                  }}
                >
                  {loading ? (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <span style={{ animation: 'spin 1s linear infinite' }}>⟳</span> Sending...
                    </span>
                  ) : '📧 Send Verification Code'}
                </button>
              ) : (
                <div style={{
                  padding: '24px',
                  background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                  borderRadius: '16px',
                  border: '2px solid #bae6fd',
                }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '16px',
                    fontSize: '14px',
                    fontWeight: '600',
                    textAlign: 'center',
                    color: '#0369a1',
                  }}>
                    📬 Enter verification code
                  </label>
                  <p style={{
                    fontSize: '13px',
                    color: '#075985',
                    textAlign: 'center',
                    margin: '0 0 16px 0',
                  }}>
                    Check your inbox at <strong>{email}</strong>
                  </p>
                  <VerificationCodeInput
                    onComplete={handleVerificationComplete}
                    disabled={loading}
                  />
                  {verificationCode && (
                    <div style={{
                      textAlign: 'center',
                      marginTop: '12px',
                      color: '#059669',
                      fontSize: '14px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}>
                      ✓ Code verified!
                    </div>
                  )}
                  <div style={{ textAlign: 'center', marginTop: '16px' }}>
                    {resendTimer > 0 ? (
                      <span style={{
                        fontSize: '13px',
                        color: '#64748b',
                        background: '#f1f5f9',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        display: 'inline-block',
                      }}>
                        ⏱️ Resend in {resendTimer}s
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={sendVerificationCode}
                        disabled={loading}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#0369a1',
                          cursor: loading ? 'not-allowed' : 'pointer',
                          fontWeight: '600',
                          fontSize: '13px',
                          textDecoration: 'underline',
                          padding: '6px 12px',
                        }}
                      >
                        🔄 Resend Code
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#334155',
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setPasswordTouched(true)}
              required
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: `2px solid ${isSignup && passwordTouched && !passwordValidation.isValid ? '#ef4444' : '#e2e8f0'}`,
                borderRadius: '12px',
                fontSize: '15px',
                transition: 'all 0.2s',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => e.target.style.borderColor = isSignup && passwordTouched && !passwordValidation.isValid ? '#ef4444' : '#667eea'}
              onBlur={(e) => {
                setPasswordTouched(true);
                e.target.style.borderColor = !isSignup || passwordValidation.isValid ? '#e2e8f0' : '#ef4444';
              }}
            />
            {isSignup && (
              <div style={{
                marginTop: '12px',
                padding: '16px',
                background: '#f8fafc',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
              }}>
                <div style={{
                  fontWeight: '600',
                  marginBottom: '10px',
                  color: '#475569',
                  fontSize: '13px',
                }}>
                  Password Requirements:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {[
                    { key: 'minLength', text: '8+ characters' },
                    { key: 'hasUpperCase', text: 'Uppercase letter' },
                    { key: 'hasLowerCase', text: 'Lowercase letter' },
                    { key: 'hasNumber', text: 'Number' },
                    { key: 'hasSpecialChar', text: 'Special character' },
                  ].map(({ key, text }) => (
                    <div
                      key={key}
                      style={{
                        color: passwordValidation.requirements[key as keyof typeof passwordValidation.requirements] ? '#059669' : '#64748b',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontWeight: '500',
                      }}
                    >
                      <span style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: passwordValidation.requirements[key as keyof typeof passwordValidation.requirements] ? '#d1fae5' : '#f1f5f9',
                        fontSize: '11px',
                      }}>
                        {passwordValidation.requirements[key as keyof typeof passwordValidation.requirements] ? '✓' : '○'}
                      </span>
                      {text}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: loading
                ? '#cbd5e1'
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              boxShadow: loading ? 'none' : '0 4px 12px rgba(102, 126, 234, 0.4)',
              marginTop: '8px',
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = loading ? 'none' : '0 4px 12px rgba(102, 126, 234, 0.4)';
            }}
          >
            {loading ? '⟳ Please wait...' : isSignup ? '🚀 Create Account' : '👋 Sign In'}
          </button>
        </form>

        {/* Error Message */}
        {error && (
          <div style={{
            marginTop: '20px',
            padding: '14px 16px',
            backgroundColor: '#fef2f2',
            border: '2px solid #fecaca',
            borderRadius: '12px',
            color: '#dc2626',
            fontSize: '14px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span>⚠️</span>
            {error}
          </div>
        )}

        {/* Toggle Login/Signup */}
        <div style={{
          marginTop: '24px',
          textAlign: 'center',
          fontSize: '14px',
          color: '#64748b',
        }}>
          {isSignup ? (
            <>
              Already have an account?{' '}
              <button
                onClick={() => {
                  setIsSignup(false);
                  setShowVerification(false);
                  setVerificationCode('');
                  setError(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#667eea',
                  cursor: 'pointer',
                  fontWeight: '600',
                  textDecoration: 'none',
                  padding: 0,
                }}
                onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
              >
                Sign In
              </button>
            </>
          ) : (
            <>
              Don't have an account?{' '}
              <button
                onClick={() => {
                  setIsSignup(true);
                  setError(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#667eea',
                  cursor: 'pointer',
                  fontWeight: '600',
                  textDecoration: 'none',
                  padding: 0,
                }}
                onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
