import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface UserSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    uid: string;
}

interface ProfileData {
    full_name: string;
    birth_date: string;
    phone: string;
    email: string;
}

export const UserSettingsModal: React.FC<UserSettingsModalProps> = ({ isOpen, onClose, uid }) => {
    const [loading, setLoading] = useState(false);
    const [profile, setProfile] = useState<ProfileData>({
        full_name: '',
        birth_date: '',
        phone: '',
        email: '',
    });
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        if (isOpen && uid) {
            loadProfile();
        }
    }, [isOpen, uid]);

    const loadProfile = async () => {
        try {
            setLoading(true);
            // Try fetching from profiles table
            let { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', uid)
                .single();

            if (error && error.code !== 'PGRST116') {
                throw error;
            }

            // If no profile exists yet, fallback to auth data and create strict structure
            if (!data) {
                const { data: { user } } = await supabase.auth.getUser();
                data = {
                    full_name: user?.user_metadata?.full_name || '',
                    email: user?.email || '',
                    birth_date: '',
                    phone: '',
                };
            } else {
                // Ensure email is always current from auth if not in profile
                const { data: { user } } = await supabase.auth.getUser();
                if (user?.email) data.email = user.email;
            }

            setProfile({
                full_name: data.full_name || '',
                birth_date: data.birth_date || '',
                phone: data.phone || '',
                email: data.email || '',
            });
        } catch (err) {
            console.error('Error loading profile:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const updates = {
                id: uid,
                full_name: profile.full_name,
                birth_date: profile.birth_date || null,
                phone: profile.phone || null,
                updated_at: new Date().toISOString(),
            };

            const { error } = await supabase
                .from('profiles')
                .upsert(updates);

            if (error) throw error;

            // Also update auth metadata for sync
            await supabase.auth.updateUser({
                data: { full_name: profile.full_name }
            });

            setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });

            // Close after delay
            setTimeout(() => {
                onClose();
                window.location.reload(); // Simple way to refresh dashboard data
            }, 1500);

        } catch (err: any) {
            setMessage({ type: 'error', text: 'Erro ao salvar: ' + err.message });
        } finally {
            setLoading(false);
        }
    };

    const handleChangeEmail = async () => {
        // This uses Supabase's secure verification flow
        if (!profile.email) return;
        try {
            setLoading(true);
            const { error } = await supabase.auth.updateUser({ email: profile.email });
            if (error) throw error;
            setMessage({ type: 'success', text: 'Link de verificação enviado para o novo email (e para o antigo).' });
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async () => {
        if (!profile.email) return;
        try {
            setLoading(true);
            const { error } = await supabase.auth.resetPasswordForEmail(profile.email, {
                redirectTo: window.location.origin + '/reset-password',
            });
            if (error) throw error;
            setMessage({ type: 'success', text: 'Link de redefinição de senha enviado para seu email.' });
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setLoading(false);
        }
    }

    if (!isOpen) return null;

    return (
        <div className="settings-modal-overlay" onClick={onClose}>
            <div className="settings-modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Configurações do Perfil</h2>
                    <button className="btn-close" onClick={onClose}>×</button>
                </div>

                {message && (
                    <div className={`message-alert ${message.type}`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSaveProfile} className="settings-form">
                    <div className="form-group">
                        <label>Nome Completo</label>
                        <input
                            type="text"
                            required
                            value={profile.full_name}
                            onChange={e => setProfile({ ...profile, full_name: e.target.value })}
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Data de Nascimento</label>
                            <input
                                type="date"
                                value={profile.birth_date}
                                onChange={e => setProfile({ ...profile, birth_date: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Telefone / WhatsApp</label>
                            <input
                                type="tel"
                                placeholder="(00) 00000-0000"
                                value={profile.phone}
                                onChange={e => setProfile({ ...profile, phone: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="form-divider">
                        <span>Segurança e Login</span>
                    </div>

                    <div className="form-group auth-group">
                        <label>Email (Requer verificação)</label>
                        <div className="input-with-button">
                            <input
                                type="email"
                                value={profile.email}
                                onChange={e => setProfile({ ...profile, email: e.target.value })}
                            />
                            <button type="button" className="btn-secondary" onClick={handleChangeEmail}>
                                Alterar Email
                            </button>
                        </div>
                        <p className="help-text">Você receberá um link de confirmação.</p>
                    </div>

                    <div className="form-group auth-group">
                        <label>Senha</label>
                        <button type="button" className="btn-outline-danger" onClick={handleChangePassword}>
                            Enviar Link de Redefinição de Senha
                        </button>
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn-cancel" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn-save" disabled={loading}>
                            {loading ? 'Salvando...' : 'Salvar Alterações'}
                        </button>
                    </div>
                </form>
            </div>

            <style>{`
        .settings-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 2000;
          backdrop-filter: blur(4px);
        }

        .settings-modal-content {
          background: white;
          width: 90%;
          max-width: 500px;
          border-radius: 12px;
          padding: 2rem;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .modal-header h2 {
          margin: 0;
          font-size: 1.5rem;
          color: #1a1a1a;
        }

        .btn-close {
          background: none;
          border: none;
          font-size: 2rem;
          color: #666;
          cursor: pointer;
          line-height: 1;
        }

        .settings-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-row {
            display: flex;
            gap: 1rem;
        }
        .form-row .form-group {
            flex: 1;
        }

        .form-group label {
          font-size: 0.9rem;
          font-weight: 600;
          color: #4b5563;
        }

        .form-group input {
          padding: 0.75rem;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          font-size: 1rem;
          transition: border-color 0.2s;
        }
        .form-group input:focus {
            border-color: #3b82f6;
            outline: none;
        }

        .form-divider {
            margin: 0.5rem 0;
            border-bottom: 1px solid #e5e7eb;
            line-height: 0.1em;
            text-align: left;
        }
        .form-divider span {
             background:#fff; 
             padding-right: 10px; 
             font-size: 0.85rem;
             color: #9ca3af;
             font-weight: 600;
             text-transform: uppercase;
        }

        .input-with-button {
            display: flex;
            gap: 0.5rem;
        }
        .input-with-button input {
            flex: 1;
        }

        .help-text {
            font-size: 0.8rem;
            color: #6b7280;
            margin: 0;
        }

        .message-alert {
            padding: 0.75rem;
            border-radius: 6px;
            font-size: 0.9rem;
            margin-bottom: 1rem;
        }
        .message-alert.success {
            background: #ecfdf5;
            color: #065f46;
            border: 1px solid #a7f3d0;
        }
        .message-alert.error {
            background: #fef2f2;
            color: #991b1b;
            border: 1px solid #fecaca;
        }

        .modal-actions {
            display: flex;
            justify-content: flex-end;
            gap: 1rem;
            margin-top: 1rem;
            padding-top: 1rem;
            border-top: 1px solid #f3f4f6;
        }

        .btn-cancel {
            padding: 0.75rem 1.5rem;
            background: #f3f4f6;
            color: #4b5563;
            border: none;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
        }
        .btn-save {
            padding: 0.75rem 1.5rem;
            background: #3b82f6;
            color: white;
            border: none;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
        }
        .btn-save:disabled {
            opacity: 0.7;
            cursor: not-allowed;
        }
        
        .btn-secondary {
            padding: 0 1rem;
            background: #e5e7eb;
            color: #374151;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 500;
        }
        
        .btn-outline-danger {
             padding: 0.75rem;
             background: transparent;
             border: 1px solid #ef4444;
             color: #ef4444;
             border-radius: 6px;
             font-weight: 600;
             cursor: pointer;
             width: 100%;
        }
        .btn-outline-danger:hover {
            background: #fef2f2;
        }

      `}</style>
        </div>
    );
};
