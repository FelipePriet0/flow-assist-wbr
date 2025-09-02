import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import NovaFichaComercialForm, { ComercialFormValues } from '@/components/NovaFichaComercialForm';
import { BasicInfoData } from './BasicInfoModal';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDraftPersistence } from '@/hooks/useDraftPersistence';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, SaveIcon, CheckIcon, X } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export interface Parecer {
  id: string;
  author_id: string;
  author_name: string;
  author_role: string;
  created_at: string;
  text: string;
}

interface ExpandedFichaModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ComercialFormValues) => Promise<void>;
  basicInfo: BasicInfoData;
  applicationId?: string;
}

export function ExpandedFichaModal({ 
  open, 
  onClose, 
  onSubmit, 
  basicInfo,
  applicationId 
}: ExpandedFichaModalProps) {
  const { isAutoSaving, lastSaved, saveDraft, clearEditingSession } = useDraftPersistence();
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);
  const [showFirstConfirmDialog, setShowFirstConfirmDialog] = useState(false);
  const [showSecondConfirmDialog, setShowSecondConfirmDialog] = useState(false);
  const [showDeleteParecerDialog, setShowDeleteParecerDialog] = useState(false);
  const [parecerToDelete, setParecerToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState<ComercialFormValues | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [pendingAction, setPendingAction] = useState<'close' | 'save' | null>(null);
  const [initialFormData, setInitialFormData] = useState<ComercialFormValues | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [loadedDraftData, setLoadedDraftData] = useState<any>(null);
  const [isLoadingDraft, setIsLoadingDraft] = useState(false);

  // Auto-save status component
  const SaveStatus = () => {
    if (isAutoSaving) {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          Salvando...
        </Badge>
      );
    }

    if (lastSaved) {
      return (
        <Badge variant="outline" className="flex items-center gap-1">
          <CheckIcon className="h-3 w-3 text-green-500" />
          Salvo às {lastSaved.toLocaleTimeString()}
        </Badge>
      );
    }

    return null;
  };

  // Function to normalize values for comparison
  const normalizeValue = (value: any): any => {
    if (value === null || value === undefined || value === '') {
      return '';
    }
    if (typeof value === 'object' && !Array.isArray(value)) {
      const normalized: any = {};
      for (const key in value) {
        normalized[key] = normalizeValue(value[key]);
      }
      return normalized;
    }
    if (Array.isArray(value)) {
      return value.map(normalizeValue);
    }
    return value;
  };

  // Function to compare form data with initial values
  const compareFormData = (current: ComercialFormValues, initial: ComercialFormValues): boolean => {
    try {
      const normalizedCurrent = normalizeValue(current);
      const normalizedInitial = normalizeValue(initial);
      
      // Special handling for pareceres array
      if (normalizedCurrent.pareceres && normalizedInitial.pareceres) {
        const currentPareceres = normalizedCurrent.pareceres || [];
        const initialPareceres = normalizedInitial.pareceres || [];
        
        // Compare parecer arrays more intelligently
        if (currentPareceres.length !== initialPareceres.length) {
          console.log('Parecer count changed:', currentPareceres.length, 'vs', initialPareceres.length);
          return true;
        }
        
        // Compare each parecer by text content (ignore timestamps/ids)
        for (let i = 0; i < currentPareceres.length; i++) {
          const current = currentPareceres[i];
          const initial = initialPareceres[i];
          if (current?.text !== initial?.text) {
            console.log('Parecer text changed:', current?.text, 'vs', initial?.text);
            return true;
          }
        }
        
        // Compare other fields excluding pareceres
        const { pareceres: _, ...currentWithoutPareceres } = normalizedCurrent;
        const { pareceres: __, ...initialWithoutPareceres } = normalizedInitial;
        
        return JSON.stringify(currentWithoutPareceres) !== JSON.stringify(initialWithoutPareceres);
      }
      
      return JSON.stringify(normalizedCurrent) !== JSON.stringify(normalizedInitial);
    } catch (error) {
      console.error('Error comparing form data:', error);
      return false; // Assume no changes on error
    }
  };

  const handleFormChange = (formData: any) => {
    setFormData(formData);
    
    // Only set hasChanges if we're initialized and there are actual changes
    if (isInitialized && initialFormData) {
      const hasActualChanges = compareFormData(formData, initialFormData);
      setHasChanges(hasActualChanges);
    } else if (!isInitialized) {
      // Store initial form data on first change (after form initialization)
      setInitialFormData(formData);
      setIsInitialized(true);
      setHasChanges(false); // No changes on initialization
    }
    
    // Clear existing timer
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
    }

    // Set new timer for auto-save
    const timer = setTimeout(() => {
      const draftData = {
        customer_data: {
          ...basicInfo,
          ...formData.cliente,
        },
        address_data: formData.endereco,
        employment_data: formData.empregoRenda,
        household_data: formData.relacoes,
        spouse_data: formData.conjuge,
        references_data: formData.referencias,
        other_data: {
          spc: formData.spc,
          pesquisador: formData.pesquisador,
          filiacao: formData.filiacao,
          outras: formData.outras,
          infoRelevantes: formData.infoRelevantes,
        },
      };
      
      if (applicationId) {
        saveDraft(applicationId, draftData, 'full', false); // Don't show toast for auto-save
      }
    }, 700); // Save after 700ms of inactivity (optimized debounce)

    setAutoSaveTimer(timer);
  };

  const handleClose = () => {
    if (!hasChanges) {
      onClose();
      return;
    }
    setPendingAction('close');
    setShowFirstConfirmDialog(true);
  };

  const handleFirstConfirm = () => {
    setShowFirstConfirmDialog(false);
    setShowSecondConfirmDialog(true);
  };

  const handleSecondConfirm = async () => {
    setShowSecondConfirmDialog(false);
    
    if (pendingAction === 'close' || pendingAction === 'save') {
      if (formData) {
        await onSubmit(formData);
        await clearEditingSession();
      }
      onClose();
    }
    
    setPendingAction(null);
  };

  const handleDiscardChanges = async () => {
    await clearEditingSession();
    setShowFirstConfirmDialog(false);
    setShowSecondConfirmDialog(false);
    setPendingAction(null);
    onClose();
  };

  const handleSubmitWrapper = async (data: ComercialFormValues) => {
    if (applicationId) {
      // Show double confirmation for editing existing ficha
      setFormData(data);
      setPendingAction('save');
      setShowFirstConfirmDialog(true);
    } else {
      // Direct submit for new ficha
      await onSubmit(data);
      await clearEditingSession();
    }
  };

  const handleDeleteParecer = (parecerId: string) => {
    setParecerToDelete(parecerId);
    setShowDeleteParecerDialog(true);
  };

  const confirmDeleteParecer = () => {
    if (parecerToDelete && formData) {
      // Remove parecer from form data and trigger form change
      const updatedFormData = { ...formData };
      // This will be handled by the NovaFichaComercialForm component
      setHasChanges(true);
    }
    setShowDeleteParecerDialog(false);
    setParecerToDelete(null);
  };

  // Load existing draft data when modal opens
  useEffect(() => {
    const loadExistingDraft = async () => {
      if (open && applicationId) {
        setIsLoadingDraft(true);
        try {
          const { data: draft, error } = await supabase
            .from('applications_drafts')
            .select('*')
            .eq('application_id', applicationId)
            .maybeSingle();

          if (!error && draft) {
            console.log('Loaded existing draft data:', draft);
            setLoadedDraftData(draft);
          } else {
            console.log('No existing draft found for applicationId:', applicationId);
            setLoadedDraftData(null);
          }
        } catch (error) {
          console.error('Error loading draft data:', error);
          setLoadedDraftData(null);
        } finally {
          setIsLoadingDraft(false);
        }
      } else if (open) {
        // Reset state for new applications
        setLoadedDraftData(null);
        setIsLoadingDraft(false);
      }
    };

    loadExistingDraft();
  }, [open, applicationId]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open) {
      setHasChanges(false);
      setIsInitialized(false);
      setInitialFormData(null);
    }
  }, [open]);

  useEffect(() => {
    return () => {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }
    };
  }, [autoSaveTimer]);

  // Map loaded draft data to form format
  const mapDraftToFormData = (draft: any): Partial<ComercialFormValues> => {
    return {
      cliente: {
        nome: basicInfo.nome,
        cpf: basicInfo.cpf,
        nasc: basicInfo.nascimento ? basicInfo.nascimento.toISOString().split('T')[0] : '',
        tel: basicInfo.telefone,
        whats: basicInfo.whatsapp || '',
        naturalidade: basicInfo.naturalidade,
        uf: basicInfo.uf,
        email: basicInfo.email || '',
        doPs: draft?.customer_data?.doPs || '',
      },
      endereco: {
        end: draft?.address_data?.end || '',
        n: draft?.address_data?.n || '',
        compl: draft?.address_data?.compl || '',
        cep: draft?.address_data?.cep || '',
        bairro: draft?.address_data?.bairro || '',
        cond: draft?.address_data?.cond || '',
        tempo: draft?.address_data?.tempo || '',
        tipoMoradia: draft?.address_data?.tipoMoradia || undefined,
        tipoMoradiaObs: draft?.address_data?.tipoMoradiaObs || '',
        doPs: draft?.address_data?.doPs || '',
      },
      relacoes: {
        unicaNoLote: draft?.household_data?.unicaNoLote || undefined,
        unicaNoLoteObs: draft?.household_data?.unicaNoLoteObs || '',
        comQuemReside: draft?.household_data?.comQuemReside || '',
        nasOutras: draft?.household_data?.nasOutras || undefined,
        temContrato: draft?.household_data?.temContrato || 'Não',
        enviouContrato: draft?.household_data?.enviouContrato || undefined,
        nomeDe: draft?.household_data?.nomeDe || '',
        nomeLocador: draft?.household_data?.nomeLocador || '',
        telefoneLocador: draft?.household_data?.telefoneLocador || '',
        enviouComprovante: draft?.household_data?.enviouComprovante || undefined,
        tipoComprovante: draft?.household_data?.tipoComprovante || undefined,
        nomeComprovante: draft?.household_data?.nomeComprovante || '',
        temInternetFixa: draft?.household_data?.temInternetFixa || undefined,
        empresaInternet: draft?.household_data?.empresaInternet || '',
        observacoes: draft?.household_data?.observacoes || '',
      },
      empregoRenda: {
        profissao: draft?.employment_data?.profissao || '',
        empresa: draft?.employment_data?.empresa || '',
        vinculo: draft?.employment_data?.vinculo || undefined,
        vinculoObs: draft?.employment_data?.vinculoObs || '',
        doPs: draft?.employment_data?.doPs || '',
      },
      conjuge: {
        estadoCivil: draft?.spouse_data?.estadoCivil || undefined,
        obs: draft?.spouse_data?.obs || '',
        nome: draft?.spouse_data?.nome || '',
        telefone: draft?.spouse_data?.telefone || '',
        whatsapp: draft?.spouse_data?.whatsapp || '',
        cpf: draft?.spouse_data?.cpf || '',
        naturalidade: draft?.spouse_data?.naturalidade || '',
        uf: draft?.spouse_data?.uf || '',
        obs2: draft?.spouse_data?.obs2 || '',
        doPs: draft?.spouse_data?.doPs || '',
      },
      spc: draft?.other_data?.spc || '',
      pesquisador: draft?.other_data?.pesquisador || '',
      filiacao: {
        pai: { 
          nome: draft?.other_data?.filiacao?.pai?.nome || '', 
          reside: draft?.other_data?.filiacao?.pai?.reside || '', 
          telefone: draft?.other_data?.filiacao?.pai?.telefone || '' 
        },
        mae: { 
          nome: draft?.other_data?.filiacao?.mae?.nome || '', 
          reside: draft?.other_data?.filiacao?.mae?.reside || '', 
          telefone: draft?.other_data?.filiacao?.mae?.telefone || '' 
        },
      },
      referencias: {
        ref1: { 
          nome: draft?.references_data?.ref1?.nome || '', 
          telefone: draft?.references_data?.ref1?.telefone || '', 
          reside: draft?.references_data?.ref1?.reside || '', 
          parentesco: draft?.references_data?.ref1?.parentesco || '' 
        },
        ref2: { 
          nome: draft?.references_data?.ref2?.nome || '', 
          telefone: draft?.references_data?.ref2?.telefone || '', 
          reside: draft?.references_data?.ref2?.reside || '', 
          parentesco: draft?.references_data?.ref2?.parentesco || '' 
        },
      },
      outras: {
        planoEscolhido: draft?.other_data?.outras?.planoEscolhido || '',
        diaVencimento: draft?.other_data?.outras?.diaVencimento || undefined,
        carneImpresso: draft?.other_data?.outras?.carneImpresso || undefined,
        svaAvulso: draft?.other_data?.outras?.svaAvulso || '',
      },
      infoRelevantes: {
        info: draft?.other_data?.infoRelevantes?.info || '',
        infoMk: draft?.other_data?.infoRelevantes?.infoMk || '',
        parecerAnalise: draft?.other_data?.infoRelevantes?.parecerAnalise || '',
      },
    };
  };

  // Generate transformed form data based on loaded draft or defaults
  const transformedFormData: Partial<ComercialFormValues> = loadedDraftData 
    ? mapDraftToFormData(loadedDraftData) 
    : {
    cliente: {
      nome: basicInfo.nome,
      cpf: basicInfo.cpf,
      nasc: basicInfo.nascimento ? basicInfo.nascimento.toISOString().split('T')[0] : '',
      tel: basicInfo.telefone,
      whats: basicInfo.whatsapp || '',
      naturalidade: basicInfo.naturalidade,
      uf: basicInfo.uf,
      email: basicInfo.email || '',
      doPs: '',
    },
    endereco: {
      end: '',
      n: '',
      compl: '',
      cep: '',
      bairro: '',
      cond: '',
      tempo: '',
      tipoMoradia: undefined,
      tipoMoradiaObs: '',
      doPs: '',
    },
    relacoes: {
      unicaNoLote: undefined,
      unicaNoLoteObs: '',
      comQuemReside: '',
      nasOutras: undefined,
      temContrato: 'Não',
      enviouContrato: undefined,
      nomeDe: '',
      nomeLocador: '',
      telefoneLocador: '',
      enviouComprovante: undefined,
      tipoComprovante: undefined,
      nomeComprovante: '',
      temInternetFixa: undefined,
      empresaInternet: '',
      observacoes: '',
    },
    empregoRenda: {
      profissao: '',
      empresa: '',
      vinculo: undefined,
      vinculoObs: '',
      doPs: '',
    },
    conjuge: {
      estadoCivil: undefined,
      obs: '',
      nome: '',
      telefone: '',
      whatsapp: '',
      cpf: '',
      naturalidade: '',
      uf: '',
      obs2: '',
      doPs: '',
    },
    spc: '',
    pesquisador: '',
    filiacao: {
      pai: { nome: '', reside: '', telefone: '' },
      mae: { nome: '', reside: '', telefone: '' },
    },
    referencias: {
      ref1: { nome: '', telefone: '', reside: '', parentesco: '' },
      ref2: { nome: '', telefone: '', reside: '', parentesco: '' },
    },
    outras: {
      planoEscolhido: '',
      diaVencimento: undefined,
      carneImpresso: undefined,
      svaAvulso: '',
    },
    infoRelevantes: {
      info: '',
      infoMk: '',
      parecerAnalise: '',
    },
  };

  return (
    <>
      <Dialog open={open} onOpenChange={() => handleClose()}>
        <DialogContent 
          className="max-w-[1200px] max-h-[95vh] overflow-hidden"
          onInteractOutside={(e) => e.preventDefault()} // Prevent closing on outside click
        >
          <DialogHeader className="pb-2">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl">
                Ficha Comercial - {basicInfo.nome}
              </DialogTitle>
              <div className="flex items-center gap-2">
                <SaveStatus />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  className="h-8 w-8 p-0"
                  aria-label="Fechar"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-hidden">
            {isLoadingDraft ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Carregando dados da ficha...</span>
              </div>
            ) : (
              <NovaFichaComercialForm
                onSubmit={handleSubmitWrapper}
                initialValues={transformedFormData}
                onFormChange={handleFormChange}
                applicationId={applicationId}
                onDeleteParecer={handleDeleteParecer}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* First confirmation dialog */}
      <AlertDialog open={showFirstConfirmDialog} onOpenChange={setShowFirstConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você deseja alterar as informações dessa ficha?</AlertDialogTitle>
            <AlertDialogDescription>
              As alterações serão aplicadas permanentemente à ficha.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDiscardChanges}>
              Descartar alterações
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleFirstConfirm}>
              Sim, alterar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Second confirmation dialog */}
      <AlertDialog open={showSecondConfirmDialog} onOpenChange={setShowSecondConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza que deseja alterar as informações?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowSecondConfirmDialog(false);
              setPendingAction(null);
            }}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleSecondConfirm}>
              Confirmar alteração
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete parecer confirmation dialog */}
      <AlertDialog open={showDeleteParecerDialog} onOpenChange={setShowDeleteParecerDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você deseja apagar este parecer?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteParecerDialog(false)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              setShowDeleteParecerDialog(false);
              // Show second confirmation
              setTimeout(() => {
                if (window.confirm("Tem certeza que deseja apagar este parecer?")) {
                  confirmDeleteParecer();
                }
              }, 100);
            }} className="bg-destructive hover:bg-destructive/90">
              Sim, apagar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}