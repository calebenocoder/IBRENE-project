import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import {
    Box,
    Button,
    Typography,
    Stack,
    IconButton,
    Tooltip,
    Card,
    CardContent,
    TextField,
    Switch,
    FormControlLabel,
    Grid,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    CloudUpload as UploadIcon
} from '@mui/icons-material';

interface Post {
    id: string;
    title: string;
    subtitle: string;
    content: string;
    image_url: string;
    banner_image_url?: string;
    category: string;
    event_date: string;
    created_at: string;
    visible?: boolean;
}

export const PostsManager: React.FC = () => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingPost, setEditingPost] = useState<Post | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    // Form States
    const [title, setTitle] = useState('');
    const [subtitle, setSubtitle] = useState('');
    const [category, setCategory] = useState('');
    const [date, setDate] = useState('');
    const [content, setContent] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [bannerUrl, setBannerUrl] = useState('');
    const [visible, setVisible] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [uploadingBanner, setUploadingBanner] = useState(false);

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            const { data, error } = await supabase
                .from('site_posts')
                .select('*')
                .order('event_date', { ascending: true });

            if (error) throw error;
            setPosts(data || []);
        } catch (error) {
            console.error('Error fetching posts:', error);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setTitle('');
        setSubtitle('');
        setCategory('');
        setDate('');
        setContent('');
        setImageUrl('');
        setBannerUrl('');
        setVisible(true);
        setEditingPost(null);
        setIsCreating(false);
    };

    const handleEdit = (post: Post) => {
        setTitle(post.title);
        setSubtitle(post.subtitle || '');
        setCategory(post.category || '');
        const dateObj = new Date(post.event_date);
        const formattedDate = dateObj.toISOString().split('T')[0];
        setDate(formattedDate);
        setContent(post.content || '');
        setImageUrl(post.image_url || '');
        setBannerUrl(post.banner_image_url || '');
        setVisible(post.visible !== false); // Default to true if null
        setEditingPost(post);
        setIsCreating(true);
    };

    const handleCreate = () => {
        resetForm();
        setIsCreating(true);
    };

    const handleToggleVisible = async (post: Post) => {
        try {
            const newValue = !post.visible;
            const { error } = await supabase
                .from('site_posts')
                .update({ visible: newValue })
                .eq('id', post.id);

            if (error) throw error;

            // Optimistic update
            setPosts(posts.map(p => p.id === post.id ? { ...p, visible: newValue } : p));
        } catch (error) {
            console.error('Error toggling visibility:', error);
            alert('Erro ao atualizar visibilidade.');
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) {
            return;
        }

        const file = e.target.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `posts/${fileName}`;

        setUploading(true);

        try {
            const { error: uploadError } = await supabase.storage
                .from('site-assets')
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('site-assets')
                .getPublicUrl(filePath);

            setImageUrl(publicUrl);
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Erro ao fazer upload da imagem.');
        } finally {
            setUploading(false);
        }
    };

    const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) {
            return;
        }

        const file = e.target.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `posts/banners/${fileName}`;

        setUploadingBanner(true);

        try {
            const { error: uploadError } = await supabase.storage
                .from('site-assets')
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('site-assets')
                .getPublicUrl(filePath);

            setBannerUrl(publicUrl);
        } catch (error) {
            console.error('Error uploading banner:', error);
            alert('Erro ao fazer upload do banner.');
        } finally {
            setUploadingBanner(false);
        }
    };

    const handleSave = async () => {
        try {
            if (!title || !date) {
                alert('Título e Data são obrigatórios.');
                return;
            }

            const postData = {
                title,
                subtitle,
                category,
                event_date: new Date(date).toISOString(),
                content,
                image_url: imageUrl,
                banner_image_url: bannerUrl || null,
                visible
            };

            let error;
            if (editingPost) {
                const { error: updateError } = await supabase
                    .from('site_posts')
                    .update(postData)
                    .eq('id', editingPost.id);
                error = updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('site_posts')
                    .insert([postData]);
                error = insertError;
            }

            if (error) throw error;

            await fetchPosts();
            resetForm();
        } catch (error) {
            console.error('Error saving post:', error);
            alert('Erro ao salvar postagem.');
        }
    };

    const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; postId: string | null }>({
        isOpen: false,
        postId: null
    });

    const requestDelete = (id: string) => {
        setDeleteConfirmation({ isOpen: true, postId: id });
    };

    const confirmDelete = async () => {
        if (!deleteConfirmation.postId) return;

        try {
            const { error, count } = await supabase
                .from('site_posts')
                .delete({ count: 'exact' })
                .eq('id', deleteConfirmation.postId);

            if (error) throw error;
            if (count === 0) {
                throw new Error("Você não tem permissão para excluir esta postagem.");
            }
            await fetchPosts();
            setDeleteConfirmation({ isOpen: false, postId: null });
        } catch (error) {
            console.error('Error deleting post:', error);
            alert(`Erro ao excluir postagem: ${(error as any).message || error}`);
        }
    };

    const cancelDelete = () => {
        setDeleteConfirmation({ isOpen: false, postId: null });
    };

    if (loading) {
        return (
            <Box sx={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Stack alignItems="center" spacing={2}>
                    <CircularProgress size={40} />
                    <Typography color="text.secondary">Carregando postagens...</Typography>
                </Stack>
            </Box>
        );
    }

    if (isCreating) {
        return (
            <Box sx={{ maxWidth: 900, mx: 'auto', p: { xs: 2, sm: 3 }, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4, borderBottom: 1, borderColor: 'divider', pb: 2 }}>
                    <Typography variant="h6" fontWeight="bold">
                        {editingPost ? 'Editar Postagem' : 'Nova Postagem'}
                    </Typography>
                    <Button variant="outlined" color="inherit" onClick={resetForm} size="small">
                        Cancelar
                    </Button>
                </Stack>

                <Grid container spacing={3}>
                    <Grid size={{ xs: 12 }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={visible}
                                    onChange={(e) => setVisible(e.target.checked)}
                                    color="success"
                                />
                            }
                            label="Postagem Visível no Site?"
                        />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <TextField
                            fullWidth
                            label="Título"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ex: Conferência de Jovens"
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            fullWidth
                            label="Categoria"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            placeholder="Ex: Jovens, Missões"
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            fullWidth
                            label="Data do Evento"
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <TextField
                            fullWidth
                            label="Subtítulo (Curta descrição para o card)"
                            value={subtitle}
                            onChange={(e) => setSubtitle(e.target.value)}
                            placeholder="Uma breve descrição que aparece no card..."
                        />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <Typography variant="subtitle2" gutterBottom color="text.secondary">
                            Imagem de Capa
                        </Typography>
                        <Stack spacing={2} alignItems="flex-start">
                            {imageUrl && (
                                <Box sx={{
                                    width: '100%',
                                    height: 200,
                                    borderRadius: 1,
                                    border: '1px dashed',
                                    borderColor: 'divider',
                                    overflow: 'hidden',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    bgcolor: 'grey.50'
                                }}>
                                    <img src={imageUrl} alt="Capa" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </Box>
                            )}
                            <Button
                                variant="outlined"
                                component="label"
                                startIcon={<UploadIcon />}
                                disabled={uploading}
                            >
                                {uploading ? 'Enviando...' : 'Fazer Upload da Imagem'}
                                <input
                                    hidden
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                />
                            </Button>
                        </Stack>
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <Typography variant="subtitle2" gutterBottom color="text.secondary">
                            Banner Interno (Opcional - Exibe ao abrir o post)
                        </Typography>
                        <Stack spacing={2} alignItems="flex-start">
                            {bannerUrl && (
                                <Box sx={{
                                    width: '100%',
                                    height: 150,
                                    borderRadius: 1,
                                    border: '1px dashed',
                                    borderColor: 'divider',
                                    overflow: 'hidden',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    bgcolor: 'grey.50'
                                }}>
                                    <img src={bannerUrl} alt="Banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </Box>
                            )}
                            <Stack direction={{ xs: 'column', sm: 'row' }} alignItems="center" spacing={2} sx={{ width: '100%' }}>
                                <Button
                                    variant="outlined"
                                    component="label"
                                    startIcon={<UploadIcon />}
                                    disabled={uploadingBanner}
                                >
                                    {uploadingBanner ? 'Enviando...' : 'Upload do Banner (Recomendado 1200x500)'}
                                    <input
                                        hidden
                                        type="file"
                                        accept="image/*"
                                        onChange={handleBannerUpload}
                                    />
                                </Button>
                            </Stack>
                        </Stack>
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <Typography variant="subtitle2" gutterBottom color="text.secondary">
                            Conteúdo Completo
                        </Typography>
                        <Box sx={{
                            '& .quill': {
                                bgcolor: 'white',
                                borderRadius: 1,
                                border: 1,
                                borderColor: 'divider'
                            },
                            '& .ql-toolbar': {
                                borderTop: 'none',
                                borderLeft: 'none',
                                borderRight: 'none',
                                borderColor: 'divider'
                            },
                            '& .ql-container': {
                                border: 'none',
                                minHeight: 300
                            }
                        }}>
                            <ReactQuill
                                theme="snow"
                                value={content}
                                onChange={setContent}
                            />
                        </Box>
                    </Grid>

                    <Grid size={{ xs: 12 }} sx={{ mt: 2 }}>
                        <Button
                            variant="contained"
                            fullWidth
                            size="large"
                            onClick={handleSave}
                        >
                            Salvar Postagem
                        </Button>
                    </Grid>
                </Grid>
            </Box>
        );
    }

    return (
        <Box sx={{ py: 2 }}>
            <Stack
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                spacing={2}
                sx={{ mb: 4 }}
            >
                <Typography variant="h5" component="h2" fontWeight="bold">
                    Gerenciar Postagens
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={handleCreate}
                    sx={{ borderRadius: 2, whiteSpace: 'nowrap' }}
                >
                    Nova Postagem
                </Button>
            </Stack>

            <Grid container spacing={2}>
                {posts.map((post) => (
                    <Grid size={{ xs: 12 }} key={post.id}>
                        <Card variant="outlined" sx={{ borderRadius: 2, '&:hover': { boxShadow: 1 } }}>
                            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Tooltip title={post.visible !== false ? 'Visível (Clique para ocultar)' : 'Oculto (Clique para mostrar)'}>
                                            <Switch
                                                size="small"
                                                checked={post.visible !== false}
                                                onChange={() => handleToggleVisible(post)}
                                                color="success"
                                            />
                                        </Tooltip>
                                    </Box>

                                    <Box
                                        sx={{
                                            width: 60,
                                            height: 60,
                                            borderRadius: 1,
                                            bgcolor: 'grey.200',
                                            backgroundImage: `url(${post.image_url || '/placeholder-image.jpg'})`,
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center',
                                            flexShrink: 0
                                        }}
                                    />

                                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                        <Typography variant="subtitle1" fontWeight="600" noWrap sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            {post.title}
                                            {post.visible === false && (
                                                <Typography
                                                    component="span"
                                                    variant="caption"
                                                    sx={{
                                                        bgcolor: 'grey.100',
                                                        color: 'text.secondary',
                                                        px: 1,
                                                        borderRadius: 1,
                                                        fontWeight: 500
                                                    }}
                                                >
                                                    Oculto
                                                </Typography>
                                            )}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {new Date(post.event_date).toLocaleDateString()} • {post.category}
                                        </Typography>
                                    </Box>

                                    <Stack direction="row" spacing={1}>
                                        <Tooltip title="Editar">
                                            <IconButton size="small" color="primary" onClick={() => handleEdit(post)}>
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Excluir">
                                            <IconButton size="small" color="error" onClick={() => requestDelete(post.id)}>
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </Stack>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}

                {posts.length === 0 && (
                    <Grid size={{ xs: 12 }}>
                        <Box sx={{ textAlign: 'center', py: 8, bgcolor: 'background.paper', borderRadius: 2, border: '1px dashed', borderColor: 'divider' }}>
                            <Typography color="text.secondary">
                                Nenhuma postagem encontrada.
                            </Typography>
                        </Box>
                    </Grid>
                )}
            </Grid>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteConfirmation.isOpen} onClose={cancelDelete}>
                <DialogTitle>Confirmar Exclusão</DialogTitle>
                <DialogContent>
                    <Typography>
                        Tem certeza que deseja excluir esta postagem? Esta ação não pode ser desfeita.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={cancelDelete}>Cancelar</Button>
                    <Button onClick={confirmDelete} color="error" variant="contained">
                        Sim, Excluir
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};
