import React, { useState, useEffect } from 'react';
import type { SocialLink } from '../../types';
import { useUI } from '../../contexts/UIContext';
import { Modal } from '../Modal';
import { optimizeImage } from '../../utils/imageOptimizer';

interface SocialLinkEditModalProps {
    link: SocialLink | null;
    onClose: () => void;
    onSave: (linkData: SocialLink | Omit<SocialLink, 'id'>) => void;
}

const emptyLink: Omit<SocialLink, 'id'> = {
    name: '',
    url: '',
    icon: '',
    isVisible: true,
};

export const SocialLinkEditModal: React.FC<SocialLinkEditModalProps> = ({ link, onClose, onSave }) => {
    const { t, setIsProcessing, showToast } = useUI();
    const [formData, setFormData] = useState<Omit<SocialLink, 'id'>>(emptyLink);

    useEffect(() => {
        if (link) {
            const { id, ...editableData } = link;
            setFormData(editableData);
        } else {
            setFormData(emptyLink);
        }
    }, [link]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };
    
    const handleIconChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsProcessing(true);
            try {
                const optimizedFile = await optimizeImage(file, 64, 64, 0.9);
                const reader = new FileReader();
                reader.onloadend = () => {
                    setFormData(prev => ({ ...prev, icon: reader.result as string }));
                };
                reader.readAsDataURL(optimizedFile);
            } catch (error) {
                 console.error("Icon optimization failed:", error);
                showToast("Failed to process icon. Please try another file.");
            } finally {
                setIsProcessing(false);
            }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!link && !formData.icon) {
            alert(t.uploadIconPrompt);
            return;
        }
        if (link) {
            onSave({ ...link, ...formData });
        } else {
            onSave(formData);
        }
    };

    return (
        <Modal title={link ? t.editLink : t.addNewLink} onClose={onClose} size="md">
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.name}</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100" placeholder={t.linkNamePlaceholder} required />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.url}</label>
                    <input type="text" name="url" value={formData.url} onChange={handleChange} className="w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100" placeholder={t.linkUrlPlaceholder} required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.icon}</label>
                    <div className="mt-2 flex items-center gap-4">
                        {formData.icon && <img src={formData.icon} alt={t.iconPreview} className="w-12 h-12 object-contain rounded-md bg-slate-100 dark:bg-slate-700 p-1 border dark:border-slate-600" />}
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleIconChange}
                            className="block w-full text-sm text-slate-500 dark:text-slate-400
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-full file:border-0
                            file:text-sm file:font-semibold
                            file:bg-primary-50 file:text-primary-700
                            hover:file:bg-primary-100 dark:file:bg-primary-900/50 dark:file:text-primary-200 dark:hover:file:bg-primary-900"
                        />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">{t.uploadImageHelpText}</p>
                </div>
                <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" name="isVisible" checked={formData.isVisible} onChange={handleChange} className="w-5 h-5 rounded text-primary-600 focus:ring-primary-500" />
                        <span className="text-sm font-medium">{t.visibleOnPage}</span>
                    </label>
                </div>
                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 font-semibold text-slate-800 dark:text-slate-300">{t.cancel}</button>
                    <button type="submit" className="px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600">{t.save}</button>
                </div>
            </form>
        </Modal>
    );
};