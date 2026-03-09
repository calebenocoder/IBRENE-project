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

import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Tabs,
  Tab,
  Box,
  Container,
  Stack,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CircularProgress,
  Switch,
  Chip,

  useTheme,
  useMediaQuery
} from '@mui/material';

export const AdminDashboard: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('Administrador');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [activeTab, setActiveTab] = useState<'courses' | 'site' | 'posts'>('courses'); // Updated type
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // ... (keep useEffect and fetch logic) ...
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

  const handleTogglePublished = async (courseId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('courses')
      .update({ published: !currentStatus })
      .eq('id', courseId);

    if (error) {
      console.error('Error toggling publication status:', error);
      alert('Erro ao alterar status de publicação.');
    } else {
      setCourses(courses.map(c => c.id === courseId ? { ...c, published: !currentStatus } : c));
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: 'courses' | 'site' | 'posts') => {
    setActiveTab(newValue);
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(248, 250, 252, 0.8)' }}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress size={48} />
          <Typography variant="h6" color="text.secondary">
            Carregando painel admin...
          </Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'rgba(248, 250, 252, 0.8)' }}>
      <AppBar position="sticky" color="inherit" elevation={1} className="animate-intro" sx={{ bgcolor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(8px)' }}>
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ py: { xs: 3, sm: 1 }, flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center', gap: { xs: 3, sm: 0 } }}>
            {/* Left Side */}
            <Stack direction="row" alignItems="center" spacing={2} sx={{ width: { xs: '100%', sm: 'auto' }, justifyContent: { xs: 'center', sm: 'flex-start' } }}>
              <img src={logo} alt="IBRENE" style={{ height: 32, width: 'auto' }} />
              <Typography variant="h6" component="h1" sx={{ color: 'text.primary', borderLeft: 1, borderColor: 'divider', pl: 2, display: { xs: 'none', sm: 'block' } }}>
                Painel Administrativo
              </Typography>
              <Typography variant="subtitle1" component="h1" sx={{ color: 'text.primary', fontWeight: 'bold', display: { xs: 'block', sm: 'none' } }}>
                Painel Admin
              </Typography>
            </Stack>

            {/* Right Side */}
            <Stack direction={{ xs: 'column', sm: 'row' }} alignItems="center" spacing={2} sx={{ ml: { sm: 'auto' }, width: { xs: '100%', sm: 'auto' } }}>
              <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', gap: 1, fontWeight: 500 }}>
                Olá, <strong>{userName}</strong>
              </Typography>
              <Stack direction="row" spacing={1.5} sx={{ width: { xs: '100%', sm: 'auto' }, justifyContent: 'center' }}>
                <Button component={Link} to="/dashboard" variant="contained" color="primary" size="small" disableElevation sx={{ borderRadius: 2, px: 2 }}>
                  Painel Aluno
                </Button>
                <Button component={Link} to="/" variant="outlined" color="primary" size="small" sx={{ borderRadius: 2, px: 2 }}>
                  Ver Site
                </Button>
                <Button onClick={async () => { await supabase.auth.signOut(); navigate('/login'); }} variant="text" color="inherit" size="small" sx={{ '&:hover': { color: 'error.main' }, fontWeight: 600, ml: 1 }}>
                  Sair
                </Button>
              </Stack>
            </Stack>
          </Toolbar>
        </Container>
      </AppBar>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(4px)' }} className="animate-intro-delay-1">
        <Container maxWidth="lg" disableGutters>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant={isMobile ? 'fullWidth' : 'standard'}
            centered={!isMobile}
            textColor="primary"
            indicatorColor="primary"
          >
            <Tab label="Cursos" value="courses" sx={{ textTransform: 'none', fontWeight: 600, py: 2, fontSize: { xs: '0.85rem', sm: '0.9rem' } }} />
            <Tab label="Postagens" value="posts" sx={{ textTransform: 'none', fontWeight: 600, py: 2, fontSize: { xs: '0.85rem', sm: '0.9rem' } }} />
            <Tab label="Site" value="site" sx={{ textTransform: 'none', fontWeight: 600, py: 2, fontSize: { xs: '0.85rem', sm: '0.9rem' } }} />
          </Tabs>
        </Container>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, py: 4 }} className="animate-intro-delay-2">
        <Container maxWidth="lg">
          {activeTab === 'courses' && (
            <Box sx={{ mb: 4 }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} sx={{ mb: 4 }}>
                <Box>
                  <Typography variant="h5" component="h2" fontWeight="bold" color="text.primary">
                    Cursos
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Gerencie os cursos disponíveis na plataforma.
                  </Typography>
                </Box>
                <Button onClick={handleAddCourse} variant="contained" color="primary" sx={{ width: { xs: '100%', sm: 'auto' } }}>
                  + Novo Curso
                </Button>
              </Stack>

              {courses.length === 0 ? (
                <Box sx={{ textAlign: 'center', p: 6, bgcolor: 'background.paper', borderRadius: 2, border: 1, borderColor: 'divider', borderStyle: 'dashed' }}>
                  <Typography variant="h6" color="text.primary" gutterBottom>
                    Nenhum curso cadastrado
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Comece criando o primeiro curso da plataforma.
                  </Typography>
                  <Button onClick={handleAddCourse} variant="contained" color="primary" sx={{ mt: 2 }}>
                    Criar Curso
                  </Button>
                </Box>
              ) : (
                <Grid container spacing={3}>
                  {courses.map((course) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={course.id}>
                      <Card sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: 3,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                        border: '1px solid',
                        borderColor: 'divider',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
                        }
                      }}>
                        <CardMedia
                          component="div"
                          sx={{
                            height: 140,
                            background: course.gradient_css || 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                            position: 'relative'
                          }}
                        />
                        <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
                          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1.5 }}>
                            <Stack direction="column" spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
                              <Typography
                                variant="h6"
                                component="h3"
                                sx={{
                                  fontWeight: 700,
                                  fontSize: '1.1rem',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {course.title}
                              </Typography>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Chip
                                  size="small"
                                  label={course.published ? 'Publicado' : 'Rascunho'}
                                  color={course.published ? 'success' : 'default'}
                                  variant={course.published ? 'filled' : 'outlined'}
                                  sx={{
                                    height: 20,
                                    fontSize: '0.65rem',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    bgcolor: course.published ? '#dcfce7' : undefined,
                                    color: course.published ? '#166534' : undefined
                                  }}
                                />

                              </Stack>
                            </Stack>
                            <Switch
                              checked={course.published}
                              onChange={() => handleTogglePublished(course.id, course.published)}
                              color="primary"
                            />
                          </Stack>

                          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            {course.instructor}
                          </Typography>

                          <Stack spacing={1}>
                            <Button
                              component={Link}
                              to={`/admin/course/${course.id}/builder`}
                              variant="contained"
                              color="primary"
                              size="medium"
                              disableElevation
                              fullWidth
                              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                            >
                              Editar Conteúdo
                            </Button>
                            <Stack direction="row" spacing={1}>
                              <Button
                                onClick={() => handleEditCourse(course)}
                                variant="outlined"
                                color="inherit"
                                size="small"
                                fullWidth
                                sx={{ borderRadius: 2, textTransform: 'none', borderColor: 'divider' }}
                              >
                                Config
                              </Button>
                              <Button
                                onClick={() => handleDeleteCourse(course.id)}
                                variant="outlined"
                                color="error"
                                size="small"
                                fullWidth
                                sx={{
                                  borderRadius: 2,
                                  textTransform: 'none',
                                  bgcolor: '#fff5f5',
                                  borderColor: '#feb2b2',
                                  color: '#e53e3e',
                                  '&:hover': {
                                    bgcolor: '#fff5f5',
                                    borderColor: '#e53e3e'
                                  }
                                }}
                              >
                                Excluir
                              </Button>
                            </Stack>
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          )}

          {/* Render New PostsManager Tab */}
          {activeTab === 'posts' && <PostsManager />}

          {activeTab === 'site' && <SiteManager />}
        </Container>
      </Box>

      {modalOpen && (
        <CourseModal
          isOpen={modalOpen}
          onClose={handleModalClose}
          onSave={handleModalSave}
          course={editingCourse}
        />
      )}
    </Box>
  );
};
