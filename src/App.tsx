import { Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { CourseBuilder } from './pages/CourseBuilder';
import { CoursePlayer } from './pages/CoursePlayer';
import { CertificateView } from './pages/CertificateView';
import { ResetPassword } from './pages/ResetPassword';
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AdminRoute } from './components/auth/AdminRoute';
import { CookieConsent } from './components/CookieConsent';

function App() {
  const location = useLocation();
  const isDashboard = location.pathname === '/dashboard';
  const isAdmin = location.pathname === '/admin' || location.pathname.startsWith('/admin/');
  const isCoursePlayer = location.pathname.startsWith('/course/');
  const isCertificate = location.pathname.startsWith('/certificate/');
  // Determine if we need to fetch settings (public pages only)
  const isPublicPage = !isDashboard && !isAdmin && !isCoursePlayer && !isCertificate;

  const [heroImage, setHeroImage] = useState<string | null>(null);
  const [heroPosition, setHeroPosition] = useState<string>('center top');
  const [loadingSettings, setLoadingSettings] = useState(true);

  useEffect(() => {
    if (isDashboard || isCoursePlayer || isAdmin) {
      document.documentElement.classList.add('light-mode');
    } else {
      document.documentElement.classList.remove('light-mode');
    }
  }, [isDashboard, isCoursePlayer, isAdmin]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await supabase
          .from('site_settings')
          .select('hero_bg_image, hero_bg_position')
          .eq('id', 1)
          .single();

        if (data) {
          setHeroImage(data.hero_bg_image || null);
          setHeroPosition(data.hero_bg_position || 'center top');
        }
      } catch (error) {
        console.error('Failed to load site settings', error);
      } finally {
        setLoadingSettings(false);
      }
    };

    fetchSettings();
  }, []); // Run once on mount to get global site settings

  if (loadingSettings) {
    return null; // Or a minimal loading spinner to avoid FOUC
  }

  return (
    <>
      <div
        className="global-hero-background"
        style={{
          backgroundImage: heroImage ? `url(${heroImage})` : undefined,
          backgroundPosition: heroPosition,
          opacity: isPublicPage ? 1 : 0.4, // Dim background on dashboard/admin pages for readability
          filter: isPublicPage ? 'none' : 'blur(5px)' // Add subtle blur on management pages
        }}
      />
      {!isDashboard && !isCoursePlayer && !location.pathname.includes('/admin/course/') && !isAdmin && !isCertificate && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Protected Student Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/course/:courseId" element={<ProtectedRoute><CoursePlayer /></ProtectedRoute>} />
        <Route path="/course/:courseId/lesson/:lessonId" element={<ProtectedRoute><CoursePlayer /></ProtectedRoute>} />

        {/* Protected Admin Routes */}
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/course/:courseId/builder" element={<AdminRoute><CourseBuilder /></AdminRoute>} />

        {/* Public Certificate View (usually public for verification) */}
        <Route path="/certificate/:id" element={<CertificateView />} />
      </Routes>
      <CookieConsent />
    </>
  );
}

export default App;
