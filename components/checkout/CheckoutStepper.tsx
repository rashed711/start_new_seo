import React from 'react';
import type { Language } from '../../types';
// @FIX: Replaced non-existent `useTranslations` hook with direct access to the `translations` object.
import { translations } from '../../i18n/translations';
import { CheckCircleIcon } from '../icons/Icons';

type CheckoutStep = 'delivery' | 'payment' | 'confirm';

interface CheckoutStepperProps {
  currentStep: CheckoutStep;
  language: Language;
}

export const CheckoutStepper: React.FC<CheckoutStepperProps> = ({ currentStep, language }) => {
    // @FIX: Replaced non-existent `useTranslations` hook with direct access to the `translations` object.
    const t = translations[language];
    const steps: { id: CheckoutStep; label: string }[] = [
        { id: 'delivery', label: t.stepDelivery },
        { id: 'payment', label: t.stepPayment },
        { id: 'confirm', label: t.stepConfirm },
    ];
    const currentStepIndex = steps.findIndex(s => s.id === currentStep);

    return (
        <nav aria-label="Progress">
            <ol role="list" className="flex items-center">
                {steps.map((step, stepIdx) => (
                <li key={step.label} className={`relative ${stepIdx !== steps.length - 1 ? 'flex-1' : ''}`}>
                    {stepIdx < currentStepIndex ? (
                        // Completed Step
                        <>
                            <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                <div className="h-0.5 w-full bg-primary-600" />
                            </div>
                            <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-primary-600">
                                <CheckCircleIcon className="h-5 w-5 text-white" aria-hidden="true" />
                                <span className="absolute top-10 w-max text-xs font-semibold text-primary-600">{step.label}</span>
                            </span>
                        </>
                    ) : stepIdx === currentStepIndex ? (
                        // Current Step
                         <>
                            <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                <div className="h-0.5 w-full bg-slate-200 dark:bg-slate-700" />
                            </div>
                             <span className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary-600 bg-white dark:bg-slate-800" aria-current="step">
                                <span className="h-2.5 w-2.5 rounded-full bg-primary-600" />
                                <span className="absolute top-10 w-max text-xs font-semibold text-primary-600">{step.label}</span>
                            </span>
                        </>
                    ) : (
                        // Upcoming Step
                        <>
                            <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                <div className="h-0.5 w-full bg-slate-200 dark:bg-slate-700" />
                            </div>
                            <span className="group relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800">
                                <span className="h-2.5 w-2.5 rounded-full bg-transparent" />
                                <span className="absolute top-10 w-max text-xs font-medium text-slate-500">{step.label}</span>
                            </span>
                        </>
                    )}
                </li>
                ))}
            </ol>
        </nav>
    );
};