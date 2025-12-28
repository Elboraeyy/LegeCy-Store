'use client';

import { ReactNode } from 'react';

type SettingsSectionProps = {
    title: string;
    description?: string;
    icon?: ReactNode;
    children: ReactNode;
    collapsible?: boolean;
    defaultCollapsed?: boolean;
    action?: ReactNode;
};

export default function SettingsSection({
    title,
    description,
    icon,
    children,
    action,
}: SettingsSectionProps) {
    return (
        <div className="settings-section">
            <div className="settings-section-header">
                <div className="settings-section-title-row">
                    {icon && <span className="settings-section-icon">{icon}</span>}
                    <div>
                        <h3 className="settings-section-title">{title}</h3>
                        {description && (
                            <p className="settings-section-description">{description}</p>
                        )}
                    </div>
                </div>
                {action && <div className="settings-section-action">{action}</div>}
            </div>
            <div className="settings-section-content">
                {children}
            </div>
        </div>
    );
}
