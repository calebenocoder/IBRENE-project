import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import logo from '../assets/logo.png';
import { CertificateModal } from '../components/CertificateModal';
import { UserSettingsModal } from '../components/UserSettingsModal';

interface Course {
  id: string; // Supabase uses UUID strings
  title: string;
  instructor: string;
  progress: number;
  gradient_css: string;
  certificate_id?: string;
}

export const Dashboard: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('Estudante');
  const [userInitials, setUserInitials] = useState('ES');
  const [userId, setUserId] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedCertificateId, setSelectedCertificateId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
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

        setUserId(user.id);

        // Check for profile data first, fallback to metadata
        let { data: profile } = await supabase
          .from('profiles')
          .select('full_name, role')
          .eq('id', user.id)
          .single();

        setIsAdmin(
          profile?.role === 'admin' ||
          user.user_metadata?.is_admin === true ||
          user.app_metadata?.role === 'admin'
        );
        const displayedName = profile?.full_name || user.user_metadata?.full_name || 'Estudante';
        setUserName(displayedName);

        // Create initials
        const nameParts = displayedName.split(' ');
        const initials = nameParts.length > 1
          ? nameParts[0][0] + nameParts[nameParts.length - 1][0]
          : nameParts[0][0] + (nameParts[0][1] || 'S');
        setUserInitials(initials.toUpperCase());

        // 2. Fetch Courses with lesson counts
        const { data: coursesData, error: coursesError } = await supabase
          .from('courses')
          .select(`
            *,
            modules (
              id,
              lessons (
                id
              )
            )
          `)
          .eq('published', true);

        if (coursesError) throw coursesError;

        // 3. Fetch user progress
        const { data: progressData, error: progressError } = await supabase
          .from('user_progress')
          .select('lesson_id, completed')
          .eq('user_id', user.id)
          .eq('completed', true);

        if (progressError) throw progressError;

        // 4. Fetch certificates
        const { data: certsData, error: certsError } = await supabase
          .from('certificates')
          .select('id, course_id')
          .eq('user_id', user.id);

        if (certsError) console.error('Error fetching certificates:', certsError);

        const certMap = new Map();
        certsData?.forEach(cert => {
          certMap.set(cert.course_id, cert.id);
        });

        // Create a set of completed lesson IDs for quick lookup
        const completedLessonIds = new Set(progressData?.map(p => p.lesson_id) || []);

        if (coursesData) {
          // Map database columns to our UI requirements with calculated progress
          const formattedCourses = coursesData.map((c: any) => {
            // Count total lessons across all modules
            const totalLessons = c.modules?.reduce((total: number, module: any) => {
              return total + (module.lessons?.length || 0);
            }, 0) || 0;

            // Count completed lessons for this course
            const completedLessons = c.modules?.reduce((completed: number, module: any) => {
              const moduleLessons = module.lessons || [];
              const moduleCompleted = moduleLessons.filter((lesson: any) =>
                completedLessonIds.has(lesson.id)
              ).length;
              return completed + moduleCompleted;
            }, 0) || 0;

            // Calculate progress percentage
            const progress = totalLessons > 0
              ? Math.round((completedLessons / totalLessons) * 100)
              : 0;

            return {
              id: c.id,
              title: c.title,
              instructor: c.instructor,
              progress,
              gradient_css: c.gradient_css,
              certificate_id: certMap.get(c.id)
            };
          });
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const filteredCourses = React.useMemo(() => {
    if (!searchQuery) return courses;
    const lowerQuery = searchQuery.toLowerCase();
    return courses.filter(course =>
      course.title.toLowerCase().includes(lowerQuery) ||
      course.instructor.toLowerCase().includes(lowerQuery)
    );
  }, [courses, searchQuery]);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-content">
          <div className="spinner"></div>
          <p>Carregando seus cursos...</p>
        </div>
        <style>{`
          .dashboard-loading {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f8fafc;
          }

          .loading-content {
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 20px;
          }

          .dashboard-loading p {
            color: #0f172a;
            font-size: 1.25rem;
            font-weight: 500;
          }

          .spinner {
            width: 48px;
            height: 48px;
            border: 4px solid #e2e8f0;
            border-top: 4px solid #3b82f6;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {/* Fixed Header with Logo and Logout */}
      <div className="dashboard-top-header">
        <div className="dashboard-top-container">
          <Link to="/" className="dashboard-logo">
            <img src={logo} alt="IBRENE Logo" />
          </Link>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {isAdmin && (
              <button
                className="btn-admin-access"
                onClick={() => navigate('/admin')}
              >
                Painel Admin
              </button>
            )}
            <button className="btn-logout" onClick={handleLogout}>Sair</button>
          </div>
        </div>
      </div>

      <div className="dashboard-container">
        <header className="dashboard-header">
          <div>
            <h1>Painel do Aluno</h1>
            <p className="welcome-text">Bem-vindo de volta, {userName}.</p>
          </div>

          <div className="header-actions">
            <button
              className="btn-settings"
              onClick={() => setIsSettingsOpen(true)}
              title="Configurações do Perfil"
            >
              ⚙️
            </button>
            <div className="user-avatar">{userInitials}</div>
          </div>
        </header>

        <section className="courses-section">
          <div className="section-header">
            <h2 className="section-title">Meus Cursos</h2>

            <div className="search-bar-container">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Buscar meus cursos..."
                className="search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {filteredCourses.length === 0 ? (
            <div className="text-center" style={{ color: '#666', padding: '2rem' }}>
              <p>
                {searchQuery
                  ? `Nenhum curso encontrado para "${searchQuery}"`
                  : "Nenhum curso encontrado. Verifique seu banco de dados."
                }
              </p>
            </div>
          ) : (
            <div className="courses-grid">
              {filteredCourses.map(course => (
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

                    <div className="course-actions">
                      <button
                        className="btn-continue"
                        onClick={() => navigate(`/course/${course.id}`)}
                      >
                        {course.progress > 0 ? 'Continuar' : 'Iniciar'}
                      </button>

                      {course.certificate_id && (
                        <button
                          className="btn-certificate"
                          onClick={() => setSelectedCertificateId(course.certificate_id!)}
                        >
                          🏅 Certificado
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {selectedCertificateId && (
        <CertificateModal
          certificateId={selectedCertificateId}
          onClose={() => setSelectedCertificateId(null)}
        />
      )}

      <UserSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        uid={userId}
      />

      <style>{`
        .dashboard-page {
          min-height: 100vh;
          padding-top: 140px; /* Space for navbar */
          padding-bottom: 40px;
          background-color: #f5f5f7; /* Solid off-white background */
          position: relative;
          z-index: 1; /* Ensure it sits on top of the fixed body background */
        }

        .dashboard-top-header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1001;
          background: white;
          border-bottom: 1px solid #e2e8f0;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }

        .dashboard-top-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 1rem 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .dashboard-logo img {
          height: 40px;
          width: auto;
          display: block;
        }

        .btn-logout {
          background: #007bff;
          color: white;
          border: none;
          padding: 10px 24px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.95rem;
        }

        .btn-logout:hover {
          background: #0056b3;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
        }

        .btn-admin-access {
          background: #10b981; /* Emerald green for differentiation */
          color: white;
          border: none;
          padding: 10px 24px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.95rem;
        }

        .btn-admin-access:hover {
          background: #059669;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
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

        .header-actions {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .btn-settings {
          background: #f3f4f6;
          border: none;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 1.2rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }
        .btn-settings:hover {
          background: #e5e7eb;
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

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .section-title {
          font-size: 1.5rem;
          color: #1a1a1a;
          margin: 0;
          font-weight: 600;
          text-shadow: none;
        }

        .search-bar-container {
          position: relative;
          min-width: 300px;
        }

        .search-input {
          width: 100%;
          padding: 0.75rem 1rem 0.75rem 2.5rem;
          border-radius: 99px; /* Pill shape */
          border: 1px solid #e2e8f0;
          background: white;
          font-size: 0.95rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
          transition: all 0.2s;
        }
        
        .search-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .search-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
          pointer-events: none;
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
