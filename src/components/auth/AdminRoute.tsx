import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

interface AdminRouteProps {
    children: React.ReactNode;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const checkAdmin = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();

                if (!user) {
                    setIsAdmin(false);
                    return;
                }

                // 1. Quick check via JWT metadata
                let adminStatus = user.user_metadata?.is_admin === true ||
                    user.app_metadata?.role === 'admin';

                // 2. Verified check via database profile
                if (!adminStatus) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('role')
                        .eq('id', user.id)
                        .single();

                    adminStatus = profile?.role === 'admin';
                }

                setIsAdmin(adminStatus);
            } catch (error) {
                console.error('Admin check error:', error);
                setIsAdmin(false);
            } finally {
                setLoading(false);
            }
        };

        checkAdmin();
    }, []);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <div className="spinner"></div>
            </div>
        );
    }

    if (!isAdmin) {
        // Redirect to standard dashboard if not an admin
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
};
