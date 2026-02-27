import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { CourseModal } from '../components/CourseModal';
import { SiteManager } from '../components/admin/SiteManager';
import { PostsManager } from '../components/admin/PostsManager'; // New Import
import logo from '../assets/logo.png';

interface Course {
  id: string;
  title: string;
  instructor: string;
  description?: string;
  gradient_css: string;
  published: boolean;
  created_at?: string;
}

export const AdminDashboard: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('Administrador');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [activeTab, setActiveTab] = useState<'courses' | 'site' | 'posts'>('courses'); // Updated type
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (user?.user_metadata?.full_name) {
          setUserName(user.user_metadata.full_name);
        }

        await fetchCourses();
      } catch (error) {
        console.error('Error fetching admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  const fetchCourses = async () => {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching courses:', error);
      return;
    }

    if (data) {
      setCourses(data);
    }
  };

  const handleAddCourse = () => {
    setEditingCourse(null);
    setModalOpen(true);
  };

  const handleEditCourse = (course: Course) => {
    setEditingCourse(course);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingCourse(null);
  };

  const handleModalSave = async () => {
    await fetchCourses();
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('Tem certeza que deseja excluir este curso?')) {
      return;
    }

    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId);

    if (error) {
      console.error('Error deleting course:', error);
      alert('Erro ao excluir curso.');
    } else {
      await fetchCourses();
    }
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loading-content">
          <div className="spinner"></div>
          <p>Carregando...</p>
        </div>
        <style>{`
          .admin-loading {
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

          .admin-loading p {
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
    <div className="admin-dashboard">
      <header className="dashboard-header">
        <div className="header-container">
          <div className="header-left">
            <img src={logo} alt="IBRENE" className="dashboard-logo" />
            <div className="header-divider"></div>
            <h1>Painel Administrativo</h1>
          </div>
          <div className="header-right">
            <span>Olá, <strong>{userName}</strong></span>
            <Link to="/" className="link-home">Ver Site</Link>
            <button
              onClick={async () => { await supabase.auth.signOut(); navigate('/login'); }}
              className="btn-logout"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <div className="tabs-container">
        <div className="tabs-header">
          <button
            onClick={() => setActiveTab('courses')}
            className={`tab-button ${activeTab === 'courses' ? 'active' : ''}`}
          >
            Gerenciar Cursos
          </button>
          <button
            onClick={() => setActiveTab('posts')}
            className={`tab-button ${activeTab === 'posts' ? 'active' : ''}`}
          >
            Gerenciar Postagens
          </button>
          <button
            onClick={() => setActiveTab('site')}
            className={`tab-button ${activeTab === 'site' ? 'active' : ''}`}
          >
            Gerenciar Site
          </button>
        </div>
      </div>

      <main className="dashboard-content">
        {activeTab === 'courses' && (
          <div className="courses-tab">
            <div className="section-header">
              <div>
                <h2>Cursos</h2>
                <p>Gerencie os cursos disponíveis na plataforma.</p>
              </div>
              <button onClick={handleAddCourse} className="btn-primary">
                + Novo Curso
              </button>
            </div>

            {courses.length === 0 ? (
              <div className="empty-courses">
                <h3>Nenhum curso cadastrado</h3>
                <p>Comece criando o primeiro curso da plataforma.</p>
                <button onClick={handleAddCourse} className="btn-primary mt-4">
                  Criar Curso
                </button>
              </div>
            ) : (
              <div className="courses-grid">
                {courses.map((course) => (
                  <div key={course.id} className="course-card">
                    <div className="course-banner" style={{ background: course.gradient_css || 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}></div>
                    <div className="course-info">
                      <div className="course-header-row">
                        <h3>{course.title}</h3>
                        <span className={`status-badge ${course.published ? 'published' : 'draft'}`}>
                          {course.published ? 'Publicado' : 'Rascunho'}
                        </span>
                      </div>
                      <p className="instructor">{course.instructor}</p>

                      <div className="course-actions">
                        <Link to={`/admin/course/${course.id}/builder`} className="btn-action primary">
                          Editar Conteúdo
                        </Link>
                        <button onClick={() => handleEditCourse(course)} className="btn-action secondary">
                          Config
                        </button>
                        <button onClick={() => handleDeleteCourse(course.id)} className="btn-action danger">
                          Excluir
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Render New PostsManager Tab */}
        {activeTab === 'posts' && <PostsManager />}

        {activeTab === 'site' && <SiteManager />}
      </main>

      {modalOpen && (
        <CourseModal
          isOpen={modalOpen}
          onClose={handleModalClose}
          onSave={handleModalSave}
          course={editingCourse}
        />
      )}

      <style>{`
        .admin-dashboard {
          min-height: 100vh;
          background-color: #f8fafc;
          display: flex;
          flex-direction: column;
        }

        .dashboard-header {
          background: white;
          border-bottom: 1px solid #e2e8f0;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .header-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 1.5rem;
          height: 4rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .header-left {
          display: flex;
          align-items: center;
        }

        .dashboard-logo {
          height: 2rem;
          width: auto;
        }

        .header-divider {
          height: 1.5rem;
          width: 1px;
          background-color: #e2e8f0;
          margin: 0 1rem;
        }

        .header-left h1 {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1f2937;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          font-size: 0.875rem;
          color: #4b5563;
        }

        .link-home {
          color: #2563eb;
          font-weight: 500;
        }

        .btn-logout {
          color: #6b7280;
          font-weight: 500;
          background: none;
        }
        .btn-logout:hover { color: #dc2626; }

        /* Tabs */
        .tabs-container {
          background: white;
          border-bottom: 1px solid #e2e8f0;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        }

        .tabs-header {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 1.5rem;
          display: flex;
          gap: 2rem;
        }

        .tab-button {
          padding: 1rem 0.25rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: #6b7280;
          background: none;
          border-bottom: 2px solid transparent;
          transition: all 0.2s;
        }

        .tab-button:hover {
          color: #374151;
          border-bottom-color: #d1d5db;
        }

        .tab-button.active {
          color: #2563eb;
          border-bottom-color: #2563eb;
        }

        /* Content */
        .dashboard-content {
          flex: 1;
          max-width: 1280px;
          width: 100%;
          margin: 0 auto;
          padding: 2rem 1.5rem;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .section-header h2 {
          font-size: 1.5rem;
          font-weight: 700;
          color: #111827;
        }

        .section-header p {
          color: #6b7280;
          font-size: 0.875rem;
          margin-top: 0.25rem;
        }

        .btn-primary {
          background-color: #2563eb;
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 0.375rem;
          font-weight: 500;
          font-size: 0.875rem;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        }
        .btn-primary:hover { background-color: #1d4ed8; }

        /* Grid */
        .courses-grid {
          display: grid;
          grid-template-columns: repeat(1, 1fr);
          gap: 1.5rem;
        }
        @media (min-width: 640px) { .courses-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (min-width: 1024px) { .courses-grid { grid-template-columns: repeat(3, 1fr); } }

        .course-card {
          background: white;
          border-radius: 0.5rem;
          border: 1px solid #f3f4f6;
          overflow: hidden;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
          transition: box-shadow 0.2s;
        }
        .course-card:hover { box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }

        .course-banner { height: 8rem; width: 100%; }
        .course-info { padding: 1.25rem; }

        .course-header-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.25rem;
        }

        .course-header-row h3 {
          font-size: 1.125rem;
          font-weight: 500;
          color: #111827;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .status-badge {
          font-size: 0.75rem;
          font-weight: 500;
          padding: 0.125rem 0.625rem;
          border-radius: 9999px;
        }
        .status-badge.published { background-color: #dcfce7; color: #166534; }
        .status-badge.draft { background-color: #fef9c3; color: #854d0e; }

        .instructor { color: #6b7280; font-size: 0.875rem; margin-bottom: 1.5rem; }

        .course-actions {
          display: flex;
          gap: 0.75rem;
        }

        .btn-action {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          font-weight: 500;
          border-radius: 0.375rem;
        }

        .btn-action.primary {
          flex: 1;
          background-color: #2563eb;
          color: white;
        }
        .btn-action.primary:hover { background-color: #1d4ed8; }

        .btn-action.secondary {
          background-color: white;
          color: #374151;
          border: 1px solid #d1d5db;
        }
        .btn-action.secondary:hover { background-color: #f9fafb; }

        .btn-action.danger {
          background-color: #fee2e2;
          color: #b91c1c;
        }
        .btn-action.danger:hover { background-color: #fecaca; }

        .empty-courses {
          text-align: center;
          padding: 3rem;
          background: white;
          border: 1px dashed #e5e7eb;
          border-radius: 0.5rem;
        }
        
        .mt-4 { margin-top: 1rem; }

        /* Loading Spinner */
        .admin-loading {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          background-color: #f8fafc;
          flex-direction: column;
          text-align: center;
        }

        .admin-loading .spinner {
          border: 4px solid rgba(0, 0, 0, 0.1);
          border-left-color: #2563eb;
          border-radius: 50%;
          width: 3rem;
          height: 3rem;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }

        .admin-loading p {
          color: #4b5563;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
