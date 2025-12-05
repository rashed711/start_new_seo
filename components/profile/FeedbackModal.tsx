import React, { useState } from 'react';
import type { Order } from '../../types';
import { StarRating } from '../StarRating';
import { useUI } from '../../contexts/UIContext';
import { Modal } from '../Modal';

interface FeedbackModalProps {
    order: Order;
    onClose: () => void;
    onSave: (feedback: { rating: number; comment: string }) => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ order, onClose, onSave }) => {
    // @FIX: Refactored to get translations `t` directly from the `useUI` hook.
    const { language, t } = useUI();
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ rating, comment });
    };

    return (
        <Modal title={t.leaveFeedback} onClose={onClose} size="sm">
            <form onSubmit={handleSubmit} className="p-5 space-y-5">
                <div>
                    <p className="text-sm font-medium mb-2">{t.yourRating}</p>
                    <div className="flex justify-center">
                        <StarRating rating={rating} onRatingChange={setRating} size="lg" />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-2">{t.yourComment}</label>
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        rows={4}
                        className="w-full p-2 border rounded-md dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 focus:ring-primary-500 focus:border-primary-500"
                    />
                </div>
                <div className="flex justify-end gap-4 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 font-semibold text-slate-800 dark:text-slate-300">{t.cancel}</button>
                    <button type="submit" className="px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600">{t.submit}</button>
                </div>
            </form>
        </Modal>
    );
};