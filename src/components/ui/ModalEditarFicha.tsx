import React, { useState } from "react";

interface ModalEditarFichaProps {
  card: any;
  onClose: () => void;
  onSave: (updatedCard: any) => void;
}

export default function ModalEditarFicha({ card, onClose, onSave }: ModalEditarFichaProps) {
  const [form, setForm] = useState({ ...card });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    if (!form.parecer) {
      alert("O campo 'Parecer' é obrigatório.");
      return;
    }
    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow w-full max-w-md">
        <h2 className="text-xl mb-4">Editar Ficha</h2>

        <label className="block mb-2">Nome do Cliente</label>
        <input className="input" name="nome" value={form.nome} onChange={handleChange} />

        <label className="block mt-4 mb-2">Telefone</label>
        <input className="input" name="telefone" value={form.telefone} onChange={handleChange} />

        <label className="block mt-4 mb-2">Prazo de Agendamento</label>
        <input className="input" name="agendamento" type="date" value={form.agendamento} onChange={handleChange} />

        <label className="block mt-4 mb-2">Responsável</label>
        <input className="input" name="responsavel" value={form.responsavel} onChange={handleChange} />

        <label className="block mt-4 mb-2">Recebido em</label>
        <input className="input" name="recebido_em" type="date" value={form.recebido_em} onChange={handleChange} />

        <label className="block mt-4 mb-2">Parecer do Analista *</label>
        <textarea className="input" name="parecer" value={form.parecer} onChange={handleChange} />

        <div className="flex justify-between mt-6">
          <button onClick={handleSave} className="btn bg-blue-600 text-white px-4 py-2 rounded">Salvar</button>
          <button onClick={onClose} className="btn bg-gray-300 px-4 py-2 rounded">Fechar</button>
        </div>
      </div>
    </div>
  );
}
