'use client';

type ToggleSwitchProps = {
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
    size?: 'sm' | 'md' | 'lg';
    label?: string;
    description?: string;
};

export default function ToggleSwitch({
    checked,
    onChange,
    disabled = false,
    size = 'md',
    label,
    description,
}: ToggleSwitchProps) {
    const sizeClasses = {
        sm: 'toggle-switch--sm',
        md: 'toggle-switch--md',
        lg: 'toggle-switch--lg',
    };

    return (
        <div className={`toggle-switch-wrapper ${label ? 'toggle-switch-wrapper--with-label' : ''}`}>
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                disabled={disabled}
                onClick={() => !disabled && onChange(!checked)}
                className={`toggle-switch ${sizeClasses[size]} ${checked ? 'toggle-switch--checked' : ''} ${disabled ? 'toggle-switch--disabled' : ''}`}
            >
                <span className="toggle-switch-thumb" />
            </button>
            {(label || description) && (
                <div className="toggle-switch-text">
                    {label && <span className="toggle-switch-label">{label}</span>}
                    {description && <span className="toggle-switch-description">{description}</span>}
                </div>
            )}
        </div>
    );
}
