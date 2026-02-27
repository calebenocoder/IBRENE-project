import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

interface TurnstileProps {
    onVerify: (token: string) => void;
    siteKey?: string;
}

export interface TurnstileHandle {
    reset: () => void;
}

declare global {
    interface Window {
        turnstile: any;
    }
}

export const Turnstile = forwardRef<TurnstileHandle, TurnstileProps>(({
    onVerify,
    siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA' // Fallback to testing key
}, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);

    useImperativeHandle(ref, () => ({
        reset: () => {
            if (widgetIdRef.current && window.turnstile) {
                window.turnstile.reset(widgetIdRef.current);
            }
        }
    }));

    useEffect(() => {
        let interval: any = null;

        const renderTurnstile = () => {
            if (window.turnstile && containerRef.current && !widgetIdRef.current) {
                try {
                    widgetIdRef.current = window.turnstile.render(containerRef.current, {
                        sitekey: siteKey,
                        callback: (token: string) => {
                            onVerify(token);
                        },
                    });
                } catch (err) {
                    console.error('Turnstile render error:', err);
                }
            }
        };

        if (window.turnstile) {
            renderTurnstile();
        } else {
            interval = setInterval(() => {
                if (window.turnstile) {
                    renderTurnstile();
                    clearInterval(interval);
                    interval = null;
                }
            }, 500);
        }

        return () => {
            if (interval) clearInterval(interval);
            if (widgetIdRef.current && window.turnstile) {
                window.turnstile.remove(widgetIdRef.current);
                widgetIdRef.current = null;
            }
        };
    }, [onVerify, siteKey]);

    return (
        <div ref={containerRef} className="turnstile-container" style={{ margin: '15px 0' }}></div>
    );
});
