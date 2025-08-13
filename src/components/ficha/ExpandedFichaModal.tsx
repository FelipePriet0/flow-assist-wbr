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
import { useDraftForm } from '@/hooks/useDraftForm';
import { Loader2, SaveIcon, CheckIcon } from 'lucide-react';

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
  const { isAutoSaving, lastSaved, saveDraft } = useDraftForm();
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);

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

  const handleFormChange = (formData: any) => {
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
      
      saveDraft(draftData, false); // Don't show toast for auto-save
    }, 3000); // Save after 3 seconds of inactivity

    setAutoSaveTimer(timer);
  };

  useEffect(() => {
    return () => {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }
    };
  }, [autoSaveTimer]);

  const transformedFormData: Partial<ComercialFormValues> = {
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
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[1200px] max-h-[95vh] overflow-hidden">
        <DialogHeader className="pb-2">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">
              Ficha Comercial - {basicInfo.nome}
            </DialogTitle>
            <SaveStatus />
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <NovaFichaComercialForm
            onSubmit={onSubmit}
            onCancel={onClose}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}