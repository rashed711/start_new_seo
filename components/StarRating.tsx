import React, { useState } from 'react';
import { StarIcon } from './icons/Icons';

interface StarRatingProps {
    rating: number;
    onRatingChange?: (rating: number) => void;
    size?: 'sm' | 'md' | 'lg';
}

export const StarRating: React.FC<StarRatingProps> = ({ rating, onRatingChange, size = 'md' }) => {
    const [hoverRating, setHoverRating] = useState(0);

    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-6 h-6',
        lg: 'w-8 h-8',
    };

    return (
        <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    className={`text-gray-300 dark:text-gray-600 transition-colors ${onRatingChange ? 'cursor-pointer' : ''} ${(hoverRating >= star || rating >= star) ? 'text-yellow-400' : ''}`}
                    onClick={() => onRatingChange?.(star)}
                    onMouseEnter={() => onRatingChange && setHoverRating(star)}
                    onMouseLeave={() => onRatingChange && setHoverRating(0)}
                    disabled={!onRatingChange}
                    aria-label={`Rate ${star} stars`}
                >
                    <StarIcon className={sizeClasses[size]} />
                </button>
            ))}
        </div>
    );
};
