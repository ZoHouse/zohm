'use client';

/**
 * EditEventModal Component
 * 
 * Modal for editing existing community events.
 * Uses the PUT /api/events/[id] endpoint.
 * Renders via Portal to escape parent container constraints.
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, MapPin, Users, Save, Trash2 } from 'lucide-react';
import { GlowButton, GlowCard } from '@/components/ui';
import { CultureSelector } from './CultureSelector';
import { ImageUpload } from './ImageUpload';
import type { EventCulture } from '@/types/events';

interface EventData {
  id: string;
  title: string;
  description?: string;
  culture: string;
  starts_at: string;
  ends_at: string;
  location_name: string;
  location_raw?: string;
  lat?: number;
  lng?: number;
  max_capacity?: number;
  submission_status: string;
  cover_image_url?: string;
}

interface EditEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventData | null;
  userId?: string;
  onSuccess?: () => void;
}

export function EditEventModal({ isOpen, onClose, event, userId, onSuccess }: EditEventModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    culture: '' as EventCulture | '',
    starts_at: '',
    ends_at: '',
    location_name: '',
    max_capacity: undefined as number | undefined,
    cover_image_url: undefined as string | undefined,
  });

  // Load event data when modal opens
  useEffect(() => {
    if (isOpen && event) {
      setFormData({
        title: event.title || '',
        description: event.description || '',
        culture: (event.culture as EventCulture) || '',
        starts_at: event.starts_at ? formatDateTimeLocal(event.starts_at) : '',
        ends_at: event.ends_at ? formatDateTimeLocal(event.ends_at) : '',
        location_name: event.location_name || '',
        max_capacity: event.max_capacity,
        cover_image_url: event.cover_image_url,
      });
      setError(null);
      setShowDeleteConfirm(false);
    }
  }, [isOpen, event]);

  // Format ISO date to datetime-local input format
  function formatDateTimeLocal(isoString: string): string {
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  const handleSubmit = async () => {
    if (!event || !userId) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/events/${event.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || null,
          culture: formData.culture || null,
          starts_at: formData.starts_at ? new Date(formData.starts_at).toISOString() : null,
          ends_at: formData.ends_at ? new Date(formData.ends_at).toISOString() : null,
          location_name: formData.location_name || null,
          max_capacity: formData.max_capacity || null,
          cover_image_url: formData.cover_image_url || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update event');
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update event');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!event || !userId) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/events/${event.id}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': userId,
        },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to cancel event');
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel event');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !event) return null;

  const inputClass = "w-full px-4 py-3 rounded-xl bg-white/20 border border-white/40 text-black font-medium placeholder-black/40 focus:outline-none focus:border-[#ff4d6d] focus:ring-2 focus:ring-[#ff4d6d]/50 transition-all";
  const textareaClass = "w-full px-4 py-3 rounded-xl bg-white/20 border border-white/40 text-black font-medium placeholder-black/40 focus:outline-none focus:border-[#ff4d6d] focus:ring-2 focus:ring-[#ff4d6d]/50 transition-all resize-none";
  const labelClass = "block text-sm font-bold text-black mb-2";

  // Use portal to render modal at document body level
  const modalContent = (
    <div className="fixed inset-0 z-[10002] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <GlowCard className="relative w-full max-w-lg max-h-[85vh] flex flex-col !p-0 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-white/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✏️</span>
            <div>
              <h2 className="text-lg font-bold text-black">Edit Event</h2>
              <p className="text-xs text-gray-600">
                Update your event details
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/40 border border-white/40 transition-colors"
          >
            <X size={16} className="text-black" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Error */}
          {error && (
            <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/50">
              <p className="text-sm text-red-600 font-medium">{error}</p>
            </div>
          )}

          {/* Title */}
          <div>
            <label className={labelClass}>Event Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Event title"
              maxLength={100}
              className={inputClass}
            />
          </div>

          {/* Description */}
          <div>
            <label className={labelClass}>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="What's this event about?"
              rows={3}
              maxLength={500}
              className={textareaClass}
            />
          </div>

          {/* Culture */}
          <div>
            <label className={labelClass}>Culture/Vibe</label>
            <CultureSelector
              value={formData.culture as EventCulture}
              onChange={(culture) => setFormData(prev => ({ ...prev, culture }))}
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>
                <Calendar size={14} className="inline mr-1" />
                Start *
              </label>
              <input
                type="datetime-local"
                value={formData.starts_at}
                onChange={(e) => setFormData(prev => ({ ...prev, starts_at: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>
                <Calendar size={14} className="inline mr-1" />
                End *
              </label>
              <input
                type="datetime-local"
                value={formData.ends_at}
                onChange={(e) => setFormData(prev => ({ ...prev, ends_at: e.target.value }))}
                className={inputClass}
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className={labelClass}>
              <MapPin size={14} className="inline mr-1" />
              Location
            </label>
            <input
              type="text"
              value={formData.location_name}
              onChange={(e) => setFormData(prev => ({ ...prev, location_name: e.target.value }))}
              placeholder="Event location"
              className={inputClass}
            />
          </div>

          {/* Capacity */}
          <div>
            <label className={labelClass}>
              <Users size={14} className="inline mr-1" />
              Max Capacity
            </label>
            <input
              type="number"
              value={formData.max_capacity || ''}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                max_capacity: e.target.value ? parseInt(e.target.value) : undefined 
              }))}
              placeholder="Leave empty for unlimited"
              min={1}
              className={inputClass}
            />
          </div>

          {/* Cover Image */}
          <div>
            <label className={labelClass}>Cover Image</label>
            <ImageUpload
              value={formData.cover_image_url}
              onChange={(url) => setFormData(prev => ({ ...prev, cover_image_url: url }))}
              userId={userId}
              eventId={event.id}
            />
          </div>

          {/* Delete Section */}
          <div className="pt-4 border-t border-white/20">
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2 text-red-500 hover:text-red-400 transition-colors"
              >
                <Trash2 size={16} />
                <span className="text-sm font-medium">Cancel this event</span>
              </button>
            ) : (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 space-y-3">
                <p className="text-sm text-red-600 font-medium">
                  Are you sure you want to cancel this event? This action cannot be undone.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleDelete}
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-red-500 text-white rounded-full text-sm font-bold hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? 'Cancelling...' : 'Yes, Cancel Event'}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-2 bg-white/20 text-black rounded-full text-sm font-bold hover:bg-white/30 transition-colors"
                  >
                    No, Keep It
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/20 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-white/20 text-black rounded-full font-bold hover:bg-white/30 transition-colors"
          >
            Cancel
          </button>
          <GlowButton
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.title || !formData.starts_at || !formData.ends_at}
            className="flex-1"
          >
            <Save size={16} className="mr-2" />
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </GlowButton>
        </div>
      </GlowCard>
    </div>
  );

  // Render via portal to document body to escape parent container constraints
  if (typeof window !== 'undefined') {
    return createPortal(modalContent, document.body);
  }
  
  return modalContent;
}

export default EditEventModal;
