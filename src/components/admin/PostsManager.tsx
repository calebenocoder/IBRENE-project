import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

interface Post {
    id: string;
    title: string;
    subtitle: string;
    content: string;
    image_url: string;
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
    const [visible, setVisible] = useState(true);
    const [uploading, setUploading] = useState(false);

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
            <div className="posts-loading">
                <div className="loading-content">
                    <div className="spinner"></div>
                    <p>Carregando postagens...</p>
                </div>
                <style>{`
                    .posts-loading {
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

    if (isCreating) {
        return (
            <div className="posts-editor">
                <div className="editor-header">
                    <h3>{editingPost ? 'Editar Postagem' : 'Nova Postagem'}</h3>
                    <button onClick={resetForm} className="btn-secondary">Cancelar</button>
                </div>

                <div className="form-group checkbox-group">
                    <label className="toggle-label">
                        <input
                            type="checkbox"
                            checked={visible}
                            onChange={(e) => setVisible(e.target.checked)}
                        />
                        <span className="toggle-text">Postagem Visível no Site?</span>
                    </label>
                </div>

                <div className="form-group">
                    <label>Título</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="form-input"
                        placeholder="Ex: Conferência de Jovens"
                    />
                </div>

                <div className="form-row">
                    <div className="form-group half">
                        <label>Categoria</label>
                        <input
                            type="text"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="form-input"
                            placeholder="Ex: Jovens, Missões"
                        />
                    </div>
                    <div className="form-group half">
                        <label>Data do Evento</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="form-input"
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label>Subtítulo (Curta descrição para o card)</label>
                    <input
                        type="text"
                        value={subtitle}
                        onChange={(e) => setSubtitle(e.target.value)}
                        className="form-input"
                        placeholder="Uma breve descrição que aparece no card..."
                    />
                </div>

                <div className="form-group">
                    <label>Imagem de Capa</label>
                    <div className="image-upload-container">
                        {imageUrl && (
                            <div className="image-previewor">
                                <img src={imageUrl} alt="Capa" className="preview-img" />
                            </div>
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="file-input"
                        />
                        {uploading && <span className="upload-status">Enviando...</span>}
                    </div>
                </div>

                <div className="form-group">
                    <label>Conteúdo Completo</label>
                    <div className="quill-wrapper">
                        <ReactQuill
                            theme="snow"
                            value={content}
                            onChange={setContent}
                            style={{ height: '300px', marginBottom: '50px' }}
                        />
                    </div>
                </div>

                <div className="form-actions">
                    <button onClick={handleSave} className="btn-primary">
                        Salvar Postagem
                    </button>
                </div>

                <style>{`
                    .posts-editor {
                        background: white;
                        padding: 2rem;
                        border-radius: 8px;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                        max-width: 900px;
                        margin: 0 auto;
                    }
                    .editor-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 2rem;
                        border-bottom: 1px solid #e2e8f0;
                        padding-bottom: 1rem;
                    }
                    .form-group { margin-bottom: 1.5rem; }
                    .form-row { display: flex; gap: 1rem; }
                    .half { flex: 1; }
                    
                    .toggle-label {
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                        cursor: pointer;
                        font-weight: 500;
                    }
                    .toggle-text { color: #1e293b; }

                    .form-input {
                        width: 100%;
                        padding: 0.75rem;
                        border: 1px solid #e2e8f0;
                        border-radius: 6px;
                        font-size: 1rem;
                    }
                    .form-input:focus {
                        outline: none;
                        border-color: #3b82f6;
                        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
                    }
                    
                    .btn-primary {
                        background: #3b82f6;
                        color: white;
                        padding: 0.75rem 1.5rem;
                        border-radius: 6px;
                        font-weight: 600;
                        transition: background 0.2s;
                    }
                    .btn-primary:hover { background: #2563eb; }
                    
                    .btn-secondary {
                        background: white;
                        color: #64748b;
                        border: 1px solid #cbd5e1;
                        padding: 0.5rem 1rem;
                        border-radius: 6px;
                        font-weight: 500;
                        cursor: pointer;
                        transition: all 0.2s;
                    }
                    .btn-secondary:hover { 
                        background: #f1f5f9; 
                        border-color: #94a3b8;
                        color: #475569;
                    }

                    .image-previewor {
                        width: 100%;
                        height: 200px;
                        background: #f8fafc;
                        border-radius: 8px;
                        overflow: hidden;
                        margin-bottom: 0.5rem;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        border: 1px dashed #cbd5e1;
                    }
                    .preview-img {
                        height: 100%;
                        width: 100%;
                        object-fit: cover;
                    }
                    .file-input { margin-top: 0.5rem; }
                `}</style>
            </div>
        );
    }

    return (
        <div className="posts-manager">
            <div className="manager-header">
                <h2>Gerenciar Postagens</h2>
                <button onClick={handleCreate} className="btn-primary">+ Nova Postagem</button>
            </div>

            <div className="posts-list">
                {posts.map((post) => (
                    <div key={post.id} className="post-item">
                        <div className="post-status">
                            <label className="toggle-switch" title={post.visible !== false ? 'Visível (Clique para ocultar)' : 'Oculto (Clique para mostrar)'}>
                                <input
                                    type="checkbox"
                                    checked={post.visible !== false}
                                    onChange={() => handleToggleVisible(post)}
                                />
                                <span className="slider"></span>
                            </label>
                        </div>
                        <div className="post-img" style={{ backgroundImage: `url(${post.image_url || '/placeholder-image.jpg'})` }}></div>
                        <div className="post-info">
                            <h4>
                                {post.title}
                                {post.visible === false && <span className="badge-hidden">Oculto</span>}
                            </h4>
                            <span className="post-date">
                                {new Date(post.event_date).toLocaleDateString()} • {post.category}
                            </span>
                        </div>
                        <div className="post-actions">
                            <button onClick={() => handleEdit(post)} className="action-btn edit">Editar</button>
                            <button onClick={() => requestDelete(post.id)} className="action-btn delete">Excluir</button>
                        </div>
                    </div>
                ))}

                {posts.length === 0 && (
                    <div className="empty-state">
                        <p>Nenhuma postagem encontrada.</p>
                    </div>
                )}
            </div>

            {/* Custom Delete Confirmation Modal */}
            {deleteConfirmation.isOpen && (
                <div className="modal-overlay">
                    <div className="modal-dialog">
                        <h3>Confirmar Exclusão</h3>
                        <p>Tem certeza que deseja excluir esta postagem? Esta ação não pode ser desfeita.</p>
                        <div className="modal-actions">
                            <button onClick={cancelDelete} className="btn-secondary">Cancelar</button>
                            <button onClick={confirmDelete} className="btn-danger">Sim, Excluir</button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .manager-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 2rem;
                }
                .posts-list {
                    background: white;
                    border-radius: 8px;
                    border: 1px solid #e2e8f0;
                    overflow: hidden;
                }
                .post-item {
                    display: flex;
                    align-items: center;
                    padding: 1rem;
                    border-bottom: 1px solid #f1f5f9;
                    gap: 1rem;
                }
                .post-item:last-child { border-bottom: none; }
                
                .post-status {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-right: 0.5rem;
                }
                
                .toggle-switch {
                    position: relative;
                    display: inline-block;
                    width: 36px;
                    height: 20px;
                }
                
                .toggle-switch input { 
                    opacity: 0;
                    width: 0;
                    height: 0;
                }
                
                .slider {
                    position: absolute;
                    cursor: pointer;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: #cbd5e1;
                    transition: .4s;
                    border-radius: 34px;
                }
                
                .slider:before {
                    position: absolute;
                    content: "";
                    height: 16px;
                    width: 16px;
                    left: 2px;
                    bottom: 2px;
                    background-color: white;
                    transition: .4s;
                    border-radius: 50%;
                }
                
                input:checked + .slider {
                    background-color: #22c55e;
                }
                
                input:focus + .slider {
                    box-shadow: 0 0 1px #22c55e;
                }
                
                input:checked + .slider:before {
                    transform: translateX(16px);
                }

                .badge-hidden {
                    display: inline-block;
                    background: #f1f5f9;
                    color: #64748b;
                    font-size: 0.75rem;
                    padding: 2px 6px;
                    border-radius: 4px;
                    margin-left: 0.5rem;
                    font-weight: 500;
                }

                .post-img {
                    width: 60px;
                    height: 60px;
                    background-size: cover;
                    background-position: center;
                    border-radius: 4px;
                    background-color: #e2e8f0;
                }
                .post-info { flex: 1; }
                .post-info h4 { margin: 0 0 0.25rem 0; font-size: 1rem; color: #1e293b; display: flex; align-items: center; }
                .post-date { font-size: 0.875rem; color: #94a3b8; }
                
                .post-actions { display: flex; gap: 0.5rem; }
                .action-btn {
                    padding: 0.25rem 0.75rem;
                    border-radius: 4px;
                    font-size: 0.875rem;
                    font-weight: 500;
                    cursor: pointer;
                }
                .action-btn.edit {
                    background: #eff6ff;
                    color: #3b82f6;
                }
                .action-btn.edit:hover { background: #dbeafe; }
                
                .action-btn.delete {
                    background: #fef2f2;
                    color: #ef4444;
                }
                .action-btn.delete:hover { background: #fee2e2; }

                .empty-state {
                    padding: 3rem;
                    text-align: center;
                    color: #94a3b8;
                }

                /* Modal Styles */
                .modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0,0,0,0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                }
                .modal-dialog {
                    background: white;
                    padding: 2rem;
                    border-radius: 8px;
                    max-width: 400px;
                    width: 90%;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                }
                .modal-dialog h3 { margin-top: 0; color: #1e293b; }
                .modal-dialog p { color: #64748b; margin-bottom: 1.5rem; }
                .modal-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 1rem;
                }
                .btn-danger {
                    background: #ef4444;
                    color: white;
                    padding: 0.5rem 1rem;
                    border-radius: 6px;
                    font-weight: 600;
                }
                .btn-danger:hover { background: #dc2626; }
                .btn-secondary {
                    background: white;
                    color: #64748b;
                    border: 1px solid #cbd5e1;
                    padding: 0.5rem 1rem;
                    border-radius: 6px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .btn-secondary:hover { 
                    background: #f1f5f9; 
                    border-color: #94a3b8;
                    color: #475569;
                }
            `}</style>
        </div>
    );
};
