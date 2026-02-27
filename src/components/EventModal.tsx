import React, { useEffect, useState } from 'react';

interface EventModalProps {
    event: {
        id: string;
        title: string;
        description?: string;
        category?: string;
        date: { day: string; month: string; year: string };
        image: string;
        content?: string; // Full HTML content
        slug?: string;
    };
    onClose: () => void;
}

export const EventModal: React.FC<EventModalProps> = ({ event, onClose }) => {
    const [copied, setCopied] = useState(false);

    // Prevent background scrolling when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    // Close on escape key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    const handleShare = () => {
        const url = new URL(window.location.href);
        url.searchParams.set('evento', event.slug || '');
        const shareUrl = url.toString();

        // Standard clipboard API (requires secure context)
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(shareUrl)
                .then(() => {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                })
                .catch(() => fallbackCopy(shareUrl));
        } else {
            fallbackCopy(shareUrl);
        }
    };

    const fallbackCopy = (text: string) => {
        const textArea = document.createElement("textarea");
        textArea.value = text;

        // Ensure textarea is not visible but part of the document
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);

        textArea.focus();
        textArea.select();

        try {
            document.execCommand('copy');
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Fallback copy failed', err);
        }

        document.body.removeChild(textArea);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose} aria-label="Close">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>

                <div className="modal-hero-image" style={{ backgroundImage: `url(${event.image})` }}>
                    <div className="hero-gradient"></div>
                </div>

                <div className="modal-content-wrapper">
                    <div className="modal-header">
                        <div className="meta-badge-row">
                            <div className="meta-badge">
                                <span className="category">{event.category}</span>
                                <span className="separator">•</span>
                                <span className="date">{event.date.day} {event.date.month} {event.date.year}</span>
                            </div>
                            <button
                                className={`btn-share ${copied ? 'copied' : ''}`}
                                onClick={handleShare}
                                title="Compartilhar evento"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                                    <polyline points="16 6 12 2 8 6"></polyline>
                                    <line x1="12" y1="2" x2="12" y2="15"></line>
                                </svg>
                                {copied ? 'Link Copiado!' : 'Compartilhar'}
                            </button>
                        </div>
                        <h2 className="modal-title">{event.title}</h2>
                        {event.description && <h3 className="modal-subtitle">{event.description}</h3>}
                    </div>

                    <div className="modal-body">
                        {event.content ? (
                            <div className="rich-text" dangerouslySetInnerHTML={{ __html: event.content }} />
                        ) : (
                            <p className="placeholder-text">Detalhes completos em breve.</p>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                .modal-overlay {
                    position: fixed;
                    inset: 0;
                    background-color: rgba(15, 23, 42, 0.6);
                    backdrop-filter: blur(8px);
                    z-index: 9999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 1.5rem;
                    animation: fadeIn 0.3s ease-out;
                }

                .modal-container {
                    background: white;
                    width: 100%;
                    max-width: 800px;
                    max-height: 90vh;
                    border-radius: 1.5rem;
                    overflow-y: auto;
                    position: relative;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                    animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                }

                .close-btn {
                    position: absolute;
                    top: 1.5rem;
                    right: 1.5rem;
                    width: 40px;
                    height: 40px;
                    background: rgba(255, 255, 255, 0.9);
                    backdrop-filter: blur(4px);
                    border: none;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    z-index: 10;
                    transition: all 0.2s;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                    color: #1e293b;
                }

                .close-btn:hover {
                    background: white;
                    transform: scale(1.1);
                }

                .modal-hero-image {
                    height: 320px;
                    background-size: cover;
                    background-position: center;
                    position: relative;
                }

                .hero-gradient {
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(to bottom, rgba(0,0,0,0) 60%, rgba(255,255,255,1) 100%);
                }

                .modal-content-wrapper {
                    padding: 0 3rem 4rem 3rem;
                    position: relative;
                    margin-top: -2rem; /* Pull text up slightly */
                }

                .modal-header {
                    margin-bottom: 2.5rem;
                }

                .meta-badge-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
                    flex-wrap: wrap;
                    gap: 1rem;
                }

                .btn-share {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    background: #f1f5f9;
                    border: none;
                    padding: 0.5rem 1rem;
                    border-radius: 9999px;
                    font-size: 0.875rem;
                    font-weight: 600;
                    color: #475569;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .btn-share:hover {
                    background: #e2e8f0;
                    color: #1e293b;
                }

                .btn-share.copied {
                    background: #dcfce7;
                    color: #166534;
                }

                .meta-badge {
                    display: inline-flex;
                    align-items: center;
                    background: #f1f5f9;
                    padding: 0.5rem 1rem;
                    border-radius: 9999px;
                    font-size: 0.875rem;
                    color: #64748b;
                    font-weight: 500;
                }

                .meta-badge .category {
                    color: var(--color-accent, #2563eb);
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .meta-badge .separator {
                    margin: 0 0.75rem;
                    opacity: 0.5;
                }

                .modal-title {
                    font-size: 2.5rem;
                    line-height: 1.1;
                    color: #0f172a;
                    font-weight: 800;
                    margin-bottom: 0.75rem;
                    letter-spacing: -0.02em;
                }

                .modal-subtitle {
                    font-size: 1.125rem;
                    color: #64748b;
                    font-weight: 400;
                    font-style: italic;
                    margin-bottom: 0;
                }

                /* Rich Text Styles for News Layout */
                .modal-body .rich-text {
                    font-size: 1.125rem;
                    line-height: 1.8;
                    color: #334155;
                }

                .modal-body p { margin-bottom: 1.5rem; }
                .modal-body h2 { font-size: 1.75rem; font-weight: 700; color: #1e293b; margin: 2rem 0 1rem; }
                .modal-body h3 { font-size: 1.5rem; font-weight: 600; color: #1e293b; margin: 1.5rem 0 1rem; }
                .modal-body ul, .modal-body ol { margin-bottom: 1.5rem; padding-left: 1.5rem; }
                .modal-body li { margin-bottom: 0.5rem; }
                .modal-body blockquote {
                    border-left: 4px solid var(--color-accent, #2563eb);
                    padding-left: 1.5rem;
                    font-style: italic;
                    color: #475569;
                    margin: 1.5rem 0;
                }
                .modal-body img {
                    border-radius: 0.75rem;
                    margin: 1.5rem 0;
                    max-width: 100%;
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(40px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }

                @media (max-width: 640px) {
                    .modal-content-wrapper { padding: 0 1.5rem 3rem 1.5rem; }
                    .modal-hero-image { height: 240px; }
                    .modal-title { font-size: 1.75rem; }
                }
            `}</style>
        </div>
    );
};
