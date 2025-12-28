'use client';

import { ReactNode } from 'react';

type SettingsFieldProps = {
    label: string;
    description?: string;
    htmlFor?: string;
    error?: string;
    required?: boolean;
    children: ReactNode;
};

export default function SettingsField({
    label,
    description,
    htmlFor,
    error,
    required,
    children,
}: SettingsFieldProps) {
    return (
        <div className={`settings-field ${error ? 'settings-field--error' : ''}`}>
            <div className="settings-field-label-row">
                <label className="settings-field-label" htmlFor={htmlFor}>
                    {label}
                    {required && <span className="settings-field-required">*</span>}
                </label>
            </div>
            {description && (
                <p className="settings-field-description">{description}</p>
            )}
            <div className="settings-field-input">
                {children}
            </div>
            {error && <p className="settings-field-error">{error}</p>}
        </div>
    );
}
