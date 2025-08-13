import { useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { useDraftForm } from '@/hooks/useDraftForm';

interface RecoveryToastProps {
  onRecover: () => void;
}

export function RecoveryToast({ onRecover }: RecoveryToastProps) {
  const { currentDraft } = useDraftForm();

  useEffect(() => {
    if (currentDraft && currentDraft.data.customer_data) {
      const customerName = currentDraft.data.customer_data.nome || 'Cliente';
      
      toast({
        title: "Ficha em andamento encontrada",
        description: `Você tem uma ficha de ${customerName} que não foi finalizada. Deseja continuar?`,
        action: (
          <ToastAction 
            altText="Recuperar ficha"
            onClick={onRecover}
          >
            Recuperar
          </ToastAction>
        ),
        duration: 10000, // 10 seconds
      });
    }
  }, [currentDraft, onRecover]);

  return null;
}