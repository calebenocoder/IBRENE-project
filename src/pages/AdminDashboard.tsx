import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { CourseModal } from '../components/CourseModal';

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
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminAndFetchData = async () => {
      try {
        // Check if user is authenticated and is admin
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          navigate('/login');
          return;
        }

        // Check if user is admin
        const isAdmin = user.user_metadata?.is_admin === true;
        if (!isAdmin) {
          // Redirect non-admin users to student dashboard
          navigate('/dashboard');
          return;
        }

        // Set user name
        if (user.user_metadata?.full_name) {
          setUserName(user.user_metadata.full_name);
        }

        // Fetch all courses (including unpublished)
        await fetchCourses();

      } catch (error) {
        console.error('Error checking admin status:', error);
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    checkAdminAndFetchData();
  }, [navigate]);

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
      alert('Erro ao excluir curso');
      return;
    }

    await fetchCourses();
  };

  if (loading) {
    return (
      <div className="admin-page flex items-center justify-center">
        <p style={{ color: '#333', fontSize: '1.2rem' }}>Carregando painel administrativo...</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-container">
        <header className="admin-header">
          <div>
            <h1>Painel Administrativo</h1>
            <p className="welcome-text">Bem-vindo, {userName}</p>
          </div>
          <div className="admin-badge">ADMIN</div>
        </header>

        <section className="manage-section">
          <div className="section-header">
            <h2 className="section-title">Gerenciar Cursos</h2>
            <button className="btn-add" onClick={handleAddCourse}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 5v10M5 10h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Adicionar Curso
            </button>
          </div>

          {courses.length === 0 ? (
            <div className="empty-state">
              <p>Nenhum curso cadastrado ainda.</p>
              <button className="btn-primary" onClick={handleAddCourse}>
                Criar Primeiro Curso
              </button>
            </div>
          ) : (
            <div className="courses-table">
              <div className="table-header">
                <div className="col-title">Título</div>
                <div className="col-instructor">Instrutor</div>
                <div className="col-status">Status</div>
                <div className="col-actions">Ações</div>
              </div>
              {courses.map((course) => (
                <div key={course.id} className="table-row">
                  <div className="col-title">
                    <div
                      className="course-color-indicator"
                      style={{ background: course.gradient_css }}
                    />
                    <span className="course-title-text">{course.title}</span>
                  </div>
                  <div className="col-instructor">{course.instructor}</div>
                  <div className="col-status">
                    <span className={`status-badge ${course.published ? 'published' : 'draft'}`}>
                      {course.published ? 'Publicado' : 'Rascunho'}
                    </span>
                  </div>
                  <div className="col-actions">
                    <button
                      className="btn-icon btn-manage"
                      onClick={() => navigate(`/admin/course/${course.id}/builder`)}
                      title="Gerenciar conteúdo (Aulas/Módulos)"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h3A1.5 1.5 0 0 1 7 2.5v3A1.5 1.5 0 0 1 5.5 7h-3A1.5 1.5 0 0 1 1 5.5v-3zM2.5 2a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3zM9 2.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5zM9 4.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5zM9 6.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5zM1 9.5A1.5 1.5 0 0 1 2.5 8h3A1.5 1.5 0 0 1 7 9.5v3A1.5 1.5 0 0 1 5.5 14h-3A1.5 1.5 0 0 1 1 12.5v-3zM2.5 9a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3zM9 9.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5zM9 11.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5zM9 13.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5z" />
                      </svg>
                    </button>
                    <button
                      className="btn-icon btn-edit"
                      onClick={() => handleEditCourse(course)}
                      title="Editar detalhes do curso"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M12.854 1.146a.5.5 0 0 0-.708 0L10.5 2.793 13.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-2-2zM9.793 3.5L3.293 10H3v.293l-.146.853.853-.146L10 4.707 9.793 3.5zM3 11h.707l6.647-6.647L7.707 1.707 1.06 8.354A.5.5 0 0 0 1 8.707V11.5a.5.5 0 0 0 .5.5H3z" />
                      </svg>
                    </button>
                    <button
                      className="btn-icon btn-delete"
                      onClick={() => handleDeleteCourse(course.id)}
                      title="Excluir curso"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" />
                        <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4L4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <CourseModal
        isOpen={modalOpen}
        onClose={handleModalClose}
        onSave={handleModalSave}
        course={editingCourse}
      />

      <style>{`
        .admin-page {
          min-height: 100vh;
          padding-top: 100px;
          padding-bottom: 40px;
          background-color: #f5f5f7;
        }

        .admin-container {
          width: 90%;
          max-width: 1200px;
          margin: 0 auto;
        }

        .admin-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 3rem;
          background: rgba(255, 255, 255, 0.95);
          padding: 2rem;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.05);
        }

        .admin-header h1 {
          font-size: 2rem;
          color: #1a1a1a;
          margin-bottom: 0.5rem;
        }

        .welcome-text {
          color: #666;
        }

        .admin-badge {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: 700;
          font-size: 0.85rem;
          letter-spacing: 0.5px;
        }

        .manage-section {
          background: white;
          border-radius: 16px;
          padding: 2rem;
          box-shadow: 0 4px 20px rgba(0,0,0,0.05);
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .section-title {
          font-size: 1.5rem;
          color: #1a1a1a;
          font-weight: 600;
        }

        .btn-add {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #007bff;
          color: white;
          border: none;
          padding: 12px 20px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-add:hover {
          background: #0056b3;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
        }

        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          color: #666;
        }

        .empty-state p {
          margin-bottom: 1.5rem;
          font-size: 1.1rem;
        }

        .btn-primary {
          background: #007bff;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-primary:hover {
          background: #0056b3;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
        }

        .courses-table {
          display: flex;
          flex-direction: column;
          gap: 1px;
          background: #e2e8f0;
          border-radius: 12px;
          overflow: hidden;
        }

        .table-header,
        .table-row {
          display: grid;
          grid-template-columns: 2fr 1.5fr 1fr 180px;
          gap: 16px;
          padding: 16px 20px;
          background: white;
          align-items: center;
        }

        .table-header {
          background: #f8fafc;
          font-weight: 700;
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #64748b;
        }

        .table-row {
          transition: all 0.2s;
        }

        .table-row:hover {
          background: #f8fafc;
        }

        .col-title {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .course-color-indicator {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          flex-shrink: 0;
        }

        .course-title-text {
          font-weight: 600;
          color: #1a1a1a;
        }

        .col-instructor {
          color: #475569;
        }

        .status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .status-badge.published {
          background: #d1fae5;
          color: #065f46;
        }

        .status-badge.draft {
          background: #fee;
          color: #991b1b;
        }

        .col-actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }

        .btn-icon {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .btn-manage {
          background: #f0fdf4;
          color: #166534;
        }

        .btn-manage:hover {
          background: #dcfce7;
          transform: scale(1.1);
        }

        .btn-edit {
          background: #eff6ff;
          color: #1e40af;
        }

        .btn-edit:hover {
          background: #dbeafe;
          transform: scale(1.1);
        }

        .btn-delete {
          background: #fef2f2;
          color: #991b1b;
        }

        .btn-delete:hover {
          background: #fee2e2;
          transform: scale(1.1);
        }

        @media (max-width: 768px) {
          .table-header,
          .table-row {
            grid-template-columns: 1fr;
            gap: 8px;
          }

          .table-header {
            display: none;
          }

          .col-actions {
            justify-content: flex-start;
          }
        }
      `}</style>
    </div>
  );
};
