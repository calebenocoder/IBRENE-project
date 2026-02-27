import React, { useState, useEffect } from 'react';

export const CookieConsent: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if user has already accepted cookies
        const consent = localStorage.getItem('ibrene-cookie-consent');
        if (!consent) {
            // Small delay for better UX (feels less intrusive)
            const timer = setTimeout(() => {
                setIsVisible(true);
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('ibrene-cookie-consent', 'accepted');
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="cookie-banner-overlay">
            <div className="cookie-banner">
                <div className="cookie-content">
                    <div className="cookie-icon">🍪</div>
                    <div className="cookie-text">
                        <h3>Privacidade e Cookies</h3>
                        <p>
                            Utilizamos cookies para melhorar sua experiência e segurança em nossa plataforma.
                            Ao continuar navegando, você concorda com nossa política de privacidade.
                        </p>
                    </div>
                </div>
                <div className="cookie-actions">
                    <button onClick={handleAccept} className="btn-accept">Aceitar</button>
                    <button className="btn-policy" onClick={() => window.open('/policy', '_blank')}>
                        Ver Política
                    </button>
                </div>
            </div>

            <style>{`
                .cookie-banner-overlay {
                    position: fixed;
                    bottom: 24px;
                    left: 24px;
                    right: 24px;
                    z-index: 9999;
                    display: flex;
                    justify-content: center;
                    pointer-events: none;
                }

                .cookie-banner {
                    background: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
                    padding: 24px;
                    border-radius: 20px;
                    max-width: 600px;
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    justify-content: space-between;
                    gap: 32px;
                    pointer-events: auto;
                    animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
                }

                @media (max-width: 768px) {
                    .cookie-banner {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 20px;
                        padding: 20px;
                    }
                }

                @keyframes slideUp {
                    from { transform: translateY(100px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }

                .cookie-content {
                    display: flex;
                    align-items: flex-start;
                    gap: 16px;
                }

                .cookie-icon {
                    font-size: 24px;
                }

                .cookie-text h3 {
                    margin: 0 0 4px 0;
                    font-size: 16px;
                    font-weight: 600;
                    color: #0f172a;
                }

                .cookie-text p {
                    margin: 0;
                    font-size: 14px;
                    line-height: 1.5;
                    color: #64748b;
                }

                .cookie-actions {
                    display: flex;
                    gap: 12px;
                    white-space: nowrap;
                }

                .btn-accept {
                    background: #2563eb;
                    color: white;
                    border: none;
                    padding: 10px 24px;
                    border-radius: 12px;
                    font-weight: 600;
                    font-size: 14px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .btn-accept:hover {
                    background: #1d4ed8;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
                }

                .btn-policy {
                    background: transparent;
                    color: #64748b;
                    border: 1px solid #e2e8f0;
                    padding: 10px 20px;
                    border-radius: 12px;
                    font-weight: 600;
                    font-size: 14px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .btn-policy:hover {
                    background: #f8fafc;
                    border-color: #cbd5e1;
                    color: #0f172a;
                }
            `}</style>
        </div>
    );
};
