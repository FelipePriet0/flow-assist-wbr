import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AgendaItem, Cidade, Etiqueta, Tecnico } from "./types";
import { CIDADES, ETIQUETAS, TECNICOS, suggestEtiqueta } from "@/services/agendaApi";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export interface AgendaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: Partial<AgendaItem> & { dia: string; horario: string };
  onSubmit: (data: Omit<AgendaItem, "id">) => Promise<void>;
  onDelete?: () => Promise<void>;
}

export function AgendaModal({ open, onOpenChange, initial, onSubmit, onDelete }: AgendaModalProps) {
  const [cliente, setCliente] = React.useState(initial.cliente ?? "");
  const [telefone, setTelefone] = React.useState(initial.telefone ?? "");
  const [cidade, setCidade] = React.useState<Cidade | undefined>(initial.cidade);
  const [tecnico, setTecnico] = React.useState<Tecnico | undefined>(initial.tecnico);
  const [etiqueta, setEtiqueta] = React.useState<Etiqueta | undefined>(initial.etiqueta);
  const [obs, setObs] = React.useState(initial.obs ?? "");
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  React.useEffect(() => {
    if (cidade && !etiqueta) {
      const s = suggestEtiqueta(cidade);
      if (s) setEtiqueta(s);
    }
  }, [cidade, etiqueta]);

  const canSave = cliente && cidade && tecnico && etiqueta && initial.dia && initial.horario;

  async function handleConfirmSave() {
    if (!canSave) return;
    await onSubmit({
      cliente,
      telefone,
      cidade: cidade!,
      tecnico: tecnico!,
      etiqueta: etiqueta!,
      obs,
      dia: initial.dia,
      horario: initial.horario,
      manutencao: etiqueta === "Mud End + Manutenção",
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo Agendamento</DialogTitle>
          <DialogDescription>Preencha os campos e salve para criar/atualizar.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-3">
          <div className="grid gap-2">
            <Label>Cliente</Label>
            <Input value={cliente} onChange={(e) => setCliente(e.target.value)} placeholder="Nome do cliente" />
          </div>
          <div className="grid gap-2">
            <Label>Telefone</Label>
            <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(00) 00000-0000" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="grid gap-2">
              <Label>Cidade</Label>
              <Select value={cidade} onValueChange={(v) => setCidade(v as Cidade)}>
                <SelectTrigger><SelectValue placeholder="Cidade" /></SelectTrigger>
                <SelectContent>
                  {CIDADES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Técnico</Label>
              <Select value={tecnico} onValueChange={(v) => setTecnico(v as Tecnico)}>
                <SelectTrigger><SelectValue placeholder="Técnico" /></SelectTrigger>
                <SelectContent>
                  {TECNICOS.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Etiqueta</Label>
              <Select value={etiqueta} onValueChange={(v) => setEtiqueta(v as Etiqueta)}>
                <SelectTrigger><SelectValue placeholder="Etiqueta" /></SelectTrigger>
                <SelectContent>
                  {ETIQUETAS.map((e) => (
                    <SelectItem key={e} value={e}>{e}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Observações</Label>
            <Input value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Opcional" />
          </div>
        </div>
        <DialogFooter className="mt-4">
          {onDelete && (
            <Button variant="destructive" onClick={() => onDelete()}>
              Remover agendamento
            </Button>
          )}
          <div className="ml-auto flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Sair</Button>
            <Button onClick={() => setConfirmOpen(true)} disabled={!canSave}>Salvar</Button>
          </div>
        </DialogFooter>
      </DialogContent>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar salvamento?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSave}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
