import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

  const checkForExistingSession = useCallback(async () => {
    return null; // Auth removed - no session tracking
  }, []);

  const saveDraft = useCallback(async (
    applicationId: string,
    formData: DraftFormData,
    step: string = 'full',
    showToast: boolean = false
  ) => {
    // Auth removed - draft saving disabled
    console.log('Draft saving disabled (no auth)');
  }, []);

  const clearEditingSession = useCallback(async () => {
    // Auth removed
    setCurrentApplicationId(null);
  }, []);

  const deleteDraft = useCallback(async (applicationId?: string) => {
    // Auth removed
    console.log('Delete draft disabled (no auth)');
  }, [currentApplicationId]);

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