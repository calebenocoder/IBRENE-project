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
  type DragOverEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableModule } from './SortableModule';
import { SortableLesson } from './SortableLesson';
import { ConfirmationModal } from '../ConfirmationModal';

interface Module {
  id: string;
  title: string;
  order_index: number;
}

interface Lesson {
  id: string;
  module_id: string;
  title: string;
  content_type: 'video' | 'text' | 'quiz';
  order_index: number;
  is_published?: boolean;
}

interface ModuleManagerProps {
  courseId: string;
  modules: Module[];
  onModulesChange: (newModules?: Module[]) => void;
  onModuleSelect: (module: Module) => void;
  onLessonSelect: (lesson: Lesson) => void;
  selectedModuleId?: string;
  selectedLessonId?: string;
}

export const ModuleManager: React.FC<ModuleManagerProps> = ({
  courseId,
  modules,
  onModulesChange,
  onModuleSelect,
  onLessonSelect,
  selectedModuleId,
  selectedLessonId
}) => {
  const [showAddModule, setShowAddModule] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [moduleLessons, setModuleLessons] = useState<Record<string, Lesson[]>>({});
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [showAddLessonMenu, setShowAddLessonMenu] = useState<string | null>(null);

  // New State for Confirmation Modal
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'module' | 'lesson' | null;
    id: string | null;
    moduleId?: string; // For lessons
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: null,
    id: null,
    title: '',
    message: ''
  });

  // New State for Confirmation Modal


  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required to start drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    modules.forEach(module => fetchLessons(module.id));
  }, [modules]);

  const fetchLessons = async (moduleId: string) => {
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('module_id', moduleId)
      .order('order_index');

    if (!error && data) {
      setModuleLessons(prev => ({ ...prev, [moduleId]: data }));
    }
  };

  const handleAddModule = async () => {
    if (!newModuleTitle.trim()) return;

    const { error } = await supabase
      .from('modules')
      .insert([{
        course_id: courseId,
        title: newModuleTitle,
        order_index: modules.length
      }]);

    if (!error) {
      setNewModuleTitle('');
      setShowAddModule(false);
      onModulesChange();
    }
  };

  const handleDeleteModule = (moduleId: string) => {
    setConfirmModal({
      isOpen: true,
      type: 'module',
      id: moduleId,
      title: 'Excluir Módulo',
      message: 'Tem certeza que deseja excluir este módulo? Todas as aulas contidas nele serão excluídas permanentemente.'
    });
  };

  const executeDeleteModule = async (moduleId: string) => {
    // 1. Delete lessons first manually to ensure cascade works even if DB constraint is missing cascade
    const { error: lessonsError } = await supabase
      .from('lessons')
      .delete()
      .eq('module_id', moduleId);

    if (lessonsError) {
      console.error('Error deleting module lessons:', lessonsError);
      alert('Erro ao excluir aulas do módulo: ' + lessonsError.message);
      return;
    }

    // 2. Delete the module
    const { error, count } = await supabase
      .from('modules')
      .delete({ count: 'exact' })
      .eq('id', moduleId);

    // Removed debug log

    if (error) {
      console.error('Error deleting module:', error);
      alert('Erro ao excluir módulo: ' + error.message);
    } else if (count === 0) {
      alert('A exclusão falhou silenciosamente (0 itens removidos). Verifique as permissões do usuário (RLS) ou se o item já foi removido.');
    } else {
      onModulesChange();
    }
  };

  const toggleModule = (moduleId: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  const executeDeleteLesson = async (lessonId: string, moduleId: string) => {
    const { error, count } = await supabase
      .from('lessons')
      .delete({ count: 'exact' })
      .eq('id', lessonId);

    if (error) {
      console.error('Error deleting lesson:', error);
      alert('Erro ao excluir aula: ' + error.message);
      return;
    }

    if (count === 0) {
      alert('Falha ao excluir aula: Item não encontrado ou permissão negada.');
      return;
    }

    // Refresh lessons for this module
    fetchLessons(moduleId);
  };

  const handleDeleteLesson = (lessonId: string, moduleId: string) => {
    setConfirmModal({
      isOpen: true,
      type: 'lesson',
      id: lessonId,
      moduleId,
      title: 'Excluir Aula',
      message: 'Tem certeza que deseja excluir esta aula? Esta ação não pode ser desfeita.'
    });
  };

  const startEditModule = (module: Module) => {
    setEditingModuleId(module.id);
    setEditingTitle(module.title);
  };

  const saveModuleTitle = async (moduleId: string) => {
    if (!editingTitle.trim()) return;

    const { error } = await supabase
      .from('modules')
      .update({ title: editingTitle.trim() })
      .eq('id', moduleId);

    if (!error) {
      setEditingModuleId(null);
      setEditingTitle('');
      onModulesChange();
    }
  };

  const cancelEditModule = () => {
    setEditingModuleId(null);
    setEditingTitle('');
  };

  const findModuleForLesson = (lessonId: string): string | undefined => {
    return Object.keys(moduleLessons).find(moduleId =>
      moduleLessons[moduleId]?.some(l => l.id === lessonId)
    );
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    const overId = over?.id;

    if (!overId || active.id === overId) return;

    const activeType = active.data.current?.type;
    const overType = over?.data.current?.type;

    // Only handle lesson moving between modules
    if (activeType !== 'lesson') return;

    // Find the source and destination modules
    const activeModuleId = findModuleForLesson(String(active.id));

    let overModuleId: string | undefined;
    if (overType === 'module') {
      overModuleId = String(overId);
    } else if (overType === 'lesson') {
      overModuleId = findModuleForLesson(String(overId));
    }

    if (!activeModuleId || !overModuleId || activeModuleId === overModuleId) return;

    // Move the lesson to the new module in state
    setModuleLessons(prev => {
      const activeItems = prev[activeModuleId] || [];
      const overItems = prev[overModuleId] || [];

      const activeIndex = activeItems.findIndex(l => l.id === active.id);
      const overIndex = overItems.findIndex(l => l.id === overId);

      let newIndex;
      if (overType === 'module') {
        newIndex = overItems.length + 1;
      } else {
        const isBelowOverItem =
          over &&
          active.rect.current.translated &&
          active.rect.current.translated.top >
          over.rect.top + over.rect.height;

        const modifier = isBelowOverItem ? 1 : 0;
        newIndex = overIndex >= 0 ? overIndex + modifier : overItems.length + 1;
      }

      const activeLesson = activeItems[activeIndex];
      if (!activeLesson) return prev; // Safety check

      // Create new lesson object with updated module_id
      const updatedLesson = { ...activeLesson, module_id: overModuleId! };

      return {
        ...prev,
        [activeModuleId]: [
          ...prev[activeModuleId].filter(item => item.id !== active.id)
        ],
        [overModuleId]: [
          ...prev[overModuleId].slice(0, newIndex),
          updatedLesson,
          ...prev[overModuleId].slice(newIndex, prev[overModuleId].length)
        ]
      };
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeData = active.data.current;

    // ------- MODULE REORDERING -------
    if (activeData?.type === 'module') {
      if (active.id === over.id) return;

      const oldIndex = modules.findIndex(m => m.id === active.id);
      const newIndex = modules.findIndex(m => m.id === over.id);

      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(modules, oldIndex, newIndex);

      // 1. Optimistic Update
      onModulesChange(reordered);

      // 2. Database Update
      const updates = reordered.map((mod, idx) => ({
        id: mod.id,
        course_id: courseId,
        title: mod.title,
        order_index: idx,
      }));

      const { error } = await supabase
        .from('modules')
        .upsert(updates, { onConflict: 'id' });

      if (error) {
        console.error('Error updating module order:', error);
        onModulesChange();
      }
      return;
    }

    // ------- LESSON REORDERING -------
    if (activeData?.type === 'lesson') {
      const activeId = String(active.id);
      const overId = String(over.id);

      // Find where the item ended up
      const moduleId = findModuleForLesson(activeId);
      if (!moduleId) return;

      const lessons = moduleLessons[moduleId] || [];
      const oldIndex = lessons.findIndex(l => l.id === activeId);
      const newIndex = lessons.findIndex(l => l.id === overId);

      // If just dropped in same place (and same list), do nothing
      // Note: If moved between lists, oldIndex/newIndex might differ, but activeId and overId checks handle it.
      // Wait, if moved between lists, handleDragOver already updated state.
      // We just need to persist the CURRENT order of the module it is IN.

      // If we used handleDragOver, the item is ALREADY in the new list in state.
      // So we just need to reorder if necessary (if drag continued within the new list)

      if (oldIndex !== newIndex) {
        const reordered = arrayMove(lessons, oldIndex, newIndex);
        setModuleLessons(prev => ({
          ...prev,
          [moduleId]: reordered
        }));

        // Update the DB with new order AND new module_id for THIS list
        persistLessonOrder(moduleId, reordered);
      } else {
        // Even if index didn't change, if it moved Module, we need to persist!
        // How do we know if it moved module in dragEnd?
        // ActiveData still has OLD module_id usually?
        // Let's rely on the fact that we need to persist the state of the target module.
        persistLessonOrder(moduleId, lessons);
      }
    }
  };

  const persistLessonOrder = async (moduleId: string, lessons: Lesson[]) => {
    const updates = lessons.map((l, idx) => ({
      id: l.id,
      module_id: moduleId, // Ensure we save the correct module_id
      title: l.title,
      content_type: l.content_type || 'text',
      order_index: idx
    }));

    const { error } = await supabase
      .from('lessons')
      .upsert(updates, { onConflict: 'id' });

    if (error) {
      console.error('Error updating lesson order:', error);
      fetchLessons(moduleId);
    }
  };

  return (
    <div className="module-manager">
      <div className="manager-header">
        <h3>Módulos</h3>
        <button
          className="btn-add-module"
          onClick={() => setShowAddModule(!showAddModule)}
        >
          +
        </button>
      </div>

      {showAddModule && (
        <div className="add-module-form">
          <input
            type="text"
            placeholder="Nome do módulo"
            value={newModuleTitle}
            onChange={(e) => setNewModuleTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddModule()}
            autoFocus
          />
          <div className="form-actions">
            <button className="btn-save" onClick={handleAddModule}>Salvar</button>
            <button className="btn-cancel" onClick={() => setShowAddModule(false)}>Cancelar</button>
          </div>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={(args) => {
          // pointerWithin is better for large items, closestCenter is better for lists
          // but we prioritize type filtering first.

          const { active, droppableContainers, pointerCoordinates } = args;

          if (!pointerCoordinates) return [];

          const activeData = active.data.current;
          const activeType = activeData?.type;

          if (activeType === 'module') {
            // If dragging a module, ONLY collide with other modules
            const moduleContainers = droppableContainers.filter(
              c => c.data.current?.type === 'module'
            );
            return closestCenter({
              ...args,
              droppableContainers: moduleContainers
            });
          }

          if (activeType === 'lesson') {
            // Allow colliding with both lessons and modules to enable moving between modules
            const validContainers = droppableContainers.filter(
              c => c.data.current?.type === 'lesson' || c.data.current?.type === 'module'
            );
            return closestCenter({
              ...args,
              droppableContainers: validContainers
            });
          }

          // Fallback
          return closestCenter(args);
        }}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        autoScroll={true}
      >
        <SortableContext
          items={modules.map(m => m.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="modules-list">
            {modules.map((module) => (
              <SortableModule
                key={module.id}
                module={module}
                isExpanded={expandedModules.has(module.id)}
                isSelected={selectedModuleId === module.id}
                isEditing={editingModuleId === module.id}
                editingTitle={editingTitle}
                showAddMenu={showAddLessonMenu === module.id}
                onToggleExpand={() => toggleModule(module.id)}
                onSelect={() => onModuleSelect(module)}
                onStartEdit={() => startEditModule(module)}
                onSaveEdit={() => saveModuleTitle(module.id)}
                onCancelEdit={cancelEditModule}
                onDelete={() => handleDeleteModule(module.id)}
                onEditTitleChange={setEditingTitle}
                onToggleAddMenu={() => setShowAddLessonMenu(showAddLessonMenu === module.id ? null : module.id)}
                onAddLesson={() => {
                  onModuleSelect(module);
                  setShowAddLessonMenu(null);
                  window.dispatchEvent(new CustomEvent('addLesson', { detail: { moduleId: module.id } }));
                }}
                onAddQuiz={() => {
                  onModuleSelect(module);
                  setShowAddLessonMenu(null);
                  window.dispatchEvent(new CustomEvent('addQuiz', { detail: { moduleId: module.id } }));
                }}
              >
                {expandedModules.has(module.id) && (
                  <SortableContext
                    items={(moduleLessons[module.id] || []).map(l => l.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="lessons-list">
                      {moduleLessons[module.id]?.map((lesson) => (
                        <SortableLesson
                          key={lesson.id}
                          lesson={lesson}
                          onSelect={() => onLessonSelect(lesson)}
                          onDelete={() => handleDeleteLesson(lesson.id, module.id)}
                          isSelected={lesson.id === selectedLessonId}
                        />
                      ))}
                      {(!moduleLessons[module.id] || moduleLessons[module.id].length === 0) && (
                        <div className="empty-lessons">Nenhuma aula ainda</div>
                      )}
                    </div>
                  </SortableContext>
                )}
              </SortableModule>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={() => {
          if (confirmModal.type === 'module' && confirmModal.id) {
            executeDeleteModule(confirmModal.id);
          } else if (confirmModal.type === 'lesson' && confirmModal.id && confirmModal.moduleId) {
            executeDeleteLesson(confirmModal.id, confirmModal.moduleId);
          }
        }}
        title={confirmModal.title}
        message={confirmModal.message}
        isDangerous={true}
        confirmText="Excluir"
      />

      <style>{`
        .module-manager {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: white;
          border-radius: 12px;
          overflow: hidden;
        }

        .manager-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid #e2e8f0;
        }

        .manager-header h3 {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 700;
          color: #1a1a1a;
        }

        .btn-add-module {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #007bff;
          color: white;
          border: none;
          font-size: 1.3rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .btn-add-module:hover {
          background: #0056b3;
          transform: scale(1.1);
        }

        .add-module-form {
          padding: 12px 20px;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
        }

        .add-module-form input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          font-size: 0.9rem;
          margin-bottom: 8px;
        }

        .form-actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }

        .form-actions button {
          padding: 6px 12px;
          border-radius: 6px;
          border: none;
          font-size: 0.85rem;
          cursor: pointer;
          font-weight: 600;
        }

        .btn-save {
          background: #007bff;
          color: white;
        }

        .btn-cancel {
          background: #e2e8f0;
          color: #475569;
        }

        .modules-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 12px;
          overflow-y: auto;
          flex: 1;
        }

        .module-item {
          border-radius: 8px;
          overflow: hidden;
        }

        .module-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px;
          cursor: pointer;
          transition: all 0.2s;
          border-radius: 8px;
        }

        .module-header:hover {
          background: #f8fafc;
        }

        .module-header.selected {
          background: #eff6ff;
          color: #007bff;
        }

        .expand-icon {
          font-size: 0.7rem;
          color: #94a3b8;
        }

        .drag-handle {
          font-size: 0.9rem;
          color: #cbd5e1;
          cursor: grab;
          user-select: none;
        }

        .drag-handle:active {
          cursor: grabbing;
        }

        .expand-area {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px;
          margin-left: -4px;
          border-radius: 4px;
        }

        .expand-area:hover {
          background: #e2e8f0;
        }

        .module-title {
          flex: 1;
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
        }

        .module-actions {
          display: flex;
          gap: 4px;
          align-items: center;
        }

        .btn-add-lesson {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #3b82f6;
          color: white;
          border: none;
          cursor: pointer;
          opacity: 0;
          transition: all 0.2s;
          font-size: 1.1rem;
          line-height: 1;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .module-header:hover .btn-add-lesson {
          opacity: 1;
        }

        .btn-add-lesson:hover {
          background: #2563eb;
          transform: scale(1.1);
        }

        .btn-delete-module {
          background: none;
          border: none;
          cursor: pointer;
          opacity: 0;
          transition: opacity 0.2s;
          font-size: 1rem;
        }

        .module-header:hover .btn-delete-module {
          opacity: 1;
        }

        .btn-edit-module {
          background: none;
          border: none;
          cursor: pointer;
          opacity: 0;
          transition: opacity 0.2s;
          font-size: 1.1rem;
          color: #3b82f6;
          padding: 0 4px;
        }

        .module-header:hover .btn-edit-module {
          opacity: 1;
        }

        .add-lesson-menu {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 4px;
          margin: 4px 0 4px 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .menu-item {
          display: block;
          width: 100%;
          padding: 8px 12px;
          border: none;
          background: none;
          text-align: left;
          cursor: pointer;
          border-radius: 6px;
          transition: background 0.2s;
          font-size: 0.9rem;
        }

        .menu-item:hover {
          background: #f8fafc;
        }

        .module-edit-inline {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px;
          background: #f8fafc;
          border-radius: 8px;
          border: 2px solid #3b82f6;
        }

        .module-title-input {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          font-size: 0.95rem;
          font-weight: 600;
        }

        .btn-save-module,
        .btn-cancel-module {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          border: none;
          font-size: 1.2rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .btn-save-module {
          background: #22c55e;
          color: white;
        }

        .btn-save-module:hover {
          background: #16a34a;
        }

        .btn-cancel-module {
          background: #ef4444;
          color: white;
        }

        .btn-cancel-module:hover {
          background: #dc2626;
        }

        .lessons-list {
          padding-left: 24px;
          margin-top: 4px;
        }

        .lesson-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          cursor: pointer;
          border-radius: 6px;
          transition: all 0.2s;
          margin-bottom: 2px;
        }

        .lesson-item:hover {
          background: #f1f5f9;
        }

        .lesson-item.selected {
          background: #eff6ff;
          color: #007bff;
        }

        .lesson-item.selected .lesson-title {
          color: #007bff;
          font-weight: 500;
        }

        .lesson-icon {
          font-size: 0.9rem;
        }

        .drag-handle-lesson {
          font-size: 0.75rem;
          color: #cbd5e1;
          cursor: grab;
          user-select: none;
          opacity: 0;
          transition: opacity 0.2s;
          padding: 8px; /* Increased padding for larger hit area */
          margin: -8px; /* Negative margin to offset padding so it doesn't affect layout */
        }

        .lesson-item:hover .drag-handle-lesson {
          opacity: 1;
        }

        .drag-handle-lesson:active {
          cursor: grabbing;
        }

        .lesson-title {
          flex: 1;
          font-size: 0.9rem;
          color: #475569;
        }

        .btn-delete-lesson {
          background: none;
          border: none;
          cursor: pointer;
          opacity: 0;
          color: #ef4444;
          font-size: 1.2rem;
          line-height: 1;
        }

        .lesson-item:hover .btn-delete-lesson {
          opacity: 1;
        }

        .empty-lessons {
          padding: 12px;
          text-align: center;
          color: #94a3b8;
          font-size: 0.85rem;
          font-style: italic;
        }
      `}</style>
    </div>
  );
};
