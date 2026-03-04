import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { v4 as uuidv4 } from 'uuid';
import { SortableServiceHour } from './SortableServiceHour';
import {
    Box,
    Typography,
    Stack,
    Button,
    Grid,
    Card,
    CardContent,
    TextField,
    IconButton,
    Tooltip,
    Alert,
    CircularProgress,
    Divider,
    Paper
} from '@mui/material';
import {
    Save as SaveIcon,
    CloudUpload as UploadIcon,
    Add as AddIcon
} from '@mui/icons-material';

interface ServiceHour {
    id: string;
    day: string;
    time: string;
    label: string;
}

// Default values matching the public site (ServiceTimes.tsx)
const DEFAULT_HOURS: ServiceHour[] = [
    { id: uuidv4(), day: "Domingo", time: "09:00", label: "Escola Bíblica" },
    { id: uuidv4(), day: "Domingo", time: "18:00", label: "Culto de Adoração" },
    { id: uuidv4(), day: "Quarta-feira", time: "19:30", label: "Culto de Oração" }
];

export const SiteManager: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Form states
    const [bgImage, setBgImage] = useState('');
    const [bgPosition, setBgPosition] = useState('center top');
    const [heroTitle, setHeroTitle] = useState('Bem-vindo a IBRENE');
    const [heroSubtitle, setHeroSubtitle] = useState('Um lugar de fé, esperança e amor.');

    // Visit Section (Welcome Message)
    const [visitTitle, setVisitTitle] = useState('Estamos ansiosos em te conhecer');
    const [visitText, setVisitText] = useState('Não importa onde você esteja em sua jornada espiritual, você é bem-vindo aqui. Temos atividades para todas as idades.');

    const [hours, setHours] = useState<ServiceHour[]>([]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        const { data, error } = await supabase
            .from('site_settings')
            .select('*')
            .eq('id', 1)
            .single();

        if (error) {
            console.error('Error fetching site settings:', error);
            setHours(DEFAULT_HOURS);
        } else if (data) {
            setBgImage(data.hero_bg_image || '');
            setBgPosition(data.hero_bg_position || 'center top');
            if (data.hero_title) setHeroTitle(data.hero_title);
            if (data.hero_subtitle) setHeroSubtitle(data.hero_subtitle);
            if (data.visit_title) setVisitTitle(data.visit_title);
            if (data.visit_text) setVisitText(data.visit_text);

            if (data.service_hours && data.service_hours.length > 0) {
                const hoursWithIds = data.service_hours.map((h: any) => ({
                    ...h,
                    id: h.id || uuidv4()
                }));
                setHours(hoursWithIds);
            } else {
                setHours(DEFAULT_HOURS);
            }
        } else {
            setHours(DEFAULT_HOURS);
        }
        setLoading(false);
    };

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files || event.target.files.length === 0) {
            return;
        }

        const file = event.target.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `hero-bg-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        // Simple validation
        if (!['jpg', 'jpeg', 'png', 'webp'].includes(fileExt?.toLowerCase() || '')) {
            setMessage({ type: 'error', text: 'Apenas imagens (jpg, png, webp) são permitidas.' });
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            setMessage({ type: 'error', text: 'A imagem deve ter no máximo 5MB.' });
            return;
        }

        setUploading(true);
        setMessage(null);

        try {
            const { error: uploadError } = await supabase.storage
                .from('site-assets')
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            const { data } = supabase.storage
                .from('site-assets')
                .getPublicUrl(filePath);

            setBgImage(data.publicUrl);
            setMessage({ type: 'success', text: 'Imagem carregada com sucesso!' });
        } catch (error: any) {
            console.error('Error uploading image:', error);
            setMessage({ type: 'error', text: 'Erro ao fazer upload da imagem.' });
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);

        const updates = {
            hero_bg_image: bgImage || null,
            hero_bg_position: bgPosition,
            hero_title: heroTitle,
            hero_subtitle: heroSubtitle,
            visit_title: visitTitle,
            visit_text: visitText,
            service_hours: hours,
            updated_at: new Date().toISOString()
        };

        const { error } = await supabase
            .from('site_settings')
            .upsert({ id: 1, ...updates });

        if (error) {
            setMessage({ type: 'error', text: 'Erro ao salvar configurações.' });
            console.error(error);
        } else {
            setMessage({ type: 'success', text: 'Configurações salvas com sucesso!' });
        }
        setSaving(false);
    };

    const handleAddHour = () => {
        setHours([...hours, { id: uuidv4(), day: 'Domingo', time: '00:00', label: 'Culto' }]);
    };

    const handleRemoveHour = (index: number) => {
        const newHours = [...hours];
        newHours.splice(index, 1);
        setHours(newHours);
    };

    const handleHourChange = (index: number, field: keyof ServiceHour, value: string) => {
        const newHours = [...hours];
        newHours[index] = { ...newHours[index], [field]: value };
        setHours(newHours);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = hours.findIndex((h) => h.id === active.id);
            const newIndex = hours.findIndex((h) => h.id === over.id);
            if (oldIndex !== -1 && newIndex !== -1) {
                setHours(arrayMove(hours, oldIndex, newIndex));
            }
        }
    };

    if (loading) {
        return (
            <Box sx={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Stack alignItems="center" spacing={2}>
                    <CircularProgress size={40} />
                    <Typography color="text.secondary">Carregando configurações...</Typography>
                </Stack>
            </Box>
        );
    }

    return (
        <Box sx={{ pb: 4 }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                    Gerenciar Site
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Personalize a aparência e informações do site principal.
                </Typography>
            </Box>

            {message && (
                <Alert
                    severity={message.type === 'success' ? 'success' : 'error'}
                    sx={{ mb: 3 }}
                    onClose={() => setMessage(null)}
                >
                    {message.text}
                </Alert>
            )}

            <Stack spacing={3}>
                <Card variant="outlined" sx={{ borderRadius: 2 }}>
                    <CardContent>
                        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                            Informações Principais (Hero)
                        </Typography>
                        <Stack spacing={2}>
                            <TextField
                                label="Título Principal"
                                fullWidth
                                value={heroTitle}
                                onChange={(e) => setHeroTitle(e.target.value)}
                                placeholder="Ex: Bem-vindo a IBRENE"
                            />
                            <TextField
                                label="Subtítulo"
                                fullWidth
                                value={heroSubtitle}
                                onChange={(e) => setHeroSubtitle(e.target.value)}
                                placeholder="Ex: Um lugar de fé, esperança e amor."
                            />
                        </Stack>
                    </CardContent>
                </Card>

                <Card variant="outlined" sx={{ borderRadius: 2 }}>
                    <CardContent>
                        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                            Imagem de Fundo
                        </Typography>
                        <Grid container spacing={4}>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                    Upload da Imagem
                                </Typography>
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <Button
                                        variant="outlined"
                                        component="label"
                                        startIcon={<UploadIcon />}
                                        disabled={uploading}
                                    >
                                        {uploading ? 'Enviando...' : 'Fazer Upload'}
                                        <input
                                            hidden
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                        />
                                    </Button>
                                    {uploading && <CircularProgress size={24} />}
                                </Stack>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                                    Formatos aceitos: JPG, PNG, WebP. Máx: 5MB.
                                </Typography>

                                {bgImage && (
                                    <Box sx={{ mt: 2, p: 1.5, bgcolor: 'grey.50', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                                        <Typography variant="caption" fontWeight="bold" display="block">URL Atual:</Typography>
                                        <Typography variant="caption" sx={{ wordBreak: 'break-all', fontFamily: 'monospace' }}>
                                            {bgImage}
                                        </Typography>
                                        <Button
                                            size="small"
                                            color="error"
                                            sx={{ mt: 1, textTransform: 'none' }}
                                            onClick={() => setBgImage('')}
                                        >
                                            Remover imagem
                                        </Button>
                                    </Box>
                                )}

                                <Box sx={{ mt: 3 }}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        Posição da Imagem
                                    </Typography>
                                    <Paper variant="outlined" sx={{ p: 1, width: 'fit-content' }}>
                                        <Grid container spacing={1} sx={{ width: 120 }}>
                                            {['left top', 'center top', 'right top', 'left center', 'center center', 'right center', 'left bottom', 'center bottom', 'right bottom'].map((pos) => (
                                                <Grid size={{ xs: 4 }} key={pos}>
                                                    <Tooltip title={pos}>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => setBgPosition(pos)}
                                                            sx={{
                                                                width: 32,
                                                                height: 32,
                                                                bgcolor: bgPosition === pos ? 'primary.light' : 'grey.100',
                                                                color: bgPosition === pos ? 'white' : 'grey.400',
                                                                '&:hover': { bgcolor: bgPosition === pos ? 'primary.main' : 'grey.200' }
                                                            }}
                                                        >
                                                            <Box sx={{
                                                                width: 8,
                                                                height: 8,
                                                                borderRadius: '50%',
                                                                bgcolor: bgPosition === pos ? 'white' : 'grey.400'
                                                            }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Grid>
                                            ))}
                                        </Grid>
                                    </Paper>
                                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                        Clique na grade para definir o ponto de foco.
                                    </Typography>
                                </Box>
                            </Grid>

                            <Grid size={{ xs: 12, md: 6 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                    Pré-visualização
                                </Typography>
                                <Box
                                    sx={{
                                        width: '100%',
                                        aspectRatio: '16/9',
                                        backgroundSize: 'cover',
                                        backgroundPosition: bgPosition,
                                        backgroundImage: bgImage ? `url(${bgImage})` : 'none',
                                        backgroundColor: !bgImage ? 'primary.main' : 'transparent',
                                        borderRadius: 2,
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        textAlign: 'center'
                                    }}
                                >
                                    <Box sx={{
                                        position: 'absolute',
                                        inset: 0,
                                        bgcolor: 'rgba(0,0,0,0.4)',
                                        p: 2,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <Typography variant="h6" fontWeight="bold">{heroTitle}</Typography>
                                        <Typography variant="caption">{heroSubtitle}</Typography>
                                    </Box>
                                </Box>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                <Card variant="outlined" sx={{ borderRadius: 2 }}>
                    <CardContent>
                        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                            Mensagem de Boas-vindas
                        </Typography>
                        <Stack spacing={2}>
                            <TextField
                                label="Título da Seção"
                                fullWidth
                                value={visitTitle}
                                onChange={(e) => setVisitTitle(e.target.value)}
                            />
                            <TextField
                                label="Texto da Mensagem"
                                fullWidth
                                multiline
                                rows={4}
                                value={visitText}
                                onChange={(e) => setVisitText(e.target.value)}
                            />
                        </Stack>
                    </CardContent>
                </Card>

                <Card variant="outlined" sx={{ borderRadius: 2 }}>
                    <CardContent>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                            <Typography variant="h6" fontWeight="bold">
                                Horários dos Cultos
                            </Typography>
                            <Button size="small" startIcon={<AddIcon />} onClick={handleAddHour}>
                                Adicionar
                            </Button>
                        </Stack>

                        <Divider sx={{ mb: 2 }} />

                        {hours.length === 0 ? (
                            <Typography color="text.secondary" textAlign="center" sx={{ py: 4 }}>
                                Nenhum horário cadastrado.
                            </Typography>
                        ) : (
                            <Box>
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={handleDragEnd}
                                >
                                    <SortableContext items={hours.map(h => h.id)} strategy={verticalListSortingStrategy}>
                                        <Stack spacing={1}>
                                            {hours.map((h, i) => (
                                                <SortableServiceHour
                                                    key={h.id}
                                                    hour={h}
                                                    onRemove={() => handleRemoveHour(i)}
                                                    onChange={(field, value) => handleHourChange(i, field, value)}
                                                />
                                            ))}
                                        </Stack>
                                    </SortableContext>
                                </DndContext>
                            </Box>
                        )}
                    </CardContent>
                </Card>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2 }}>
                    <Button
                        variant="contained"
                        size="large"
                        startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                        disabled={saving}
                        onClick={handleSave}
                        sx={{ px: 4, borderRadius: 2 }}
                    >
                        {saving ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                </Box>
            </Stack>
        </Box>
    );
};
