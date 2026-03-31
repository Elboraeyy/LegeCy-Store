"use client";

import { CldUploadWidget, CloudinaryUploadWidgetResults } from 'next-cloudinary';
import Image from 'next/image';

interface ImageUploadProps {
    value: string[];
    onChange: (value: string) => void;
    onRemove: (value: string) => void;
    onReorder?: (newOrder: string[]) => void;
    disabled?: boolean;
}

export default function ImageUpload({
    value,
    onChange,
    onRemove,
    onReorder,
    disabled
}: ImageUploadProps) {
    const onUpload = (result: CloudinaryUploadWidgetResults) => {
        // Safe check for the result info object and secure_url
        if (result.info && typeof result.info === 'object' && 'secure_url' in result.info) {
             onChange((result.info as { secure_url: string }).secure_url);
        }
    };

    const handleMove = (index: number, direction: 'left' | 'right') => {
        if (!onReorder) return;
        const newIndex = direction === 'left' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= value.length) return;
        
        const newValue = [...value];
        const temp = newValue[index];
        newValue[index] = newValue[newIndex];
        newValue[newIndex] = temp;
        
        onReorder(newValue);
    };

    return (
        <div>
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', 
                gap: '16px', 
                marginBottom: '16px' 
            }}>
                {value.map((url) => (
                    <div key={url} style={{ 
                        position: 'relative', 
                        aspectRatio: '1/1', 
                        borderRadius: '8px', 
                        overflow: 'hidden', 
                        border: '1px solid var(--border)', 
                        backgroundColor: 'var(--surface)',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }} className="image-preview-item">
                        
                        <div style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            zIndex: 10,
                            display: 'flex',
                            gap: '4px'
                        }}>
                             {onReorder && (
                                <>
                                    <button
                                        type="button" 
                                        onClick={() => handleMove(value.indexOf(url), 'left')}
                                        disabled={value.indexOf(url) === 0}
                                        style={{
                                            border: 'none',
                                            borderRadius: '50%',
                                            width: '24px',
                                            height: '24px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            background: 'rgba(18, 64, 60, 0.8)',
                                            color: '#fff',
                                            cursor: value.indexOf(url) === 0 ? 'not-allowed' : 'pointer',
                                            opacity: value.indexOf(url) === 0 ? 0.5 : 1,
                                            backdropFilter: 'blur(4px)'
                                        }}
                                        title="Move Left"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="m15 18-6-6 6-6"/>
                                        </svg>
                                    </button>
                                    <button
                                        type="button" 
                                        onClick={() => handleMove(value.indexOf(url), 'right')}
                                        disabled={value.indexOf(url) === value.length - 1}
                                        style={{
                                            border: 'none',
                                            borderRadius: '50%',
                                            width: '24px',
                                            height: '24px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            background: 'rgba(18, 64, 60, 0.8)',
                                            color: '#fff',
                                            cursor: value.indexOf(url) === value.length - 1 ? 'not-allowed' : 'pointer',
                                            opacity: value.indexOf(url) === value.length - 1 ? 0.5 : 1,
                                            backdropFilter: 'blur(4px)'
                                        }}
                                        title="Move Right"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="m9 18 6-6-6-6"/>
                                        </svg>
                                    </button>
                                </>
                             )}
                             <button
                                type="button" 
                                onClick={() => onRemove(url)}
                                style={{
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '24px',
                                    height: '24px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: 'rgba(239, 68, 68, 0.8)', // red-500
                                    color: '#fff',
                                    cursor: 'pointer',
                                    backdropFilter: 'blur(4px)'
                                }}
                                title="Remove Image"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                                </svg>
                            </button>
                        </div>
                        {url.match(/\.(mp4|webm|mov)$/i) || url.includes('/video/') ? (
                            <video
                                src={url}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                muted
                                autoPlay
                                loop
                                playsInline
                            />
                        ) : (
                            <Image
                                fill
                                style={{ objectFit: 'cover' }}
                                alt="Uploaded Media"
                                src={url}
                            />
                        )}
                    </div>
                ))}
            </div>
            <CldUploadWidget 
                onSuccess={onUpload} 
                uploadPreset="nsigned_preset" 
                options={{
                    maxFiles: 99,
                    sources: ['local', 'url'], 
                    resourceType: 'auto',
                    clientAllowedFormats: ['png', 'jpeg', 'jpg', 'webp', 'mp4', 'mov', 'webm'],
                    multiple: true,
                    styles: {
                        palette: {
                            window: "#12403C", // var(--bg-dark)
                            sourceBg: "#142f29", // var(--surface-dark)
                            windowBorder: "#2a4f45", // var(--border-dark)
                            tabIcon: "#FCF8F3", // var(--text-on-dark)
                            inactiveTabIcon: "#a3b8b0", // var(--text-muted-dark)
                            menuIcons: "#d4af37", // var(--accent)
                            link: "#d4af37", // var(--accent)
                            action: "#d4af37", // var(--accent)
                            inProgress: "#d4af37", // var(--accent)
                            complete: "#d4af37", // var(--accent)
                            error: "#ef4444", 
                            textDark: "#12403C", // var(--text-on-light)
                            textLight: "#FCF8F3" // var(--text-on-dark)
                        }
                    }
                }}
            >
                {({ open }) => {
                    const isWidgetReady = typeof open === 'function';
                    return (
                        <button
                            type="button"
                            disabled={disabled || !isWidgetReady}
                            onClick={() => isWidgetReady && open()}
                            className="admin-btn admin-btn-outline"
                            style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '8px', 
                                padding: '10px 16px' 
                            }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                                <circle cx="9" cy="9" r="2"/>
                                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                            </svg>
                            <span>Upload Media</span>
                        </button>
                    );
                }}
            </CldUploadWidget>
        </div>
    );
}
