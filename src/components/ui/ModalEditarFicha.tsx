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

interface ModalEditarFichaProps {
  card: any;
  responsaveis?: string[];
  onClose: () => void;
  onSave: (updatedCard: any) => void;
}

export default function ModalEditarFicha({ card, onClose, onSave, responsaveis = [] }: ModalEditarFichaProps) {
  const [form, setForm] = useState({
    nome: card?.nome ?? "",
    telefone: card?.telefone ?? "",
    responsavel: card?.responsavel ?? "",
    agendamento: card?.deadline ? new Date(card.deadline).toISOString().slice(0, 10) : "",
    recebido_em: card?.receivedAt ? new Date(card.receivedAt).toISOString().slice(0, 10) : "",
  });
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => setConfirmOpen(true);

  const confirmSave = () => {
    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background text-foreground p-6 rounded-md shadow-xl w-full max-w-md">
        <h2 className="text-xl mb-4 font-semibold">Editar Ficha</h2>

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

        <div className="flex justify-between mt-6">
          <Button variant="secondary" onClick={onClose}>Sair</Button>
          <Button onClick={handleSave}>Salvar Alterações</Button>
        </div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar alterações?</AlertDialogTitle>
            <AlertDialogDescription>As alterações serão aplicadas à ficha.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSave}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
