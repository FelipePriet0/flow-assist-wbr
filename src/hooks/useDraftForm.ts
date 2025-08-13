import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface DraftData {
  customer_data?: any;
  address_data?: any;
  employment_data?: any;
  household_data?: any;
  spouse_data?: any;
  references_data?: any;
  other_data?: any;
}

export function useDraftForm() {
  const [currentDraft, setCurrentDraft] = useState<{ id: string; data: DraftData } | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Load existing draft on mount
  useEffect(() => {
    loadExistingDraft();
  }, []);

  const loadExistingDraft = async () => {
    try {
      const { data, error } = await supabase
        .from('applications_drafts')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      if (data) {
        setCurrentDraft({
          id: data.id,
          data: {
            customer_data: data.customer_data,
            address_data: data.address_data,
            employment_data: data.employment_data,
            household_data: data.household_data,
            spouse_data: data.spouse_data,
            references_data: data.references_data,
            other_data: data.other_data,
          }
        });
      }
    } catch (error) {
      console.error('Error loading draft:', error);
    }
  };

  const saveDraft = useCallback(async (data: DraftData, showToast = true) => {
    setIsAutoSaving(true);
    try {
      if (currentDraft?.id) {
        // Update existing draft
        const { error } = await supabase
          .from('applications_drafts')
          .update({
            customer_data: data.customer_data,
            address_data: data.address_data,
            employment_data: data.employment_data,
            household_data: data.household_data,
            spouse_data: data.spouse_data,
            references_data: data.references_data,
            other_data: data.other_data,
          })
          .eq('id', currentDraft.id);

        if (error) throw error;
      } else {
        // Create new draft
        const { data: newDraft, error } = await supabase
          .from('applications_drafts')
          .insert({
            user_id: (await supabase.auth.getUser()).data.user?.id,
            customer_data: data.customer_data,
            address_data: data.address_data,
            employment_data: data.employment_data,
            household_data: data.household_data,
            spouse_data: data.spouse_data,
            references_data: data.references_data,
            other_data: data.other_data,
          })
          .select()
          .single();

        if (error) throw error;
        setCurrentDraft({ id: newDraft.id, data });
      }

      setLastSaved(new Date());
      if (showToast) {
        toast({
          title: "Rascunho salvo",
          description: "Suas informações foram salvas automaticamente",
        });
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      if (showToast) {
        toast({
          title: "Erro ao salvar",
          description: "Não foi possível salvar o rascunho",
          variant: "destructive",
        });
      }
    } finally {
      setIsAutoSaving(false);
    }
  }, [currentDraft?.id]);

  const deleteDraft = async () => {
    if (!currentDraft?.id) return;

    try {
      const { error } = await supabase
        .from('applications_drafts')
        .delete()
        .eq('id', currentDraft.id);

      if (error) throw error;
      setCurrentDraft(null);
    } catch (error) {
      console.error('Error deleting draft:', error);
    }
  };

  return {
    currentDraft,
    isAutoSaving,
    lastSaved,
    saveDraft,
    deleteDraft,
    loadExistingDraft,
  };
}