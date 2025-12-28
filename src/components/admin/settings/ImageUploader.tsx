'use client';

import { useRef, useState, useCallback } from 'react';
import Image from 'next/image';

type ImageUploaderProps = {
    value: string;
    onChange: (url: string) => void;
    accept?: string;
    maxSize?: number; // MB
    aspectRatio?: string;
    placeholder?: string;
    disabled?: boolean;
};

export default function ImageUploader({
    value,
    onChange,
    accept = 'image/*',
    maxSize = 5,
    aspectRatio,
    placeholder = 'Click or drag to upload',
    disabled = false,
}: ImageUploaderProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) setIsDragging(true);
    }, [disabled]);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const processFile = async (file: File) => {
        setError(null);
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Please upload an image file');
            return;
        }

        // Validate file size
        if (file.size > maxSize * 1024 * 1024) {
            setError(`File size must be less than ${maxSize}MB`);
            return;
        }

        setIsUploading(true);

        try {
            // Create FormData
            const formData = new FormData();
            formData.append('file', file);

            // Upload to API
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const data = await response.json();
            onChange(data.url);
        } catch {
            // Fallback: Convert to base64 (for demo/development)
            const reader = new FileReader();
            reader.onload = () => {
                onChange(reader.result as string);
            };
            reader.readAsDataURL(file);
        } finally {
            setIsUploading(false);
        }
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (disabled) return;

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            processFile(files[0]);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [disabled, maxSize, onChange]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            processFile(files[0]);
        }
    };

    const handleRemove = () => {
        onChange('');
        if (inputRef.current) {
            inputRef.current.value = '';
        }
    };

    return (
        <div className={`image-uploader ${disabled ? 'image-uploader--disabled' : ''}`}>
            {value ? (
                <div className="image-uploader-preview" style={aspectRatio ? { aspectRatio } : undefined}>
                    <Image
                        src={value}
                        alt="Uploaded preview"
                        fill
                        style={{ objectFit: 'cover' }}
                    />
                    {!disabled && (
                        <div className="image-uploader-overlay">
                            <button
                                type="button"
                                onClick={() => inputRef.current?.click()}
                                className="image-uploader-btn"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="17 8 12 3 7 8" />
                                    <line x1="12" y1="3" x2="12" y2="15" />
                                </svg>
                                Replace
                            </button>
                            <button
                                type="button"
                                onClick={handleRemove}
                                className="image-uploader-btn image-uploader-btn--danger"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="3 6 5 6 21 6" />
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                </svg>
                                Remove
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <div
                    className={`image-uploader-dropzone ${isDragging ? 'image-uploader-dropzone--active' : ''} ${isUploading ? 'image-uploader-dropzone--uploading' : ''}`}
                    style={aspectRatio ? { aspectRatio } : undefined}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => !disabled && !isUploading && inputRef.current?.click()}
                >
                    {isUploading ? (
                        <div className="image-uploader-loading">
                            <div className="image-uploader-spinner" />
                            <span>Uploading...</span>
                        </div>
                    ) : (
                        <>
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="image-uploader-icon">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                                <polyline points="21 15 16 10 5 21" />
                            </svg>
                            <span className="image-uploader-text">{placeholder}</span>
                            <span className="image-uploader-hint">
                                PNG, JPG, GIF up to {maxSize}MB
                            </span>
                        </>
                    )}
                </div>
            )}

            <input
                ref={inputRef}
                type="file"
                accept={accept}
                onChange={handleFileChange}
                disabled={disabled || isUploading}
                className="image-uploader-input"
            />

            {error && <p className="image-uploader-error">{error}</p>}
        </div>
    );
}
