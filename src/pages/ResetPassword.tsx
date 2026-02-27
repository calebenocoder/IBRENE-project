import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export const ResetPassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Check if we have a session (Supabase handles the link click by logging the user in temporarily)
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                // If no session, they shouldn't be here unless they just clicked a recovery link
                // Supabase typically handles the hash fragment automatically
            }
        };
        checkSession();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (password !== confirmPassword) {
            setError('As senhas não coincidem');
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres');
            setLoading(false);
            return;
        }

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) throw error;

            setSuccess(true);
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <div className="login-card">
                    <h2>Redefinir Senha</h2>
                    <p className="subtitle">Digite sua nova senha abaixo</p>

                    {error && <div className="error-message">{error}</div>}
                    {success && (
                        <div className="success-message">
                            Senha alterada com sucesso! Redirecionando...
                        </div>
                    )}

                    {!success && (
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label htmlFor="password">Nova Senha</label>
                                <input
                                    type="password"
                                    id="password"
                                    placeholder="Mínimo 6 caracteres"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="confirmPassword">Confirmar Nova Senha</label>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    placeholder="Repita a nova senha"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                            </div>

                            <button type="submit" className="btn-login" disabled={loading}>
                                {loading ? 'Salvando...' : 'Atualizar Senha'}
                            </button>
                        </form>
                    )}
                </div>
            </div>

            <style>{`
                .success-message {
                    background: #e8f5e9;
                    color: #2e7d32;
                    padding: 15px;
                    border-radius: 8px;
                    text-align: center;
                    margin-bottom: 20px;
                }
            `}</style>
        </div>
    );
};
