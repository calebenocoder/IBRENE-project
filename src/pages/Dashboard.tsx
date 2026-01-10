import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

interface Course {
  id: string; // Supabase uses UUID strings
  title: string;
  instructor: string;
  progress: number;
  gradient_css: string;
}

export const Dashboard: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('Estudante');
  const [userInitials, setUserInitials] = useState('ES');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Check Authentication & Get User
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          navigate('/login');
          return;
        }

        // Check if user is admin - redirect to admin dashboard
        if (user.user_metadata?.is_admin === true) {
          navigate('/admin');
          return;
        }

        // Set User Details
        if (user.user_metadata?.full_name) {
          setUserName(user.user_metadata.full_name);
          // Create initials
          const nameParts = user.user_metadata.full_name.split(' ');
          const initials = nameParts.length > 1
            ? nameParts[0][0] + nameParts[nameParts.length - 1][0]
            : nameParts[0][0] + nameParts[0][1];
          setUserInitials(initials.toUpperCase());
        }

        // 2. Fetch Courses
        const { data: coursesData, error: coursesError } = await supabase
          .from('courses')
          .select('*')
          .eq('published', true);

        if (coursesError) throw coursesError;

        if (coursesData) {
          // Map database columns to our UI requirements
          const formattedCourses = coursesData.map((c: any) => ({
            id: c.id,
            title: c.title,
            instructor: c.instructor,
            progress: 0, // Progress tracking will be implemented later
            gradient_css: c.gradient_css
          }));
          setCourses(formattedCourses);
        }

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  if (loading) {
    return (
      <div className="dashboard-page flex items-center justify-center">
        <p style={{ color: '#333', fontSize: '1.2rem' }}>Carregando seus cursos...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <header className="dashboard-header">
          <div>
            <h1>Painel do Aluno</h1>
            <p className="welcome-text">Bem-vindo de volta, {userName}.</p>
          </div>
          <div className="user-avatar">{userInitials}</div>
        </header>

        <section className="courses-section">
          <h2 className="section-title">Meus Cursos</h2>

          {courses.length === 0 ? (
            <div className="text-center" style={{ color: '#666', padding: '2rem' }}>
              <p>Nenhum curso encontrado. Verifique seu banco de dados.</p>
            </div>
          ) : (
            <div className="courses-grid">
              {courses.map(course => (
                <div key={course.id} className="course-card">
                  <div
                    className="course-image"
                    style={{ background: course.gradient_css || '#eee' }}
                  ></div>
                  <div className="course-content">
                    <h3 className="course-title">{course.title}</h3>
                    <p className="course-instructor">{course.instructor || 'Instrutor IBRENE'}</p>

                    <div className="progress-container">
                      <div className="progress-bar-bg">
                        <div
                          className="progress-bar-fill"
                          style={{ width: `${course.progress}%` }}
                        ></div>
                      </div>
                      <span className="progress-text">{course.progress}% concluído</span>
                    </div>

                    <button
                      className="btn-continue"
                      onClick={() => navigate(`/course/${course.id}`)}
                    >
                      {course.progress > 0 ? 'Continuar' : 'Iniciar'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div >

      <style>{`
        .dashboard-page {
          min-height: 100vh;
          padding-top: 100px; /* Space for navbar */
          padding-bottom: 40px;
          background-color: #f5f5f7; /* Solid off-white background */
          position: relative;
          z-index: 1; /* Ensure it sits on top of the fixed body background */
        }

        .dashboard-container {
          width: 90%;
          max-width: 1200px;
          margin: 0 auto;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 3rem;
          background: rgba(255, 255, 255, 0.95);
          padding: 2rem;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.05);
        }

        .dashboard-header h1 {
          font-size: 2rem;
          color: #1a1a1a;
          margin-bottom: 0.5rem;
        }

        .welcome-text {
          color: #666;
        }

        .user-avatar {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: #007bff;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.2rem;
        }

        .section-title {
          font-size: 1.5rem;
          color: #1a1a1a;
          margin-bottom: 1.5rem;
          font-weight: 600;
          text-shadow: none;
        }

        .courses-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 2rem;
        }

        .course-card {
          background: white;
          border-radius: 16px;
          overflow: hidden;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          border: 1px solid rgba(0,0,0,0.05);
        }

        .course-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 24px rgba(0,0,0,0.15);
        }

        .course-image {
          height: 140px;
          width: 100%;
        }

        .course-content {
          padding: 1.5rem;
        }

        .course-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: #333;
          margin-bottom: 0.5rem;
        }

        .course-instructor {
          font-size: 0.9rem;
          color: #888;
          margin-bottom: 1rem;
        }

        .progress-container {
          margin-bottom: 1.5rem;
        }

        .progress-bar-bg {
          height: 6px;
          background: #f0f0f0;
          border-radius: 3px;
          overflow: hidden;
          margin-bottom: 0.5rem;
        }

        .progress-bar-fill {
          height: 100%;
          background: #007bff;
          border-radius: 3px;
          transition: width 1s ease-out;
        }

        .progress-text {
          font-size: 0.8rem;
          color: #666;
        }

        .btn-continue {
          width: 100%;
          padding: 10px;
          background: transparent;
          border: 1px solid #007bff;
          color: #007bff;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-continue:hover {
          background: #007bff;
          color: white;
        }
      `}</style>
    </div >
  );
};
