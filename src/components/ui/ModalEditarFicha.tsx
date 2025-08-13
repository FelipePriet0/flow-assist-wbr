import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { toast } from "@/hooks/use-toast";
import { X } from "lucide-react";
import { ExpandedFichaModal } from "@/components/ficha/ExpandedFichaModal";
import { ComercialFormValues } from "@/components/NovaFichaComercialForm";

interface ModalEditarFichaProps {
  card: any;
  responsaveis?: string[];
  onClose: () => void;
  onSave: (updatedCard: any) => void;
  onDesingressar?: (id: string) => void;
  onRefetch?: () => void;
}

export default function ModalEditarFicha({ card, onClose, onSave, onDesingressar, responsaveis = [], onRefetch }: ModalEditarFichaProps) {
  const initialForm = {
    nome: card?.nome ?? "",
    telefone: card?.telefone ?? "",
    responsavel: card?.responsavel ?? "",
    agendamento: card?.deadline ? new Date(card.deadline).toISOString().slice(0, 10) : "",
    recebido_em: card?.receivedAt ? new Date(card.receivedAt).toISOString().slice(0, 10) : "",
  };
  
  const [form, setForm] = useState(initialForm);
  const [showFirstConfirmDialog, setShowFirstConfirmDialog] = useState(false);
  const [showSecondConfirmDialog, setShowSecondConfirmDialog] = useState(false);
  const [showExpandedModal, setShowExpandedModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<'close' | 'save' | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Check if form has changes
  const hasChanges = () => {
    return JSON.stringify(form) !== JSON.stringify(initialForm);
  };

  const handleClose = () => {
    if (!hasChanges()) {
      onClose();
      return;
    }
    setPendingAction('close');
    setShowFirstConfirmDialog(true);
  };

  const handleSave = () => {
    if (!hasChanges()) {
      onSave(form);
      return;
    }
    setPendingAction('save');
    setShowFirstConfirmDialog(true);
  };

  const handleFirstConfirm = () => {
    setShowFirstConfirmDialog(false);
    setShowSecondConfirmDialog(true);
  };

  const handleSecondConfirm = () => {
    setShowSecondConfirmDialog(false);
    onSave(form);
    if (pendingAction === 'close') {
      onClose();
    }
    setPendingAction(null);
  };

  const handleDiscardChanges = () => {
    setShowFirstConfirmDialog(false);
    setShowSecondConfirmDialog(false);
    setPendingAction(null);
    onClose();
  };

  const handleExpandedSubmit = async (data: ComercialFormValues) => {
    // Handle the full form submission
    console.log('Full form submitted:', data);
    setShowExpandedModal(false);
    onRefetch?.();
  };

  const basicInfo = {
    nome: card?.nome || '',
    cpf: card?.cpf || '',
    telefone: card?.telefone || '',
    whatsapp: card?.whatsapp || card?.telefone || '',
    nascimento: card?.nascimento ? new Date(card.nascimento) : new Date(),
    naturalidade: card?.naturalidade || '',
    uf: card?.uf || '',
    email: card?.email || ''
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={(e) => e.preventDefault()}>
        <div className="bg-background text-foreground p-6 rounded-md shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Editar Ficha</h2>
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

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nome do Cliente</Label>
            <Input name="nome" value={form.nome} onChange={handleChange} />
          </div>

          <div className="space-y-2">
            <Label>Telefone</Label>
            <Input name="telefone" inputMode="tel" type="tel" value={form.telefone} onChange={handleChange} />
          </div>

          <div className="space-y-2">
            <Label>Prazo de Agendamento</Label>
            <Input name="agendamento" type="date" value={form.agendamento} onChange={handleChange} />
          </div>

          <div className="space-y-2">
            <Label>Responsável</Label>
            <Select value={form.responsavel} onValueChange={(v) => setForm((s) => ({ ...s, responsavel: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Atribuir" />
              </SelectTrigger>
              <SelectContent className="z-50">
                {responsaveis.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Recebido em</Label>
            <Input name="recebido_em" type="date" value={form.recebido_em} onChange={handleChange} disabled={card?.columnId === "recebido"} title={card?.columnId === "recebido" ? "Não é possível alterar quando na coluna Recebidos" : undefined} />
          </div>
        </div>

          <div className="flex items-center justify-between mt-6">
            <Button 
              variant="outline" 
              onClick={() => setShowExpandedModal(true)}
            >
              Analisar
            </Button>
            <div className="flex gap-2">
              {card?.columnId === "em_analise" && (
                <Button variant="secondary" onClick={() => { onDesingressar?.(card.id); toast({ title: "Card retornado para Recebidos" }); onClose(); }}>
                  Desingressar
                </Button>
              )}
              <Button onClick={handleSave}>Salvar Alterações</Button>
            </div>
          </div>

        </div>
      </div>

      {/* First confirmation dialog */}
      <AlertDialog open={showFirstConfirmDialog} onOpenChange={setShowFirstConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você deseja alterar as informações dessa ficha?</AlertDialogTitle>
            <AlertDialogDescription>
              As informações serão atualizadas permanentemente.
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

      <ExpandedFichaModal
        open={showExpandedModal}
        onClose={() => setShowExpandedModal(false)}
        onSubmit={handleExpandedSubmit}
        basicInfo={basicInfo}
        applicationId={card?.id}
      />
    </>
  );
}
