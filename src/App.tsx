import { Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { CourseBuilder } from './pages/CourseBuilder';
import { CoursePlayer } from './pages/CoursePlayer';
import { CertificateView } from './pages/CertificateView';
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';

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
  const [loadingSettings, setLoadingSettings] = useState(isPublicPage);

  useEffect(() => {
    if (isDashboard || isCoursePlayer || isAdmin) {
      document.documentElement.classList.add('light-mode');
    } else {
      document.documentElement.classList.remove('light-mode');
    }
  }, [isDashboard, isCoursePlayer, isAdmin]);

  useEffect(() => {
    // If not a public page, we don't need to block for settings
    if (!isPublicPage) {
      setLoadingSettings(false);
      return;
    }

    const fetchSettings = async () => {
      try {
        const { data } = await supabase
          .from('site_settings')
          .select('hero_bg_image, hero_bg_position')
          .eq('id', 1)
          .single();

        if (data) {
          if (data.hero_bg_image) setHeroImage(data.hero_bg_image);
          if (data.hero_bg_position) setHeroPosition(data.hero_bg_position);
        }
      } catch (error) {
        console.error('Failed to load site settings', error);
      } finally {
        setLoadingSettings(false);
      }
    };

    fetchSettings();
  }, [isPublicPage]); // Refetch if moving between public/private contexts, though usually full reload

  if (loadingSettings) {
    return null; // Or a minimal loading spinner to avoid FOUC
  }

  return (
    <>
      {isPublicPage && (
        <div
          className="global-hero-background"
          style={{
            backgroundImage: heroImage ? `url(${heroImage})` : undefined,
            backgroundPosition: heroPosition,
            opacity: 1 // Ensure it's visible once loaded
          }}
        />
      )}
      {!isDashboard && !isCoursePlayer && !location.pathname.includes('/admin/course/') && !isAdmin && !isCertificate && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/course/:courseId/builder" element={<CourseBuilder />} />
        <Route path="/course/:courseId" element={<CoursePlayer />} />
        <Route path="/course/:courseId/lesson/:lessonId" element={<CoursePlayer />} />
        <Route path="/certificate/:id" element={<CertificateView />} />
      </Routes>
    </>
  );
}

export default App;
