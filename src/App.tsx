import { Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { CourseBuilder } from './pages/CourseBuilder';
import { CoursePlayer } from './pages/CoursePlayer';
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';

function App() {
  const location = useLocation();
  const isDashboard = location.pathname === '/dashboard';
  const isAdmin = location.pathname === '/admin' || location.pathname.startsWith('/admin/');
  const isCoursePlayer = location.pathname.startsWith('/course/');
  const [heroImage, setHeroImage] = useState<string | null>(null);
  const [heroPosition, setHeroPosition] = useState<string>('center top');

  useEffect(() => {
    if (isDashboard || isCoursePlayer || isAdmin) {
      document.documentElement.classList.add('light-mode');
    } else {
      document.documentElement.classList.remove('light-mode');
    }
  }, [isDashboard, isCoursePlayer, isAdmin]);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('hero_bg_image, hero_bg_position')
        .eq('id', 1)
        .single();

      if (data) {
        if (data.hero_bg_image) setHeroImage(data.hero_bg_image);
        if (data.hero_bg_position) setHeroPosition(data.hero_bg_position);
      }
    };
    fetchSettings();
  }, []);

  return (
    <>
      {!isDashboard && !isCoursePlayer && !isAdmin && (
        <div
          className="global-hero-background"
          style={{
            backgroundImage: heroImage ? `url(${heroImage})` : undefined,
            backgroundPosition: heroPosition
          }}
        />
      )}
      {!isDashboard && !isCoursePlayer && !location.pathname.includes('/admin/course/') && !isAdmin && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/course/:courseId/builder" element={<CourseBuilder />} />
        <Route path="/course/:courseId" element={<CoursePlayer />} />
        <Route path="/course/:courseId/lesson/:lessonId" element={<CoursePlayer />} />
      </Routes>
    </>
  );
}

export default App;
