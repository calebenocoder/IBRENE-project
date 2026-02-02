import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import defaultHero from '../../assets/hero.png';
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
            <div className="site-manager-loading">
                <div className="loading-content">
                    <div className="spinner"></div>
                    <p>Carregando configurações...</p>
                </div>
                <style>{`
                    .site-manager-loading {
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        padding: 4rem 0;
                        color: #0f172a;
                        width: 100%;
                        min-height: 50vh;
                    }
                    .loading-content {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        gap: 20px;
                    }
                    .spinner {
                        border: 4px solid #e2e8f0;
                        border-top: 4px solid #3b82f6;
                        border-radius: 50%;
                        width: 40px;
                        height: 40px;
                        animation: spin 1s linear infinite;
                    }
                    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                `}</style>
            </div>
        );
    }

    return (
        <div className="site-manager">
            <div className="sm-header">
                <h2>Gerenciar Site</h2>
                <p>Personalize a aparência e informações do site principal.</p>
            </div>

            {message && (
                <div className={`message-alert ${message.type}`}>
                    {message.text}
                </div>
            )}

            <div className="settings-card">
                <h3>Informações Principais (Hero)</h3>
                <div className="form-group">
                    <label>Título Principal</label>
                    <input
                        type="text"
                        value={heroTitle}
                        onChange={(e) => setHeroTitle(e.target.value)}
                        className="form-input"
                        placeholder="Ex: Bem-vindo a IBRENE"
                    />
                </div>
                <div className="form-group">
                    <label>Subtítulo</label>
                    <input
                        type="text"
                        value={heroSubtitle}
                        onChange={(e) => setHeroSubtitle(e.target.value)}
                        className="form-input"
                        placeholder="Ex: Um lugar de fé, esperança e amor."
                    />
                </div>
            </div>

            <div className="settings-card">
                <h3>Imagem de Fundo</h3>
                <div className="editor-columns">
                    <div className="column-left">
                        <div className="form-group">
                            <label>Upload da Imagem</label>
                            <div className="file-upload-wrapper">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    disabled={uploading}
                                    className="file-input"
                                />
                                {uploading && <span className="uploading-text">Enviando...</span>}
                            </div>
                            <p className="help-text">
                                Formatos aceitos: JPG, PNG, WebP. Máx: 5MB.
                            </p>
                            {bgImage && (
                                <div className="current-url-display">
                                    <span className="label">URL Atual:</span>
                                    <span className="url">{bgImage.substring(0, 40)}...</span>
                                    <button onClick={() => setBgImage('')} className="btn-text-danger" title="Remover imagem">Remover</button>
                                </div>
                            )}
                        </div>

                        <div className="form-group">
                            <label>Posição da Imagem</label>
                            <div className="position-grid">
                                {['left top', 'center top', 'right top', 'left center', 'center center', 'right center', 'left bottom', 'center bottom', 'right bottom'].map((pos) => (
                                    <button
                                        key={pos}
                                        type="button"
                                        className={`pos-strut ${bgPosition === pos ? 'active' : ''}`}
                                        onClick={() => setBgPosition(pos)}
                                        title={pos}
                                    >
                                        <div className="dot"></div>
                                    </button>
                                ))}
                            </div>
                            <p className="help-text mt-2">Clique na grade para definir o ponto de foco.</p>
                        </div>
                    </div>

                    <div className="column-right">
                        <label className="preview-label">Pré-visualização</label>
                        <div
                            className="bg-preview-hero"
                            style={{
                                backgroundImage: `url(${bgImage || defaultHero})`,
                                backgroundPosition: bgPosition
                            }}
                        >
                            <div className="preview-overlay">
                                <h4>{heroTitle}</h4>
                                <p>{heroSubtitle}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="settings-card">
                <h3>Mensagem de Boas-vindas</h3>
                <div className="form-group">
                    <label>Título da Seção</label>
                    <input
                        type="text"
                        value={visitTitle}
                        onChange={(e) => setVisitTitle(e.target.value)}
                        className="form-input"
                        placeholder="Ex: Estamos ansiosos em te conhecer"
                    />
                </div>
                <div className="form-group">
                    <label>Texto da Mensagem</label>
                    <textarea
                        value={visitText}
                        onChange={(e) => setVisitText(e.target.value)}
                        className="form-input textarea-input"
                        placeholder="Ex: Não importa onde você esteja..."
                        rows={3}
                    />
                </div>
            </div>

            <div className="settings-card">
                <div className="card-header-row">
                    <h3>Horários dos Cultos</h3>
                    <button onClick={handleAddHour} className="btn-link">+ Adicionar Horário</button>
                </div>

                {hours.length === 0 ? (
                    <p className="empty-text">Nenhum horário cadastrado.</p>
                ) : (
                    <div className="hours-list">
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext items={hours.map(h => h.id)} strategy={verticalListSortingStrategy}>
                                {hours.map((h, i) => (
                                    <SortableServiceHour
                                        key={h.id}
                                        hour={h}
                                        onRemove={() => handleRemoveHour(i)}
                                        onChange={(field, value) => handleHourChange(i, field, value)}
                                    />
                                ))}
                            </SortableContext>
                        </DndContext>
                    </div>
                )}
            </div>

            <div className="actions-row">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className={`btn-save ${saving ? 'disabled' : ''}`}
                >
                    {saving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
            </div>

            <style>{`
                .site-manager { padding-bottom: 2rem; }
                .sm-header { margin-bottom: 2rem; }
                .sm-header h2 { font-size: 1.5rem; font-weight: 700; color: #1f2937; margin-bottom: 0.5rem; }
                .sm-header p { color: #6b7280; }

                .settings-card {
                    background: white;
                    border: 1px solid #e5e7eb;
                    border-radius: 0.5rem;
                    padding: 1.5rem;
                    margin-bottom: 1.5rem;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
                }

                .settings-card h3 {
                    font-size: 1.1rem;
                    font-weight: 600;
                    color: #374151;
                    margin-bottom: 1rem;
                }

                .form-group { margin-bottom: 1rem; }
                .form-group label { display: block; font-size: 0.875rem; font-weight: 500; color: #374151; margin-bottom: 0.5rem; }
                
                .form-input {
                    width: 100%;
                    padding: 0.625rem;
                    border: 1px solid #d1d5db;
                    border-radius: 0.375rem;
                    font-family: inherit;
                    font-size: 0.9rem;
                }
                .form-input:focus { outline: 2px solid #2563eb; border-color: transparent; }
                .textarea-input { resize: vertical; min-height: 80px; }

                .file-upload-wrapper {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }
                
                .file-input {
                    font-size: 0.9rem;
                    color: #6b7280;
                }
                .file-input::file-selector-button {
                    margin-right: 1rem;
                    padding: 0.5rem 1rem;
                    border-radius: 0.375rem;
                    background-color: #eff6ff;
                    color: #1d4ed8;
                    border: 1px solid #bfdbfe;
                    cursor: pointer;
                    font-weight: 500;
                    transition: all 0.2s;
                }
                .file-input::file-selector-button:hover {
                    background-color: #dbeafe;
                }
                
                .current-url-display {
                    margin-top: 0.5rem;
                    font-size: 0.85rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    background: #f9fafb;
                    padding: 0.5rem;
                    border-radius: 4px;
                }
                .current-url-display .label { font-weight: 600; color: #4b5563; }
                .current-url-display .url { color: #6b7280; font-family: monospace; }
                .btn-text-danger { color: #ef4444; background: none; border: none; font-size: 0.75rem; cursor: pointer; text-decoration: underline; }

                .help-text { font-size: 0.8rem; color: #6b7280; margin-top: 0.5rem; }

                .card-header-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1rem;
                }

                .btn-link { color: #2563eb; font-weight: 500; font-size: 0.875rem; background: none; border: none; cursor: pointer; }
                .btn-link:hover { text-decoration: underline; }

                .hours-list { display: flex; flex-direction: column; gap: 0.75rem; }
                
                .actions-row { display: flex; justify-content: flex-end; }
                
                .btn-save {
                    background-color: #2563eb;
                    color: white;
                    padding: 0.625rem 1.5rem;
                    border-radius: 0.375rem;
                    font-weight: 500;
                    border: none;
                    cursor: pointer;
                }
                .btn-save:hover { background-color: #1d4ed8; }
                .btn-save.disabled { background-color: #93c5fd; cursor: not-allowed; }

                .message-alert { padding: 1rem; border-radius: 0.375rem; margin-bottom: 1.5rem; }
                .message-alert.success { background-color: #dcfce7; color: #166534; }
                .message-alert.error { background-color: #fee2e2; color: #991b1b; }

                .editor-columns {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 2rem;
                    align-items: start;
                }
                
                .position-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 8px;
                    width: 120px;
                    margin-top: 0.5rem;
                }
                
                .pos-strut {
                    width: 32px;
                    height: 32px;
                    border: 1px solid #d1d5db;
                    background: #f9fafb;
                    border-radius: 4px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .pos-strut:hover { border-color: #3b82f6; }
                .pos-strut.active {
                    background: #eff6ff;
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
                }
                
                .pos-strut .dot {
                    width: 8px;
                    height: 8px;
                    background: #d1d5db;
                    border-radius: 50%;
                }
                
                .pos-strut.active .dot { background: #3b82f6; }
                
                .bg-preview-hero {
                    width: 100%;
                    aspect-ratio: 16/9;
                    background-size: cover;
                    background-repeat: no-repeat;
                    border-radius: 8px;
                    border: 1px solid #e2e8f0;
                    position: relative;
                    overflow: hidden;
                }
                
                .preview-overlay {
                    position: absolute;
                    inset: 0;
                    background: rgba(15, 23, 42, 0.5);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    text-align: center;
                    padding: 1rem;
                }
                
                .preview-overlay h4 { font-size: 1.2rem; margin-bottom: 0.25rem; }
                .preview-overlay p { font-size: 0.8rem; opacity: 0.9; }
                
                .preview-label { dislay: block; margin-bottom: 0.5rem; font-weight: 500; font-size: 0.875rem; color: #374151; }
                
                 /* Loading spinner styles */
                 .site-manager-loading {
                     display: flex;
                     justify-content: center;
                     align-items: center;
                     padding: 4rem 0;
                     color: #0f172a;
                 }
                 .loading-content {
                     display: flex;
                     flex-direction: column;
                     align-items: center;
                     gap: 20px;
                 }
                 .site-manager-loading .spinner {
                     border: 4px solid #e2e8f0;
                     border-top: 4px solid #3b82f6;
                     border-radius: 50%;
                     width: 40px;
                     height: 40px;
                     animation: spin 1s linear infinite;
                 }
                 @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

                @media (max-width: 768px) {
                    .editor-columns { grid-template-columns: 1fr; }
                }
            `}</style>
        </div>
    );
};
