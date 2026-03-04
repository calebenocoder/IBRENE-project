import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import logo from '../assets/logo.png';
import { CertificateModal } from '../components/CertificateModal';
import { UserSettingsModal } from '../components/UserSettingsModal';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
  Grid,
  Card,
  CardMedia,
  CardContent,
  LinearProgress,
  Stack,
  TextField,
  InputAdornment,
  Avatar,
  IconButton,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  Search as SearchIcon,
  Settings as SettingsIcon,
  WorkspacePremium as CertificateIcon,
  AdminPanelSettings as AdminIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';

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
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
        <Stack alignItems="center" spacing={2}>
          <CircularProgress size={48} />
          <Typography variant="h6" color="text.secondary">
            Carregando seus cursos...
          </Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      {/* AppBar */}
      <AppBar position="sticky" color="inherit" elevation={1} sx={{ bgcolor: 'background.paper' }}>
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
            <Stack direction="row" alignItems="center" component={Link} to="/" sx={{ textDecoration: 'none' }}>
              <img src={logo} alt="IBRENE Logo" style={{ height: 40, width: 'auto' }} />
            </Stack>

            <Stack direction="row" spacing={2} alignItems="center">
              {isAdmin && (
                <Button
                  component={Link}
                  to="/admin"
                  variant="contained"
                  color="secondary"
                  size="small"
                  startIcon={<AdminIcon />}
                >
                  Painel Admin
                </Button>
              )}
              <Button
                onClick={handleLogout}
                variant="text"
                color="inherit"
                size="small"
                startIcon={<LogoutIcon />}
                sx={{ '&:hover': { color: 'error.main' } }}
              >
                Sair
              </Button>
            </Stack>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, py: 4 }}>
        <Container maxWidth="lg">

          {/* Header Card */}
          <Card sx={{ mb: 4, p: { xs: 3, md: 4 }, borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={3}>
              <Box>
                <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
                  Painel do Aluno
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Bem-vindo de volta, {userName}.
                </Typography>
              </Box>
              <Stack direction="row" spacing={2} alignItems="center">
                <Tooltip title="Configurações do Perfil">
                  <IconButton onClick={() => setIsSettingsOpen(true)} size="large" sx={{ bgcolor: 'action.hover' }}>
                    <SettingsIcon />
                  </IconButton>
                </Tooltip>
                <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main', fontWeight: 'bold' }}>
                  {userInitials}
                </Avatar>
              </Stack>
            </Stack>
          </Card>

          {/* Courses Section */}
          <Box sx={{ mb: 4 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} sx={{ mb: 4 }}>
              <Typography variant="h5" component="h2" fontWeight="bold">
                Meus Cursos
              </Typography>
              <TextField
                placeholder="Buscar meus cursos..."
                variant="outlined"
                size="small"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: 50, bgcolor: 'background.paper' }
                }}
                sx={{ width: { xs: '100%', sm: 300 } }}
              />
            </Stack>

            {filteredCourses.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="body1" color="text.secondary">
                  {searchQuery
                    ? `Nenhum curso encontrado para "${searchQuery}"`
                    : "Nenhum curso encontrado."
                  }
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={3}>
                {filteredCourses.map(course => (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={course.id}>
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 3, transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 } }}>
                      <CardMedia
                        component="div"
                        sx={{ height: 160, background: course.gradient_css || 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}
                      />
                      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 3 }}>
                        <Typography variant="h6" component="h3" fontWeight="bold" gutterBottom sx={{ overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {course.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {course.instructor || 'Instrutor IBRENE'}
                        </Typography>

                        <Box sx={{ mt: 'auto', pt: 2 }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                            <Typography variant="caption" color="text.secondary" fontWeight="medium">
                              {course.progress}% concluído
                            </Typography>
                          </Stack>
                          <LinearProgress
                            variant="determinate"
                            value={course.progress}
                            sx={{ height: 8, borderRadius: 4, mb: 3 }}
                          />

                          <Stack spacing={1.5}>
                            <Button
                              variant={course.progress > 0 ? "outlined" : "contained"}
                              color="primary"
                              fullWidth
                              onClick={() => navigate(`/course/${course.id}`)}
                              disableElevation
                            >
                              {course.progress > 0 ? 'Continuar' : 'Iniciar'}
                            </Button>

                            {course.certificate_id && (
                              <Button
                                variant="text"
                                color="primary"
                                fullWidth
                                startIcon={<CertificateIcon />}
                                onClick={() => setSelectedCertificateId(course.certificate_id!)}
                              >
                                Certificado
                              </Button>
                            )}
                          </Stack>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        </Container>
      </Box>

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
    </Box>
  );
};
