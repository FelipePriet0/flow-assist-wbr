import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export interface DraftFormData {
  customer_data?: any;
  address_data?: any;
  employment_data?: any;
  household_data?: any;
  spouse_data?: any;
  references_data?: any;
  other_data?: any;
  step?: string;
}

export function useDraftPersistence() {
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [currentApplicationId, setCurrentApplicationId] = useState<string | null>(null);
  const { profile } = useAuth();

  const checkForExistingSession = useCallback(async () => {
    if (!profile?.id) return null;

    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('current_edit_application_id')
        .eq('id', profile.id)
        .single();

      if (profileData?.current_edit_application_id) {
        // Check if draft exists
        const { data: draft } = await supabase
          .from('applications_drafts')
          .select('*')
          .eq('application_id', profileData.current_edit_application_id)
          .eq('user_id', profile.id)
          .maybeSingle();

        if (draft) {
          setCurrentApplicationId(profileData.current_edit_application_id);
          return {
            applicationId: profileData.current_edit_application_id,
            draftData: {
              customer_data: draft.customer_data,
              address_data: draft.address_data,
              employment_data: draft.employment_data,
              household_data: draft.household_data,
              spouse_data: draft.spouse_data,
              references_data: draft.references_data,
              other_data: draft.other_data,
              step: draft.step || 'basic'
            },
            step: draft.step || 'basic'
          };
        }
      }
    } catch (error) {
      console.error('Error checking for existing session:', error);
    }
    
    return null;
  }, [profile?.id]);

  const saveDraft = useCallback(async (
    applicationId: string,
    formData: DraftFormData,
    step: string = 'full',
    showToast: boolean = false
  ) => {
    if (!profile?.id) return;

    setIsAutoSaving(true);
    
    try {
      // Save or update draft
      const { error } = await supabase
        .from('applications_drafts')
        .upsert({
          user_id: profile.id,
          application_id: applicationId,
          customer_data: formData.customer_data,
          address_data: formData.address_data,
          employment_data: formData.employment_data,
          household_data: formData.household_data,
          spouse_data: formData.spouse_data,
          references_data: formData.references_data,
          other_data: formData.other_data,
          step: step,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      // Update profile's current editing session
      await supabase
        .from('profiles')
        .update({ current_edit_application_id: applicationId })
        .eq('id', profile.id);

      setCurrentApplicationId(applicationId);
      setLastSaved(new Date());

      if (showToast) {
        // Using native toast instead of hook to avoid dependency issues
        console.log('Draft saved successfully');
      }
      
    } catch (error) {
      console.error('Error saving draft:', error);
      
      // Auto-retry after 3 seconds on error
      setTimeout(() => {
        saveDraft(applicationId, formData, step, false);
      }, 3000);
    } finally {
      setIsAutoSaving(false);
    }
  }, [profile?.id]);

  const clearEditingSession = useCallback(async () => {
    if (!profile?.id) return;

    try {
      await supabase
        .from('profiles')
        .update({ current_edit_application_id: null })
        .eq('id', profile.id);
      
      setCurrentApplicationId(null);
    } catch (error) {
      console.error('Error clearing editing session:', error);
    }
  }, [profile?.id]);

  const deleteDraft = useCallback(async (applicationId?: string) => {
    if (!profile?.id) return;

    try {
      const targetId = applicationId || currentApplicationId;
      if (!targetId) return;

      await supabase
        .from('applications_drafts')
        .delete()
        .eq('user_id', profile.id)
        .eq('application_id', targetId);

      // Clear session if deleting current draft
      if (targetId === currentApplicationId) {
        await clearEditingSession();
      }
    } catch (error) {
      console.error('Error deleting draft:', error);
    }
  }, [profile?.id, currentApplicationId, clearEditingSession]);

  return {
    isAutoSaving,
    lastSaved,
    currentApplicationId,
    checkForExistingSession,
    saveDraft,
    clearEditingSession,
    deleteDraft
  };
}