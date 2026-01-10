import { Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { CourseBuilder } from './pages/CourseBuilder';
import { CoursePlayer } from './pages/CoursePlayer';
import { useEffect } from 'react';

function App() {
  const location = useLocation();
  const isDashboard = location.pathname === '/dashboard';
  const isAdmin = location.pathname === '/admin' || location.pathname.startsWith('/admin/');
  const isCoursePlayer = location.pathname.startsWith('/course/');

  useEffect(() => {
    if (isDashboard || isCoursePlayer || isAdmin) {
      document.documentElement.classList.add('light-mode');
    } else {
      document.documentElement.classList.remove('light-mode');
    }
  }, [isDashboard, isCoursePlayer, isAdmin]);

  return (
    <>
      {!isDashboard && !isCoursePlayer && !isAdmin && <div className="global-hero-background" />}
      {!isCoursePlayer && !location.pathname.includes('/admin/course/') && <Navbar />}
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
