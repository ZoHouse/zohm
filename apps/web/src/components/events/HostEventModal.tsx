'use client';

/**
 * HostEventModal Component
 * 
 * Multi-step modal for creating community events.
 * Uses the same glassmorphic design as the rest of the app.
 */

import { useState, useEffect } from 'react';
import { GlowButton, GlowCard } from '@/components/ui';
import { CultureSelector } from './CultureSelector';
import { EventTypeSelector } from './EventTypeSelector';
import { LocationSelector } from './LocationSelector';
import { ImageUpload } from './ImageUpload';
import type { 
  CreateEventInput, 
  CreateEventResponse 
} from '@/types/events';

interface HostEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (event: CreateEventResponse) => void;
  userId?: string;
  sponsoredFormUrl?: string;
}

const DEFAULT_SPONSORED_FORM_URL = 'https://zostel.typeform.com/to/LgcBfa0M';

const STEPS = [
  { id: 1, title: 'Type', subtitle: 'What kind of event?' },
  { id: 2, title: 'Vibe', subtitle: 'What\'s the theme?' },
  { id: 3, title: 'Details', subtitle: 'Tell us more' },
  { id: 4, title: 'Location', subtitle: 'Where is it?' },
  { id: 5, title: 'Review', subtitle: 'Confirm & create' },
];

export function HostEventModal({ isOpen, onClose, onSuccess, userId, sponsoredFormUrl }: HostEventModalProps) {
  const typeformUrl = sponsoredFormUrl || DEFAULT_SPONSORED_FORM_URL;
  
  const handleSponsoredClick = () => {
    window.open(typeformUrl, '_blank');
    onClose();
  };

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Partial<CreateEventInput>>({
    category: 'community',
    culture: undefined,
    title: '',
    description: '',
    starts_at: '',
    ends_at: '',
    location_type: 'custom',
    location_name: '',
    location_address: '',
    max_capacity: undefined,
    cover_image_url: undefined,
  });

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setError(null);
      setFormData({
        category: 'community',
        culture: undefined,
        title: '',
        description: '',
        starts_at: '',
        ends_at: '',
        location_type: 'custom',
        location_name: '',
        location_address: '',
        max_capacity: undefined,
        cover_image_url: undefined,
      });
    }
  }, [isOpen]);

  const updateField = <K extends keyof CreateEventInput>(
    field: K,
    value: CreateEventInput[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const canProceed = (): boolean => {
    switch (step) {
      case 1: return !!formData.category;
      case 2: return !!formData.culture;
      case 3: return !!(formData.title && formData.title.length >= 5 && formData.starts_at && formData.ends_at);
      case 4: return !!(formData.location_type && (formData.location_type === 'online' || formData.location_name));
      case 5: return true;
      default: return false;
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    // Get user ID from props or localStorage
    const effectiveUserId = userId || 
      (typeof window !== 'undefined' ? localStorage.getItem('zo_user_id') : null);

    if (!effectiveUserId) {
      setError('Please login to create events');
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': effectiveUserId,
        },
        body: JSON.stringify(formData),
      });

      const data: CreateEventResponse = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create event');
      }

      onSuccess?.(data);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Shared input styles matching the app - darker text for visibility
  const inputClass = "w-full px-4 py-3 rounded-full bg-white/20 border border-white/40 text-black font-medium placeholder-black/40 focus:outline-none focus:border-[#ff4d6d] focus:ring-2 focus:ring-[#ff4d6d]/50 transition-all";
  const textareaClass = "w-full px-4 py-3 rounded-2xl bg-white/20 border border-white/40 text-black font-medium placeholder-black/40 focus:outline-none focus:border-[#ff4d6d] focus:ring-2 focus:ring-[#ff4d6d]/50 transition-all resize-none";
  const labelClass = "block text-sm font-bold text-black mb-2";

  return (
    <div className="fixed inset-0 z-[10002] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal - Using GlowCard style */}
      <GlowCard className="relative w-full max-w-lg max-h-[85vh] flex flex-col !p-0 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-white/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/events.png" alt="Events" className="w-8 h-8 object-contain" />
            <div>
              <h2 className="text-lg font-bold text-black">Host an Event</h2>
              <p className="text-xs text-gray-600">
                Step {step} of {STEPS.length}: {STEPS[step - 1].subtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/40 border border-white/40 transition-colors"
          >
            <span className="text-black font-bold text-sm">✕</span>
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-4 py-3 bg-white/10 border-b border-white/20">
          <div className="flex justify-between items-center">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center">
                <div
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all
                    ${step > s.id 
                      ? 'bg-green-500 text-white' 
                      : step === s.id 
                        ? 'bg-[#ff4d6d] text-white shadow-lg shadow-[#ff4d6d]/50' 
                        : 'bg-white/30 text-gray-500 border border-white/40'
                    }
                  `}
                >
                  {step > s.id ? '✓' : s.id}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-6 h-0.5 mx-1 ${step > s.id ? 'bg-green-500' : 'bg-white/30'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Step 1: Event Type */}
          {step === 1 && (
            <EventTypeSelector
              value={formData.category || 'community'}
              onChange={(type) => updateField('category', type)}
              onSponsoredClick={handleSponsoredClick}
            />
          )}

          {/* Step 2: Culture Selection */}
          {step === 2 && (
            <CultureSelector
              value={formData.culture}
              onChange={(culture) => updateField('culture', culture)}
            />
          )}

          {/* Step 3: Event Details */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Event Title *</label>
                <input
                  type="text"
                  value={formData.title || ''}
                  onChange={(e) => updateField('title', e.target.value)}
                  placeholder="e.g., Sunday Morning Yoga at Zo House"
                  maxLength={100}
                  className={inputClass}
                />
                <p className="text-xs text-black/50 mt-1 text-right font-medium">
                  {(formData.title?.length || 0)}/100
                </p>
              </div>

              <div>
                <label className={labelClass}>Description</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="Tell people what to expect..."
                  rows={3}
                  maxLength={2000}
                  className={textareaClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Start *</label>
                  <input
                    type="datetime-local"
                    value={formData.starts_at?.slice(0, 16) || ''}
                    onChange={(e) => updateField('starts_at', new Date(e.target.value).toISOString())}
                    min={new Date().toISOString().slice(0, 16)}
                    className={inputClass + " text-sm"}
                  />
                </div>
                <div>
                  <label className={labelClass}>End *</label>
                  <input
                    type="datetime-local"
                    value={formData.ends_at?.slice(0, 16) || ''}
                    onChange={(e) => updateField('ends_at', new Date(e.target.value).toISOString())}
                    min={formData.starts_at?.slice(0, 16) || new Date().toISOString().slice(0, 16)}
                    className={inputClass + " text-sm"}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Cover Image (optional)</label>
                <ImageUpload
                  value={formData.cover_image_url}
                  onChange={(url) => updateField('cover_image_url', url)}
                  userId={userId || (typeof window !== 'undefined' ? localStorage.getItem('zo_user_id') || undefined : undefined)}
                />
              </div>
            </div>
          )}

          {/* Step 4: Location */}
          {step === 4 && (
            <LocationSelector
              value={{
                location_type: formData.location_type || 'custom',
                location_name: formData.location_name || '',
                location_address: formData.location_address,
                lat: formData.lat,
                lng: formData.lng,
                zo_property_id: formData.zo_property_id,
                meeting_point: formData.meeting_point,
                max_capacity: formData.max_capacity,
              }}
              onChange={(locationData) => {
                setFormData(prev => ({
                  ...prev,
                  ...locationData,
                }));
              }}
            />
          )}

          {/* Step 5: Review */}
          {step === 5 && (
            <div className="space-y-4">
              <GlowCard className="!p-4">
                {/* Cover Image Preview */}
                {formData.cover_image_url && (
                  <div className="mb-3 -mx-4 -mt-4">
                    <img 
                      src={formData.cover_image_url} 
                      alt="Event cover"
                      className="w-full h-32 object-cover rounded-t-xl"
                    />
                  </div>
                )}
                <h3 className="text-lg font-bold text-black mb-2">{formData.title}</h3>
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-500/30 text-green-800 border border-green-500/40">
                    🌱 Community
                  </span>
                  <span className="text-black/60 text-xs font-medium capitalize">
                    {formData.culture?.replace('_', ' ')}
                  </span>
                </div>

                {formData.description && (
                  <p className="text-sm text-black/70 mb-3">{formData.description}</p>
                )}

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-white/30 rounded-xl p-2">
                    <p className="text-black/60 text-xs font-medium">📅 When</p>
                    <p className="text-black font-bold">
                      {formData.starts_at && new Date(formData.starts_at).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </p>
                  </div>
                  <div className="bg-white/30 rounded-xl p-2">
                    <p className="text-black/60 text-xs font-medium">📍 Where</p>
                    <p className="text-black font-bold">
                      {formData.location_type === 'online' ? 'Online' : formData.location_name}
                    </p>
                  </div>
                </div>
              </GlowCard>

              <div className="p-3 bg-green-500/20 border border-green-500/40 rounded-2xl">
                <p className="text-green-800 text-sm font-medium">
                  ✨ As a Founder Member, your event will be published immediately!
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-500/40 rounded-2xl">
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/20 flex justify-between gap-3">
          <GlowButton
            variant="secondary"
            onClick={() => step > 1 ? setStep(s => s - 1) : onClose()}
            className="flex-1"
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </GlowButton>

          {step < 5 ? (
            <GlowButton
              variant="primary"
              onClick={() => setStep(s => s + 1)}
              disabled={!canProceed()}
              className="flex-1"
            >
              Continue
            </GlowButton>
          ) : (
            <GlowButton
              variant="primary"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Creating...' : 'Create Event'}
            </GlowButton>
          )}
        </div>
      </GlowCard>
    </div>
  );
}

export default HostEventModal;
