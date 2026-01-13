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
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Form states
    const [bgImage, setBgImage] = useState('');
    const [bgPosition, setBgPosition] = useState('center top');
    const [heroTitle, setHeroTitle] = useState('Bem-vindo a IBRENE');
    const [heroSubtitle, setHeroSubtitle] = useState('Um lugar de fé, esperança e amor.');
    const [hours, setHours] = useState<ServiceHour[]>([]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
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
            if (data.service_hours && data.service_hours.length > 0) {
                // Ensure all hours have IDs (migrating old data)
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

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);

        // If bgImage is empty string, we save it as null so the app falls back to default CSS
        // OR we can save empty string, but App.tsx checks for truthy.
        const updates = {
            hero_bg_image: bgImage || null,
            hero_bg_position: bgPosition,
            hero_title: heroTitle,
            hero_subtitle: heroSubtitle,
            service_hours: hours,
            updated_at: new Date().toISOString()
        };

        // ... (rest of save logic)

        // We first try to update. If it fails because row doesn't exist (update returns 0 rows), we usually should upsert.
        // But since we have a defined schema with id=1, let's try upsert directly.

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
                    <p>Carregando...</p>
                </div>
                <style>{`
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
                    .site-manager-loading p {
                        font-size: 1.1rem;
                        font-weight: 500;
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
                            <label>URL da Imagem</label>
                            <input
                                type="text"
                                value={bgImage}
                                onChange={(e) => setBgImage(e.target.value)}
                                placeholder="Cole o URL da imagem (deixe vazio para usar o padrão)"
                                className="form-input"
                            />
                            <p className="help-text">
                                {bgImage ? 'Imagem personalizada selecionada.' : 'Usando imagem padrão do tema.'}
                            </p>
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
                            <p className="help-text mt-2">Clique na grade para definir o ponto de foco da imagem.</p>
                        </div>
                    </div>

                    <div className="column-right">
                        <label className="preview-label">Pré-visualização (Aspecto Hero)</label>
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
                            <SortableContext
                                items={hours.map(h => h.id)}
                                strategy={verticalListSortingStrategy}
                            >
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

                .help-text { font-size: 0.8rem; color: #6b7280; margin-top: 0.5rem; }

                .bg-preview {
                    width: 100%;
                    height: 12rem;
                    background-size: cover;
                    background-position: center;
                    border: 1px solid #e5e7eb;
                    border-radius: 0.375rem;
                    margin-top: 0.5rem;
                }
                .preview-container p { font-size: 0.875rem; color: #4b5563; margin-bottom: 0.5rem; }

                .card-header-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1rem;
                }

                .btn-link { color: #2563eb; font-weight: 500; font-size: 0.875rem; background: none; border: none; cursor: pointer; }
                .btn-link:hover { text-decoration: underline; }

                .hours-list { display: flex; flex-direction: column; gap: 0.75rem; }
                
                .flex-1 { flex: 1; }
                .flex-2 { flex: 2; }
                .w-time { width: 6rem; } /* Equivalent to w-24 */

                .btn-remove { color: #ef4444; padding: 0.5rem; background: none; border: none; font-size: 1.1rem; cursor: pointer; }
                .btn-remove:hover { color: #b91c1c; }

                .empty-text { color: #9ca3af; font-style: italic; }

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

                .loading-state { padding: 2rem; text-align: center; color: #6b7280; }

                /* New styles for advanced editor */
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
                
                @media (max-width: 768px) {
                    .editor-columns { grid-template-columns: 1fr; }
                }
            `}</style>
        </div>
    );
};
