import React, { useState, useEffect } from 'react';
import type { Category, Tag } from '../../types';
import { PlusIcon, PencilIcon, TrashIcon, ChevronRightIcon, GripVerticalIcon } from '../icons/Icons';
import { useUI } from '../../contexts/UIContext';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';

interface CategoryRowProps {
    category: Category;
    level: number;
    onEditCategory: (category: Category) => void;
    onDeleteCategory: (categoryId: number) => void;
    canEdit: boolean;
    canDelete: boolean;
    isExpanded: boolean;
    onToggleExpand: (categoryId: number) => void;
    expandedCategories: number[];
    onDragStart: (e: React.DragEvent, categoryId: number) => void;
    onDragOver: (e: React.DragEvent, categoryId: number) => void;
    onDragEnd: () => void;
    onDrop: (targetCategoryId: number) => void;
    isDragging: boolean;
    isDragOver: boolean;
}

const CategoryRow: React.FC<CategoryRowProps> = (props) => {
    const { 
        category, level, onEditCategory, onDeleteCategory, canEdit, canDelete, 
        isExpanded, onToggleExpand, expandedCategories,
        onDragStart, onDragOver, onDragEnd, onDrop, isDragging, isDragOver
    } = props;
    
    const { language, t } = useUI();
    const indentStyle = language === 'ar' ? { paddingRight: `${level * 1.5}rem` } : { paddingLeft: `${level * 1.5}rem` };
    const hasChildren = category.children && category.children.length > 0;
    
    const handleToggle = () => {
        if (hasChildren) {
            onToggleExpand(category.id);
        }
    };

    const handleEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        onEditCategory(category);
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDeleteCategory(category.id);
    };

    return (
        <li 
            className={`group border-b border-slate-100 dark:border-slate-700 last:border-b-0 relative transition-opacity ${isDragging ? 'opacity-50' : 'opacity-100'}`}
            draggable={canEdit}
            onDragStart={(e) => onDragStart(e, category.id)}
            onDragOver={(e) => onDragOver(e, category.id)}
            onDragEnd={onDragEnd}
            onDrop={(e) => {
                e.preventDefault();
                onDrop(category.id);
            }}
        >
            {isDragOver && <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary-500 z-10" />}
            <div 
                className={`flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors`}
            >
                <div className="flex items-center p-3 flex-grow" style={indentStyle}>
                    {canEdit && <div title={t.dragToReorder} className="p-1 cursor-grab touch-none text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"><GripVerticalIcon className="w-5 h-5" /></div>}
                    {hasChildren ? (
                        <button className="p-1 text-slate-500" onClick={handleToggle}>
                            <ChevronRightIcon className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                        </button>
                    ) : (
                        <div className="w-7 h-5 shrink-0"></div> // Placeholder for alignment
                    )}
                    <span className="font-medium text-slate-700 dark:text-slate-200" onClick={handleToggle}>
                        {category.name[language]}
                    </span>
                </div>
                <div className="flex items-center gap-1 p-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                    {canEdit && <button onClick={handleEdit} className="p-2 text-indigo-600 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-full"><PencilIcon className="w-5 h-5" /></button>}
                    {canDelete && <button onClick={handleDelete} className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full"><TrashIcon className="w-5 h-5" /></button>}
                </div>
            </div>
            {hasChildren && (
                <div className={`grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                    <div className="overflow-hidden">
                        <ul className="bg-slate-50/50 dark:bg-slate-800/20">
                            {category.children.map(child => (
                                <CategoryRow 
                                    key={child.id} 
                                    category={child} 
                                    level={level + 1} 
                                    onEditCategory={onEditCategory} 
                                    onDeleteCategory={onDeleteCategory}
                                    canEdit={canEdit}
                                    canDelete={canDelete}
                                    isExpanded={expandedCategories.includes(child.id)}
                                    onToggleExpand={onToggleExpand}
                                    expandedCategories={expandedCategories}
                                    onDragStart={onDragStart}
                                    onDragOver={onDragOver}
                                    onDragEnd={onDragEnd}
                                    onDrop={onDrop}
                                    isDragging={isDragging && category.id === child.id}
                                    isDragOver={isDragOver && category.id === child.id}
                                />
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </li>
    );
};


interface ClassificationsPageProps {
    onAddCategory: () => void;
    onEditCategory: (category: Category) => void;
    onAddTag: () => void;
    onEditTag: (tag: Tag) => void;
}

export const ClassificationsPage: React.FC<ClassificationsPageProps> = (props) => {
    const { onAddCategory, onEditCategory, onAddTag, onEditTag } = props;
    
    const { language, t } = useUI();
    const { categories, tags, deleteCategory, deleteTag, updateCategoryOrder } = useData();
    const { hasPermission } = useAuth();

    const [orderedCategories, setOrderedCategories] = useState<Category[]>([]);
    const [isOrderDirty, setIsOrderDirty] = useState(false);
    const [expandedCategories, setExpandedCategories] = useState<number[]>([]);
    
    const [draggedItemId, setDraggedItemId] = useState<number | null>(null);
    const [dragOverItemId, setDragOverItemId] = useState<number | null>(null);

    useEffect(() => {
        // Deep copy to prevent mutation of context state
        setOrderedCategories(JSON.parse(JSON.stringify(categories)));
        setIsOrderDirty(false);
    }, [categories]);
    
    const canAddCategory = hasPermission('add_category');
    const canEditCategory = hasPermission('edit_category');
    const canDeleteCategory = hasPermission('delete_category');
    const canAddTag = hasPermission('add_tag');
    const canEditTag = hasPermission('edit_tag');
    const canDeleteTag = hasPermission('delete_tag');
    
    const handleToggleExpand = (categoryId: number) => {
        setExpandedCategories(prev =>
            prev.includes(categoryId)
                ? prev.filter(id => id !== categoryId)
                : [...prev, categoryId]
        );
    };

    const handleDeleteCategory = (categoryId: number) => {
        if (window.confirm(t.confirmDeleteCategory)) {
            deleteCategory(categoryId);
        }
    };
    
    const handleDeleteTag = (tagId: string) => {
        if (window.confirm(t.confirmDeleteTag)) {
            deleteTag(tagId);
        }
    };

    const handleSaveOrder = async () => {
        await updateCategoryOrder(orderedCategories);
        setIsOrderDirty(false);
    };

    // --- Drag and Drop Logic ---
    const handleDragStart = (e: React.DragEvent, categoryId: number) => {
        setDraggedItemId(categoryId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent, categoryId: number) => {
        e.preventDefault();
        if (categoryId !== dragOverItemId) {
            setDragOverItemId(categoryId);
        }
    };

    const handleDragEnd = () => {
        setDraggedItemId(null);
        setDragOverItemId(null);
    };

    const handleDrop = (targetCategoryId: number) => {
        if (draggedItemId === null || draggedItemId === targetCategoryId) return;

        let draggedItem: Category | null = null;
        let targetItem: Category | null = null;
        let draggedItemParent: Category | null = null;
        let targetItemParent: Category | null = null;

        const findItemAndParent = (nodes: Category[], id: number, parent: Category | null = null): {item: Category | null, parent: Category | null} => {
            for (const node of nodes) {
                if (node.id === id) return { item: node, parent: parent };
                if (node.children) {
                    const found = findItemAndParent(node.children, id, node);
                    if (found.item) return found;
                }
            }
            return { item: null, parent: null };
        };

        const draggedResult = findItemAndParent(orderedCategories, draggedItemId);
        const targetResult = findItemAndParent(orderedCategories, targetCategoryId);

        draggedItem = draggedResult.item;
        targetItem = targetResult.item;
        draggedItemParent = draggedResult.parent;
        targetItemParent = targetResult.parent;

        if (!draggedItem || !targetItem || (draggedItemParent?.id !== targetItemParent?.id)) {
            // Prevent dropping between different levels for now
            return;
        }

        const siblings = draggedItemParent ? draggedItemParent.children! : orderedCategories;

        const draggedIndex = siblings.findIndex(c => c.id === draggedItemId);
        const targetIndex = siblings.findIndex(c => c.id === targetCategoryId);
        
        if (draggedIndex === -1 || targetIndex === -1) {
            return;
        }
        
        // Remove and re-insert
        const [removed] = siblings.splice(draggedIndex, 1);
        siblings.splice(targetIndex, 0, removed);

        setOrderedCategories([...orderedCategories]);
        setIsOrderDirty(true);
    };
    
    const renderCategoryTree = (categoriesToRender: Category[], level: number) => (
        <ul>
            {categoriesToRender.map(category => (
                <CategoryRow 
                    key={category.id} 
                    category={category} 
                    level={level}
                    onEditCategory={onEditCategory}
                    onDeleteCategory={handleDeleteCategory}
                    canEdit={canEditCategory}
                    canDelete={canDeleteCategory}
                    isExpanded={expandedCategories.includes(category.id)}
                    onToggleExpand={handleToggleExpand}
                    expandedCategories={expandedCategories}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                    onDrop={handleDrop}
                    isDragging={draggedItemId === category.id}
                    isDragOver={dragOverItemId === category.id}
                />
            ))}
        </ul>
    );

    return (
        <div className="animate-fade-in-up">
            <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-slate-100">{t.classifications}</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                {/* Categories Card */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700">
                    <div className="p-4 flex justify-between items-center border-b border-slate-200 dark:border-slate-700">
                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100">{t.manageCategories}</h3>
                        {canAddCategory && (
                            <button onClick={onAddCategory} className="bg-primary-500 text-white font-bold py-2 px-3 rounded-lg hover:bg-primary-600 transition-colors flex items-center gap-2 text-sm shadow-sm hover:shadow-md transform hover:-translate-y-px">
                                <PlusIcon className="w-5 h-5" />
                                {t.addNewCategory}
                            </button>
                        )}
                    </div>
                    <div className="p-2">
                         {renderCategoryTree(orderedCategories, 0)}
                    </div>
                    {isOrderDirty && (
                        <div className="p-4 border-t border-slate-200 dark:border-slate-700 text-right">
                             <button onClick={handleSaveOrder} className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors">
                                {t.saveOrder}
                            </button>
                        </div>
                    )}
                </div>

                {/* Tags Card */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700">
                    <div className="p-4 flex justify-between items-center border-b border-slate-200 dark:border-slate-700">
                        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100">{t.manageTags}</h3>
                        {canAddTag && (
                            <button onClick={onAddTag} className="bg-primary-500 text-white font-bold py-2 px-3 rounded-lg hover:bg-primary-600 transition-colors flex items-center gap-2 text-sm shadow-sm hover:shadow-md transform hover:-translate-y-px">
                                <PlusIcon className="w-5 h-5" />
                                {t.addNewTag}
                            </button>
                        )}
                    </div>
                    <div className="p-4">
                         <div className="flex flex-wrap gap-3">
                            {tags.map(tag => (
                                <div key={tag.id} className="group relative">
                                    <span className="inline-block px-4 py-2 rounded-full text-sm font-semibold border-2 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 transition-colors group-hover:border-primary-400 dark:group-hover:border-primary-500">
                                        {tag.name[language]}
                                    </span>
                                    <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {canEditTag && <button onClick={() => onEditTag(tag)} className="p-2 text-white hover:bg-white/20 rounded-full"><PencilIcon className="w-5 h-5" /></button>}
                                        {canDeleteTag && <button onClick={() => handleDeleteTag(tag.id)} className="p-2 text-white hover:bg-white/20 rounded-full"><TrashIcon className="w-5 h-5" /></button>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};