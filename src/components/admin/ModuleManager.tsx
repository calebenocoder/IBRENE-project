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
import {
  Box,
  Typography,
  Stack,
  Button,
  IconButton,
  TextField,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import {
  Add as AddIcon
} from '@mui/icons-material';

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
    <Paper
      variant="outlined"
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 3,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper'
      }}
    >
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" fontWeight="bold">Módulos</Typography>
        <IconButton
          color="primary"
          onClick={() => setShowAddModule(!showAddModule)}
          sx={{ bgcolor: 'primary.light', color: 'white', '&:hover': { bgcolor: 'primary.main' }, width: 32, height: 32 }}
        >
          <AddIcon />
        </IconButton>
      </Box>

      {showAddModule && (
        <Box sx={{ p: 2, bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider' }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Nome do módulo"
            value={newModuleTitle}
            onChange={(e) => setNewModuleTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddModule()}
            autoFocus
            sx={{ mb: 1, bgcolor: 'white' }}
          />
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Button size="small" variant="contained" onClick={handleAddModule} sx={{ textTransform: 'none' }}>Salvar</Button>
            <Button size="small" variant="outlined" onClick={() => setShowAddModule(false)} color="inherit" sx={{ textTransform: 'none' }}>Cancelar</Button>
          </Stack>
        </Box>
      )}

      <Box sx={{ flex: 1, overflowY: 'auto', p: 1.5 }}>
        <DndContext
          sensors={sensors}
          collisionDetection={(args) => {
            const { active, droppableContainers, pointerCoordinates } = args;
            if (!pointerCoordinates) return [];
            const activeData = active.data.current;
            const activeType = activeData?.type;

            if (activeType === 'module') {
              const moduleContainers = droppableContainers.filter(c => c.data.current?.type === 'module');
              return closestCenter({ ...args, droppableContainers: moduleContainers });
            }

            if (activeType === 'lesson') {
              const validContainers = droppableContainers.filter(c => c.data.current?.type === 'lesson' || c.data.current?.type === 'module');
              return closestCenter({ ...args, droppableContainers: validContainers });
            }
            return closestCenter(args);
          }}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          autoScroll={true}
        >
          <SortableContext items={modules.map(m => m.id)} strategy={verticalListSortingStrategy}>
            <Stack spacing={1}>
              {modules.map((module) => (
                <SortableModule
                  key={module.id}
                  module={module}
                  isExpanded={expandedModules.has(module.id)}
                  isSelected={selectedModuleId === module.id}
                  isEditing={editingModuleId === module.id}
                  editingTitle={editingTitle}
                  onToggleExpand={() => toggleModule(module.id)}
                  onSelect={() => onModuleSelect(module)}
                  onStartEdit={() => startEditModule(module)}
                  onSaveEdit={() => saveModuleTitle(module.id)}
                  onCancelEdit={cancelEditModule}
                  onDelete={() => handleDeleteModule(module.id)}
                  onEditTitleChange={setEditingTitle}
                  onAddLesson={() => {
                    onModuleSelect(module);
                    window.dispatchEvent(new CustomEvent('addLesson', { detail: { moduleId: module.id } }));
                  }}
                  onAddQuiz={() => {
                    onModuleSelect(module);
                    window.dispatchEvent(new CustomEvent('addQuiz', { detail: { moduleId: module.id } }));
                  }}
                >
                  {expandedModules.has(module.id) && (
                    <SortableContext
                      items={(moduleLessons[module.id] || []).map(l => l.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <Box sx={{ pl: 3, mt: 0.5, mb: 1 }}>
                        <Stack spacing={0.5}>
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
                            <Typography variant="body2" color="text.secondary" fontStyle="italic" sx={{ p: 1, textAlign: 'center' }}>
                              Nenhuma aula ainda
                            </Typography>
                          )}
                        </Stack>
                      </Box>
                    </SortableContext>
                  )}
                </SortableModule>
              ))}
            </Stack>
          </SortableContext>
        </DndContext>
      </Box>

      <Dialog
        open={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      >
        <DialogTitle>{confirmModal.title}</DialogTitle>
        <DialogContent>
          <DialogContentText>{confirmModal.message}</DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))} color="inherit" sx={{ textTransform: 'none' }}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              if (confirmModal.type === 'module' && confirmModal.id) {
                executeDeleteModule(confirmModal.id);
              } else if (confirmModal.type === 'lesson' && confirmModal.id && confirmModal.moduleId) {
                executeDeleteLesson(confirmModal.id, confirmModal.moduleId);
              }
              setConfirmModal(prev => ({ ...prev, isOpen: false }));
            }}
            color="error"
            variant="contained"
            disableElevation
            sx={{ textTransform: 'none' }}
          >
            Excluir
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};
