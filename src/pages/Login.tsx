import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Turnstile } from '../components/Turnstile';
import type { TurnstileHandle } from '../components/Turnstile';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const turnstileRef = React.useRef<TurnstileHandle>(null);
  const navigate = useNavigate();

  const handleCaptchaVerify = useCallback((token: string) => {
    setCaptchaToken(token);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    if (!captchaToken) {
      setError('Por favor, complete o desafio de segurança (Captcha).');
      setLoading(false);
      return;
    }

    try {
      if (isForgotPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + '/reset-password',
          captchaToken: captchaToken || undefined,
        });
        if (error) throw error;
        setSuccessMessage('Email de recuperação enviado! Verifique sua caixa de entrada.');
      } else if (isSignUp) {
        if (password !== confirmPassword) {
          throw new Error('As senhas não coincidem');
        }

        if (password.length < 6) {
          throw new Error('A senha deve ter pelo menos 6 caracteres');
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            captchaToken: captchaToken || undefined,
            data: {
              full_name: fullName,
              birth_date: birthDate,
              avatar_url: 'https://ui-avatars.com/api/?background=random&name=' + encodeURIComponent(fullName || email)
            }
          }
        });
        if (error) throw error;
        setSuccessMessage('Verifique seu email para o link de confirmação!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
          options: {
            captchaToken: captchaToken || undefined,
          }
        });
        if (error) throw error;
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message);
      // Reset captcha on any error to allow immediate retry
      setCaptchaToken(null);
      turnstileRef.current?.reset();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <h2>
            {successMessage ? 'Verifique seu Email' : (isForgotPassword ? 'Recuperar Senha' : (isSignUp ? 'Criar Conta' : 'Bem-vindo de volta'))}
          </h2>
          <p className="subtitle">
            {successMessage
              ? 'Enviamos instruções importantes para você.'
              : (isForgotPassword
                ? 'Enviaremos um link para redefinir sua senha'
                : (isSignUp ? 'Registre-se para começar' : 'Faça login para acessar sua conta'))}
          </p>

          {error && <div className="error-message">{error}</div>}
          {successMessage && <div className="success-message">{successMessage}</div>}

          {!successMessage ? (
            <>
              <form onSubmit={handleSubmit}>
                {isSignUp && (
                  <div className="form-group">
                    <label htmlFor="fullName">Nome Completo</label>
                    <input
                      type="text"
                      id="fullName"
                      placeholder="Seu nome completo"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                )}

                {isSignUp && (
                  <div className="form-group">
                    <label htmlFor="birthDate">Data de Nascimento</label>
                    <input
                      type="date"
                      id="birthDate"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      required
                    />
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                {!isForgotPassword && (
                  <div className="form-group">
                    <label htmlFor="password">Senha</label>
                    <input
                      type="password"
                      id="password"
                      placeholder="Sua senha"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                )}

                {!isSignUp && !isForgotPassword && (
                  <div className="forgot-password-link">
                    <button
                      type="button"
                      className="btn-link"
                      onClick={() => setIsForgotPassword(true)}
                    >
                      Esqueci minha senha
                    </button>
                  </div>
                )}

                {isSignUp && (
                  <div className="form-group">
                    <label htmlFor="confirmPassword">Confirmar Senha</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      placeholder="Confirme sua senha"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                )}

                <Turnstile ref={turnstileRef} onVerify={handleCaptchaVerify} />

                <button type="submit" className="btn-login" disabled={loading}>
                  {loading ? 'Carregando...' : (isForgotPassword ? 'Enviar Link' : (isSignUp ? 'Cadastrar' : 'Entrar'))}
                </button>
              </form>

              <div className="login-footer">
                <button
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setIsForgotPassword(false);
                  }}
                  className="btn-link"
                >
                  {isSignUp ? 'Já tem uma conta? Entrar' : 'Não tem conta? Registre-se'}
                </button>
                {isForgotPassword && (
                  <button
                    onClick={() => setIsForgotPassword(false)}
                    className="btn-link"
                  >
                    Voltar para o login
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="login-footer">
              <button
                onClick={() => {
                  setSuccessMessage(null);
                  setIsSignUp(false);
                  setIsForgotPassword(false);
                }}
                className="btn-login"
                style={{ marginTop: '20px' }}
              >
                Voltar para o Login
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .login-container {
          width: 100%;
          max-width: 400px;
          animation: fadeIn 0.8s ease-out;
        }

        .login-card {
          background: #ffffff;
          border-radius: 24px;
          padding: 40px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
          color: #333;
        }

        h2 {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          text-align: center;
          color: #1a1a1a;
          background: none;
          -webkit-text-fill-color: initial;
        }

        .subtitle {
          text-align: center;
          color: #666;
          margin-bottom: 2rem;
          font-size: 0.95rem;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        label {
          display: block;
          margin-bottom: 0.5rem;
          font-size: 0.9rem;
          font-weight: 500;
          color: #444;
          margin-left: 4px;
        }

        input {
          width: 100%;
          padding: 12px 16px;
          background: #f5f5f7;
          border: 1px solid #e1e1e1;
          border-radius: 12px;
          color: #333;
          font-size: 1rem;
          transition: all 0.3s ease;
        }

        input:focus {
          outline: none;
          background: #fff;
          border-color: #007bff;
          box-shadow: 0 0 0 4px rgba(0, 123, 255, 0.1);
        }

        input::placeholder {
          color: #999;
        }

        .btn-login {
          width: 100%;
          padding: 14px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 0.5rem;
        }

        .btn-login:hover {
          background: #0056b3;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
        }

        .login-footer {
          margin-top: 1.5rem;
          text-align: center;
        }

        .login-footer .btn-link {
          background: none;
          border: none;
          color: #007bff;
          cursor: pointer;
          font-size: 0.9rem;
          text-decoration: underline;
        }

        .error-message {
          background: #ffebee;
          color: #c62828;
          padding: 10px;
          border-radius: 8px;
          margin-bottom: 1rem;
          text-align: center;
          font-size: 0.9rem;
        }

        .success-message {
          background: #e8f5e9;
          color: #2e7d32;
          padding: 10px;
          border-radius: 8px;
          margin-bottom: 1rem;
          text-align: center;
          font-size: 0.9rem;
        }

        .forgot-password-link {
          text-align: right;
          margin-top: -0.75rem;
          margin-bottom: 1.5rem;
        }

        .forgot-password-link .btn-link {
            font-size: 0.8rem;
            color: #666;
            background: none;
            border: none;
            cursor: pointer;
            text-decoration: none;
        }
        
        .forgot-password-link .btn-link:hover {
            color: #007bff;
            text-decoration: underline;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};
