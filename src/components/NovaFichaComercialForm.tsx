import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Trash2, Plus } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";

interface Parecer {
  id: string;
  author_id: string;
  author_name: string;
  author_role: string;
  created_at: string;
  text: string;
}

// Schema
const schema = z.object({
  cliente: z.object({
    nome: z.string().min(1, "Obrigatório"),
    cpf: z.string().min(11, "CPF é obrigatório").max(14, "CPF inválido"),
    nasc: z.string().optional(), // yyyy-mm-dd
    tel: z.string().optional(),
    whats: z.string().optional(),
    doPs: z.string().optional(),
    naturalidade: z.string().optional(),
    uf: z.string().optional(),
    email: z.string().email().optional().or(z.literal("").transform(() => undefined)),
  }),
  endereco: z.object({
    end: z.string().optional(),
    n: z.string().optional(),
    compl: z.string().optional(),
    cep: z.string().optional(),
    bairro: z.string().optional(),
    cond: z.string().optional(),
    tempo: z.string().optional(),
    tipoMoradia: z.enum(["Propria", "Alugada", "Cedida", "Outro"]).optional(),
    tipoMoradiaObs: z.string().optional(),
    doPs: z.string().optional(),
  }),
  relacoes: z.object({
    unicaNoLote: z.enum(["Sim", "Não"]).optional(),
    unicaNoLoteObs: z.string().optional(),
    comQuemReside: z.string().optional(),
    nasOutras: z.enum(["Parentes", "Locador(a)", "Só conhecidos", "Não conhece"]).optional(),
    temContrato: z.enum(["Sim", "Não"]).default("Não"),
    enviouContrato: z.enum(["Sim", "Não"]).optional(),
    nomeDe: z.string().optional(),
    nomeLocador: z.string().optional(),
    telefoneLocador: z.string().optional(),
    enviouComprovante: z.enum(["Sim", "Não"]).optional(),
    tipoComprovante: z.enum(["Energia", "Água", "Internet", "Outro"]).optional(),
    nomeComprovante: z.string().optional(),
    temInternetFixa: z.enum(["Sim", "Não"]).optional(),
    empresaInternet: z.string().optional(),
    observacoes: z.string().optional(),
  }).superRefine((val, ctx) => {
    if (val.temContrato === "Sim") {
      if (!val.enviouContrato) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["enviouContrato"], message: "Obrigatório" });
      }
      if (!val.nomeDe?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["nomeDe"], message: "Obrigatório" });
      }
      if (!val.nomeLocador?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["nomeLocador"], message: "Obrigatório" });
      }
    }
    if (val.temInternetFixa === "Sim" && !val.empresaInternet?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["empresaInternet"], message: "Obrigatório" });
    }
  }),
  empregoRenda: z.object({
    profissao: z.string().optional(),
    empresa: z.string().optional(),
    vinculo: z.enum([
      "Carteira Assinada",
      "Presta Serviços",
      "Contrato de trabalho",
      "Autônomo",
      "Concursado",
      "Outro",
    ]).optional(),
    vinculoObs: z.string().optional(),
    doPs: z.string().optional(),
  }),
  conjuge: z.object({
    estadoCivil: z.enum(["Solteiro(a)", "Casado(a)", "Amasiado(a)", "Separado(a)", "Viúvo(a)"]).optional(),
    obs: z.string().optional(),
    nome: z.string().optional(),
    telefone: z.string().optional(),
    whatsapp: z.string().optional(),
    cpf: z.string().optional(),
    naturalidade: z.string().optional(),
    uf: z.string().optional(),
    obs2: z.string().optional(),
    doPs: z.string().optional(),
  }),
  spc: z.string().optional(),
  pesquisador: z.string().optional(),
  filiacao: z.object({
    pai: z.object({ nome: z.string().optional(), reside: z.string().optional(), telefone: z.string().optional() }).optional(),
    mae: z.object({ nome: z.string().optional(), reside: z.string().optional(), telefone: z.string().optional() }).optional(),
  }).optional(),
  referencias: z.object({
    ref1: z.object({ nome: z.string().optional(), parentesco: z.string().optional(), reside: z.string().optional(), telefone: z.string().optional() }).optional(),
    ref2: z.object({ nome: z.string().optional(), parentesco: z.string().optional(), reside: z.string().optional(), telefone: z.string().optional() }).optional(),
  }),
  outras: z.object({
    planoEscolhido: z.string().optional(), // aguardando lista final
    diaVencimento: z.enum(["5", "10", "15", "20", "25"]).optional(),
    carneImpresso: z.enum(["Sim", "Não"]).optional(),
    svaAvulso: z.string().optional(),
    administrativas: z.object({
      quemSolicitou: z.string().optional(),
      meio: z.enum(["Presencial", "Ligação", "WhatsApp"]).optional(),
      fone: z.string().optional(),
      via: z.enum(["Rádio", "Outdoor", "Instagram", "Facebook", "Site", "Indicação", "Já foi cliente"]).optional(),
      data: z.string().optional(),
      protocoloMk: z.string().optional(),
      representanteWbr: z.string().optional(),
    }).optional(),
  }),
  administrativas: z.object({
    quemSolicitou: z.string().optional(),
    meio: z.enum(["Presencial", "Ligação", "WhatsApp"]).optional(),
    fone: z.string().optional(),
    via: z.enum(["Rádio", "Outdoor", "Instagram", "Facebook", "Site", "Indicação", "Já foi cliente"]).optional(),
    data: z.string().optional(),
    protocoloMk: z.string().optional(),
    representanteWbr: z.string().optional(),
  }).optional(),
  infoRelevantes: z.object({
    info: z.string().optional(),
    infoMk: z.string().optional(),
    parecerAnalise: z.string().optional(), // deve permanecer em branco
  }),
});

export type ComercialFormValues = z.infer<typeof schema>;

interface NovaFichaComercialFormProps {
  onSubmit: (data: ComercialFormValues) => Promise<void>;
  onCancel?: () => void;
  initialValues?: Partial<ComercialFormValues>;
  onFormChange?: (data: ComercialFormValues) => void;
  applicationId?: string;
  onDeleteParecer?: (parecerId: string) => void;
}

export default function NovaFichaComercialForm({ onSubmit, onCancel, initialValues, onFormChange, applicationId, onDeleteParecer }: NovaFichaComercialFormProps) {
  const { name: currentUserName } = useCurrentUser();
  const [pareceres, setPareceres] = React.useState<Parecer[]>([]);
  
  const defaultValues: Partial<ComercialFormValues> = {
    cliente: { nome: "" },
    relacoes: { temContrato: "Não" },
    ...initialValues,
  };

  const form = useForm<ComercialFormValues>({ 
    resolver: zodResolver(schema), 
    defaultValues,
  });

  // Initialize pareceres from existing data
  React.useEffect(() => {
    const existingParecer = initialValues?.infoRelevantes?.parecerAnalise;
    if (existingParecer && existingParecer.trim()) {
      try {
        // Try to parse as JSON array
        const parsed = JSON.parse(existingParecer);
        if (Array.isArray(parsed)) {
          setPareceres(parsed);
        } else {
          // Convert old string format to new format
          setPareceres([{
            id: crypto.randomUUID(),
            author_id: 'legacy',
            author_name: 'Sistema',
            author_role: 'analista',
            created_at: new Date().toISOString(),
            text: existingParecer
          }]);
        }
      } catch {
        // Convert old string format to new format
        setPareceres([{
          id: crypto.randomUUID(),
          author_id: 'legacy',
          author_name: 'Sistema',
          author_role: 'analista',
          created_at: new Date().toISOString(),
          text: existingParecer
        }]);
      }
    }
  }, [initialValues?.infoRelevantes?.parecerAnalise]);

  // Sync pareceres with form
  React.useEffect(() => {
    const serialized = JSON.stringify(pareceres);
    form.setValue('infoRelevantes.parecerAnalise', serialized, { shouldValidate: false });
  }, [pareceres, form]);

  const addNovoParecer = () => {
    const newParecer: Parecer = {
      id: crypto.randomUUID(),
      author_id: 'current-user-id', // In real app, get from auth
      author_name: currentUserName,
      author_role: 'analista', // In real app, get from user profile
      created_at: new Date().toISOString(),
      text: ''
    };
    setPareceres(prev => [...prev, newParecer]);
  };

  const updateParecerText = (id: string, text: string) => {
    setPareceres(prev => prev.map(p => p.id === id ? { ...p, text } : p));
  };

  const deleteParecer = (id: string) => {
    if (onDeleteParecer) {
      onDeleteParecer(id);
    }
    setPareceres(prev => prev.filter(p => p.id !== id));
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Side effects for contract logic
  const temContrato = form.watch("relacoes.temContrato");
  const enviouContrato = form.watch("relacoes.enviouContrato");
  const nomeDe = form.watch("relacoes.nomeDe");

  React.useEffect(() => {
    if (temContrato === "Sim" && enviouContrato === "Sim") {
      form.setValue("relacoes.enviouComprovante", "Sim", { shouldValidate: true });
      form.setValue("relacoes.tipoComprovante", "Outro", { shouldValidate: true });
      if (nomeDe) {
        form.setValue("relacoes.nomeComprovante", nomeDe, { shouldValidate: false });
      }
    }
  }, [temContrato, enviouContrato, nomeDe, form]);

  // Age < 45 -> show filiacao
  const nasc = form.watch("cliente.nasc");
  const showFiliacao = React.useMemo(() => {
    if (!nasc) return false;
    const d = new Date(nasc);
    if (isNaN(d.getTime())) return false;
    const age = Math.floor((Date.now() - d.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    return age < 45;
  }, [nasc]);

  async function submit(values: ComercialFormValues) {
    // Ensure analysis fields remain blank
    values.infoRelevantes = {
      info: values.infoRelevantes?.info || "",
      infoMk: values.infoRelevantes?.infoMk || "",
      parecerAnalise: "",
    };
    await onSubmit(values);
  }

  // Watch form changes for auto-save
  const formValues = form.watch();
  React.useEffect(() => {
    if (onFormChange) {
      onFormChange(formValues);
    }
  }, [formValues, onFormChange]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submit)} className="space-y-6 max-h-[70vh] overflow-y-auto pr-1">
        {/* 1. Dados do Cliente */}
        <section>
          <h3 className="text-lg font-semibold mb-3">1. Dados do Cliente</h3>
          <div className="grid gap-3 grid-cols-1 md:grid-cols-3">
            <FormField control={form.control} name="cliente.nome" render={({ field }) => (
              <FormItem className="md:col-span-3">
                <FormLabel>Nome</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="cliente.tel" render={({ field }) => (
              <FormItem>
                <FormLabel>Tel</FormLabel>
                <FormControl><Input inputMode="tel" {...field} /></FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="cliente.whats" render={({ field }) => (
              <FormItem>
                <FormLabel>Whats</FormLabel>
                <FormControl><Input inputMode="tel" {...field} /></FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="cliente.doPs" render={({ field }) => (
              <FormItem>
                <FormLabel>Do PS</FormLabel>
                <FormControl><Input {...field} /></FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="cliente.cpf" render={({ field }) => (
              <FormItem>
                <FormLabel>CPF *</FormLabel>
                <FormControl><Input {...field} placeholder="000.000.000-00" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="cliente.nasc" render={({ field }) => (
              <FormItem>
                <FormLabel>Nasc</FormLabel>
                <FormControl><Input type="date" {...field} /></FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="cliente.naturalidade" render={({ field }) => (
              <FormItem>
                <FormLabel>Naturalidade</FormLabel>
                <FormControl><Input {...field} /></FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="cliente.uf" render={({ field }) => (
              <FormItem>
                <FormLabel>UF</FormLabel>
                <FormControl><Input maxLength={2} {...field} /></FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="cliente.email" render={({ field }) => (
              <FormItem className="md:col-span-3">
                <FormLabel>E-mail</FormLabel>
                <FormControl><Input type="email" {...field} /></FormControl>
              </FormItem>
            )} />
          </div>
        </section>

        {/* 2. Endereço */}
        <section>
          <h3 className="text-lg font-semibold mb-3">2. Endereço</h3>
          <div className="grid gap-3 grid-cols-1 md:grid-cols-3">
            <FormField control={form.control} name="endereco.end" render={({ field }) => (
              <FormItem>
                <FormLabel>Endereço (logradouro)</FormLabel>
                <FormControl><Input {...field} /></FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="endereco.n" render={({ field }) => (
              <FormItem>
                <FormLabel>Nº</FormLabel>
                <FormControl><Input {...field} /></FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="endereco.compl" render={({ field }) => (
              <FormItem>
                <FormLabel>Complemento</FormLabel>
                <FormControl><Input {...field} /></FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="endereco.cep" render={({ field }) => (
              <FormItem>
                <FormLabel>CEP</FormLabel>
                <FormControl><Input {...field} /></FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="endereco.bairro" render={({ field }) => (
              <FormItem>
                <FormLabel>Bairro</FormLabel>
                <FormControl><Input {...field} /></FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="endereco.cond" render={({ field }) => (
              <FormItem>
                <FormLabel>Cond</FormLabel>
                <FormControl><Input {...field} /></FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="endereco.tempo" render={({ field }) => (
              <FormItem>
                <FormLabel>Tempo</FormLabel>
                <FormControl><Input {...field} /></FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="endereco.tipoMoradia" render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de moradia</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Propria">Própria</SelectItem>
                    <SelectItem value="Alugada">Alugada</SelectItem>
                    <SelectItem value="Cedida">Cedida</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>Se "Outro", descreva em Observações</FormDescription>
              </FormItem>
            )} />
            <FormField control={form.control} name="endereco.tipoMoradiaObs" render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Observações</FormLabel>
                <FormControl><Input {...field} /></FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="endereco.doPs" render={({ field }) => (
              <FormItem className="md:col-span-3">
                <FormLabel>Do PS</FormLabel>
                <FormControl><Input {...field} /></FormControl>
              </FormItem>
            )} />
          </div>
        </section>

        {/* 3. Relações de residência */}
        <section>
          <h3 className="text-lg font-semibold mb-3">3. Relações de residência</h3>
          <div className="grid gap-3 grid-cols-1 md:grid-cols-3">
            <FormField control={form.control} name="relacoes.unicaNoLote" render={({ field }) => (
              <FormItem>
                <FormLabel>Única no lote</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Sim">Sim</SelectItem>
                    <SelectItem value="Não">Não</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )} />
            <FormField control={form.control} name="relacoes.unicaNoLoteObs" render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Obs</FormLabel>
                <FormControl><Input {...field} /></FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="relacoes.comQuemReside" render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Com quem reside</FormLabel>
                <FormControl><Input {...field} /></FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="relacoes.nasOutras" render={({ field }) => (
              <FormItem>
                <FormLabel>Nas Outras</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Parentes">Parentes</SelectItem>
                    <SelectItem value="Locador(a)">Locador(a)</SelectItem>
                    <SelectItem value="Só conhecidos">Só conhecidos</SelectItem>
                    <SelectItem value="Não conhece">Não conhece</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )} />
            <FormField control={form.control} name="relacoes.temContrato" render={({ field }) => (
              <FormItem>
                <FormLabel>Tem contrato?</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Sim">Sim</SelectItem>
                    <SelectItem value="Não">Não</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )} />
            {temContrato === "Sim" && (
              <>
                <FormField control={form.control} name="relacoes.enviouContrato" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Enviou contrato?</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Sim">Sim</SelectItem>
                        <SelectItem value="Não">Não</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="relacoes.nomeDe" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome de</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </>
            )}
            <FormField control={form.control} name="relacoes.enviouComprovante" render={({ field }) => (
              <FormItem>
                <FormLabel>Enviou comprovante?</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Sim">Sim</SelectItem>
                    <SelectItem value="Não">Não</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )} />
            <FormField control={form.control} name="relacoes.tipoComprovante" render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de comprovante de endereço</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Energia">Energia</SelectItem>
                    <SelectItem value="Água">Água</SelectItem>
                    <SelectItem value="Internet">Internet</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )} />
            <FormField control={form.control} name="relacoes.nomeComprovante" render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Nome do comprovante</FormLabel>
                <FormControl><Input {...field} /></FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="relacoes.nomeLocador" render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do Locador(a)</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="relacoes.telefoneLocador" render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone</FormLabel>
                <FormControl><Input inputMode="tel" {...field} /></FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="relacoes.temInternetFixa" render={({ field }) => (
              <FormItem>
                <FormLabel>Tem internet fixa atualmente?</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Sim">Sim</SelectItem>
                    <SelectItem value="Não">Não</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )} />
            {form.watch("relacoes.temInternetFixa") === "Sim" && (
              <FormField control={form.control} name="relacoes.empresaInternet" render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Empresa</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            )}
            <FormField control={form.control} name="relacoes.observacoes" render={({ field }) => (
              <FormItem className="md:col-span-3">
                <FormLabel>Observações</FormLabel>
                <FormControl><Textarea rows={3} {...field} /></FormControl>
              </FormItem>
            )} />
          </div>
        </section>

        {/* 4. Emprego e Renda */}
        <section>
          <h3 className="text-lg font-semibold mb-3">4. Emprego e Renda</h3>
          <div className="grid gap-3 grid-cols-1 md:grid-cols-4">
            <FormField control={form.control} name="empregoRenda.profissao" render={({ field }) => (
              <FormItem>
                <FormLabel>Profissão</FormLabel>
                <FormControl><Input {...field} /></FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="empregoRenda.empresa" render={({ field }) => (
              <FormItem>
                <FormLabel>Empresa</FormLabel>
                <FormControl><Input {...field} /></FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="empregoRenda.vinculo" render={({ field }) => (
              <FormItem>
                <FormLabel>Vínculo</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Carteira Assinada">Carteira Assinada</SelectItem>
                    <SelectItem value="Presta Serviços">Presta Serviços</SelectItem>
                    <SelectItem value="Contrato de trabalho">Contrato de trabalho</SelectItem>
                    <SelectItem value="Autônomo">Autônomo</SelectItem>
                    <SelectItem value="Concursado">Concursado</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )} />
            <FormField control={form.control} name="empregoRenda.vinculoObs" render={({ field }) => (
              <FormItem>
                <FormLabel>Obs</FormLabel>
                <FormControl><Input {...field} /></FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="empregoRenda.doPs" render={({ field }) => (
              <FormItem className="md:col-span-3">
                <FormLabel>Do PS</FormLabel>
                <FormControl><Input {...field} /></FormControl>
              </FormItem>
            )} />
          </div>
        </section>

        {/* 5. Cônjuge */}
        <section>
          <h3 className="text-lg font-semibold mb-3">5. Cônjuge</h3>
          <div className="grid gap-3 grid-cols-1 md:grid-cols-3">
            <FormField control={form.control} name="conjuge.estadoCivil" render={({ field }) => (
              <FormItem>
                <FormLabel>Estado civil</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Solteiro(a)">Solteiro(a)</SelectItem>
                    <SelectItem value="Casado(a)">Casado(a)</SelectItem>
                    <SelectItem value="Amasiado(a)">Amasiado(a)</SelectItem>
                    <SelectItem value="Separado(a)">Separado(a)</SelectItem>
                    <SelectItem value="Viúvo(a)">Viúvo(a)</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )} />
            <FormField control={form.control} name="conjuge.nome" render={({ field }) => (
              <FormItem>
                <FormLabel>Nome</FormLabel>
                <FormControl><Input {...field} /></FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="conjuge.telefone" render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone</FormLabel>
                <FormControl><Input inputMode="tel" {...field} /></FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="conjuge.whatsapp" render={({ field }) => (
              <FormItem>
                <FormLabel>WhatsApp</FormLabel>
                <FormControl><Input inputMode="tel" {...field} /></FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="conjuge.cpf" render={({ field }) => (
              <FormItem>
                <FormLabel>CPF</FormLabel>
                <FormControl><Input {...field} /></FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="conjuge.naturalidade" render={({ field }) => (
              <FormItem>
                <FormLabel>Naturalidade</FormLabel>
                <FormControl><Input {...field} /></FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="conjuge.uf" render={({ field }) => (
              <FormItem>
                <FormLabel>UF</FormLabel>
                <FormControl><Input maxLength={2} {...field} /></FormControl>
              </FormItem>
            )} />
          </div>
        </section>

        {/* 6. Informações SPC */}
        <section>
          <h3 className="text-lg font-semibold mb-3">6. Informações SPC</h3>
          <FormField control={form.control} name="spc" render={({ field }) => (
            <FormItem>
              <FormControl><Textarea rows={4} {...field} placeholder="Quadro em branco" /></FormControl>
            </FormItem>
          )} />
        </section>

        {/* 7. Informações do Pesquisador */}
        <section>
          <h3 className="text-lg font-semibold mb-3">7. Informações do Pesquisador</h3>
          <FormField control={form.control} name="pesquisador" render={({ field }) => (
            <FormItem>
              <FormControl><Textarea rows={4} {...field} placeholder="Quadro em branco" /></FormControl>
            </FormItem>
          )} />
        </section>

        {/* 8. Filiação (< 45 anos) */}
        {showFiliacao && (
          <section>
            <h3 className="text-lg font-semibold mb-3">8. Filiação</h3>
            <div className="grid gap-3 grid-cols-1 md:grid-cols-3">
              <FormField control={form.control} name="filiacao.pai.nome" render={({ field }) => (
                <FormItem>
                  <FormLabel>Pai – Nome</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="filiacao.pai.reside" render={({ field }) => (
                <FormItem>
                  <FormLabel>Pai – Reside</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="filiacao.pai.telefone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Pai – Telefone</FormLabel>
                  <FormControl><Input inputMode="tel" {...field} /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="filiacao.mae.nome" render={({ field }) => (
                <FormItem>
                  <FormLabel>Mãe – Nome</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="filiacao.mae.reside" render={({ field }) => (
                <FormItem>
                  <FormLabel>Mãe – Reside</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                </FormItem>
              )} />
              <FormField control={form.control} name="filiacao.mae.telefone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Mãe – Telefone</FormLabel>
                  <FormControl><Input inputMode="tel" {...field} /></FormControl>
                </FormItem>
              )} />
            </div>
          </section>
        )}

        {/* 9. Referências pessoais */}
        <section>
          <h3 className="text-lg font-semibold mb-3">9. Referências pessoais</h3>
          <div className="grid gap-3 grid-cols-1 md:grid-cols-4">
            <FormField control={form.control} name="referencias.ref1.nome" render={({ field }) => (
              <FormItem>
                <FormLabel>Ref. 1 – Nome</FormLabel>
                <FormControl><Input {...field} /></FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="referencias.ref1.parentesco" render={({ field }) => (
              <FormItem>
                <FormLabel>Parentesco</FormLabel>
                <FormControl><Input {...field} /></FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="referencias.ref1.reside" render={({ field }) => (
              <FormItem>
                <FormLabel>Reside</FormLabel>
                <FormControl><Input {...field} /></FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="referencias.ref1.telefone" render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone</FormLabel>
                <FormControl><Input inputMode="tel" {...field} /></FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="referencias.ref2.nome" render={({ field }) => (
              <FormItem>
                <FormLabel>Ref. 2 – Nome</FormLabel>
                <FormControl><Input {...field} /></FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="referencias.ref2.parentesco" render={({ field }) => (
              <FormItem>
                <FormLabel>Parentesco</FormLabel>
                <FormControl><Input {...field} /></FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="referencias.ref2.reside" render={({ field }) => (
              <FormItem>
                <FormLabel>Reside</FormLabel>
                <FormControl><Input {...field} /></FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="referencias.ref2.telefone" render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone</FormLabel>
                <FormControl><Input inputMode="tel" {...field} /></FormControl>
              </FormItem>
            )} />
          </div>
        </section>

        {/* 10. Outras informações */}
        <section>
          <h3 className="text-lg font-semibold mb-3">10. Outras informações</h3>
          <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
            <FormField control={form.control} name="outras.planoEscolhido" render={({ field }) => (
              <FormItem>
                <FormLabel>Plano escolhido</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="A definir">A definir</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )} />
            <FormField control={form.control} name="outras.diaVencimento" render={({ field }) => (
              <FormItem>
                <FormLabel>Dia de vencimento</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="15">15</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )} />
            <FormField control={form.control} name="outras.svaAvulso" render={({ field }) => (
              <FormItem>
                <FormLabel>SVA Avulso</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="A definir">A definir</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )} />
            <FormField control={form.control} name="outras.carneImpresso" render={({ field }) => (
              <FormItem>
                <FormLabel>Carnê impresso?</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Sim">Sim</SelectItem>
                    <SelectItem value="Não">Não</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )} />
          </div>

        </section>


        {/* 12. Informações relevantes */}
        <section>
          <h3 className="text-lg font-semibold mb-3">11. Informações relevantes</h3>
          <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
            <FormField control={form.control} name="infoRelevantes.info" render={({ field }) => (
              <FormItem>
                <FormLabel>Informações relevantes</FormLabel>
                <FormControl><Textarea rows={4} {...field} placeholder="" /></FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="infoRelevantes.infoMk" render={({ field }) => (
              <FormItem>
                <FormLabel>Informações relevantes do MK</FormLabel>
                <FormControl><Textarea rows={4} {...field} placeholder="" /></FormControl>
              </FormItem>
            )} />
          </div>
          
          {/* Pareceres Section */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <FormLabel className="text-base font-medium">Pareceres da Análise</FormLabel>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addNovoParecer}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Novo Parecer
              </Button>
            </div>
            
            <div className="space-y-4">
              {pareceres.map((parecer) => (
                <div key={parecer.id} className="border rounded-lg p-4 relative">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-muted-foreground">
                      {parecer.author_name} · {parecer.author_role} · {formatDateTime(parecer.created_at)}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteParecer(parecer.id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      aria-label="Apagar parecer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <Textarea
                    value={parecer.text}
                    onChange={(e) => updateParecerText(parecer.id, e.target.value)}
                    placeholder="Escreva seu parecer..."
                    rows={3}
                    className="w-full"
                  />
                </div>
              ))}
              
              {pareceres.length === 0 && (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                  Nenhum parecer adicionado. Clique em "Novo Parecer" para começar.
                </div>
              )}
            </div>
          </div>
        </section>

        <div className="flex justify-end pt-6">
          <Button type="submit">
            {applicationId ? 'Salvar alterações' : 'Criar ficha'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
