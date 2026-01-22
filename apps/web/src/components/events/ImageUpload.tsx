'use client';

/**
 * ImageUpload Component
 * 
 * A reusable image upload component for event cover images.
 * Supports drag-and-drop and click-to-upload.
 */

import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string | undefined) => void;
  userId?: string;
  eventId?: string;
  className?: string;
  disabled?: boolean;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export function ImageUpload({ 
  value, 
  onChange, 
  userId, 
  eventId,
  className = '',
  disabled = false 
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return 'Please upload a JPEG, PNG, GIF, or WebP image';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'Image must be smaller than 5MB';
    }
    return null;
  };

  const uploadFile = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (eventId) {
        formData.append('eventId', eventId);
      }

      const res = await fetch('/api/events/upload-cover', {
        method: 'POST',
        headers: {
          'x-user-id': userId || '',
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload image');
      }

      onChange(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isUploading) {
      setIsDragging(true);
    }
  }, [disabled, isUploading]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled || isUploading) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      uploadFile(file);
    }
  }, [disabled, isUploading, uploadFile]);

  const handleRemove = () => {
    onChange(undefined);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {value ? (
        // Preview Mode
        <div className="relative rounded-2xl overflow-hidden border border-white/40 bg-white/10">
          <img
            src={value}
            alt="Event cover"
            className="w-full h-40 object-cover"
          />
          {!disabled && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center transition-colors"
            >
              <X size={16} className="text-white" />
            </button>
          )}
        </div>
      ) : (
        // Upload Mode
        <div
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative flex flex-col items-center justify-center gap-3 p-6 
            rounded-2xl border-2 border-dashed transition-all cursor-pointer
            ${isDragging 
              ? 'border-[#ff4d6d] bg-[#ff4d6d]/10' 
              : 'border-white/40 bg-white/10 hover:border-white/60 hover:bg-white/20'
            }
            ${disabled || isUploading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {isUploading ? (
            <>
              <Loader2 size={32} className="text-[#ff4d6d] animate-spin" />
              <p className="text-sm text-black/60 font-medium">Uploading...</p>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-white/30 flex items-center justify-center">
                {isDragging ? (
                  <Upload size={24} className="text-[#ff4d6d]" />
                ) : (
                  <ImageIcon size={24} className="text-black/60" />
                )}
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-black">
                  {isDragging ? 'Drop image here' : 'Add cover image'}
                </p>
                <p className="text-xs text-black/50 mt-1">
                  Drag & drop or click to upload
                </p>
                <p className="text-xs text-black/40 mt-1">
                  JPEG, PNG, GIF, WebP • Max 5MB
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {error && (
        <p className="mt-2 text-xs text-red-600 font-medium">{error}</p>
      )}
    </div>
  );
}

export default ImageUpload;
