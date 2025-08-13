import { useMemo, useState, useEffect } from "react";
import {
  DndContext,
  DragEndEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Calendar as CalendarIcon, UserPlus, Search, Edit, User } from "lucide-react";
import ModalEditarFicha from "@/components/ui/ModalEditarFicha";
import NovaFichaComercialForm, { ComercialFormValues } from "@/components/NovaFichaComercialForm";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

// New secure ficha creation components
import { ConfirmCreateModal } from "@/components/ficha/ConfirmCreateModal";
import { BasicInfoModal, BasicInfoData } from "@/components/ficha/BasicInfoModal";
import { ExpandedFichaModal } from "@/components/ficha/ExpandedFichaModal";
import { DeleteConfirmDialog } from "@/components/ficha/DeleteConfirmDialog";
import { OptimizedKanbanCard } from "@/components/ficha/OptimizedKanbanCard";
import { RecoveryToast } from "@/components/ficha/RecoveryToast";
import { ParecerConfirmModal } from "@/components/ficha/ParecerConfirmModal";

import { useCurrentUser } from "@/hooks/use-current-user";
import { useAuth } from "@/context/AuthContext";
import { canChangeStatus, isPremium } from "@/lib/access";
import { supabase } from "@/integrations/supabase/client";

// Types
export type ColumnId =
  | "recebido"
  | "em_analise"
  | "reanalise"
  | "aprovado"
  | "negado_taxa"
  | "finalizado";

export interface CardItem {
  id: string;
  nome: string;
  receivedAt: string; // ISO
  deadline: string; // ISO
  responsavel?: string;
  telefone?: string;
  score?: number;
  checks: {
    moradia: boolean;
    emprego: boolean;
    vinculos: boolean;
  };
  parecer: string;
  columnId: ColumnId;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  lastMovedAt: string; // ISO
  labels: string[];
  companyId?: string;
  companyName?: string;
  companyLogoUrl?: string | null;
  assignedReanalyst?: string;
  reanalystName?: string;
  reanalystAvatarUrl?: string;
}


const COLUMNS: { id: ColumnId; title: string }[] = [
  { id: "recebido", title: "Recebido" },
  { id: "em_analise", title: "Em Análise" },
  { id: "reanalise", title: "Reanálise" },
  { id: "aprovado", title: "Aprovado" },
  { id: "negado_taxa", title: "Negado com taxa" },
  { id: "finalizado", title: "Finalizado" },
];

// Utils
function isWeekend(date: Date) {
  const d = date.getDay();
  return d === 0 || d === 6;
}

function businessHoursBetween(startISO: string, endISO: string) {
  let start = new Date(startISO);
  let end = new Date(endISO);
  if (end < start) return 0;

  // Count hours excluding weekends (approximation of "úteis")
  let hours = 0;
  const cursor = new Date(start);
  while (cursor < end) {
    if (!isWeekend(cursor)) {
      hours += 1;
    }
    cursor.setHours(cursor.getHours() + 1);
  }
  return hours;
}

function isOverdue(card: CardItem): boolean {
  const now = new Date();
  const nowISO = now.toISOString();
  if (card.columnId === "recebido" || card.columnId === "em_analise") {
    return businessHoursBetween(card.lastMovedAt || card.createdAt, nowISO) > 24;
  }
  if (card.columnId === "reanalise") {
    return businessHoursBetween(card.lastMovedAt || card.createdAt, nowISO) > 48;
  }
  return false;
}

// Demo initial data
const initialCards: CardItem[] = [
  {
    id: "1",
    nome: "João Silva",
    receivedAt: new Date().toISOString(),
    deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString(),
    responsavel: undefined,
    score: 720,
    checks: { moradia: true, emprego: true, vinculos: false },
    parecer: "",
    columnId: "recebido",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastMovedAt: new Date().toISOString(),
    labels: [],
  },
  {
    id: "2",
    nome: "Maria Souza",
    receivedAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    deadline: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    responsavel: "Bruno",
    score: 650,
    checks: { moradia: true, emprego: false, vinculos: true },
    parecer: "Documentos em validação.",
    columnId: "em_analise",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    updatedAt: new Date().toISOString(),
    lastMovedAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    labels: ["Em Análise"],
  },
];

const RESPONSAVEIS = ["Ana", "Bruno", "Carla", "Diego", "Equipe"];

type PrazoFiltro = "todos" | "hoje" | "atrasados";
type ViewFilter = "all" | "mine" | "company";

export default function KanbanBoard() {
  const [cards, setCards] = useState<CardItem[]>(initialCards);
  const [query, setQuery] = useState("");
  const [responsavelFiltro, setResponsavelFiltro] = useState<string>("todos");
  const [prazoFiltro, setPrazoFiltro] = useState<PrazoFiltro>("todos");
  const [viewFilter, setViewFilter] = useState<ViewFilter>("all");
  // Old state - kept for compatibility
  const [openNew, setOpenNew] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [editing, setEditing] = useState<{
    id: string;
    nome: string;
    telefone: string;
    responsavel?: string;
    parecer: string;
    recebido?: Date;
    prazo?: Date;
  } | null>(null);
  const [mockCard, setMockCard] = useState<CardItem | null>(null);
  const [reanalysts, setReanalysts] = useState<Array<{id: string; full_name: string; avatar_url?: string; company_id?: string}>>([]);

  // New secure creation flow state
  const [showConfirmCreate, setShowConfirmCreate] = useState(false);
  const [showBasicInfo, setShowBasicInfo] = useState(false);
  const [showExpandedForm, setShowExpandedForm] = useState(false);
  const [basicInfoData, setBasicInfoData] = useState<BasicInfoData | null>(null);
  const [pendingApplicationId, setPendingApplicationId] = useState<string | null>(null);
  
  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<CardItem | null>(null);
  
  // Parecer confirmation state
  const [showParecerConfirm, setShowParecerConfirm] = useState(false);
  const [parecerAction, setParecerAction] = useState<{
    action: 'aprovar' | 'negar' | 'reanalisar';
    card: CardItem;
  } | null>(null);

  const { name: currentUserName } = useCurrentUser();
  const { profile } = useAuth();
  const allowMove = canChangeStatus(profile);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  // Derived lists
  const responsaveisOptions = useMemo(() => {
    const set = new Set(cards.map((c) => c.responsavel).filter(Boolean) as string[]);
    RESPONSAVEIS.forEach((r) => set.add(r));
    return Array.from(set);
  }, [cards]);

  function handleDragEnd(event: DragEndEvent) {
    if (!allowMove) return;
    const { active, over } = event;
    if (!over) return;
    const cardId = active.id as string;
    const targetColumn = over.id as ColumnId;

    // Use the moveTo function that handles routing
    moveTo(cardId, targetColumn);
  }

  const filteredCards = useMemo(() => {
    return cards.filter((c) => {
      const matchesQuery = `${c.nome} ${c.responsavel ?? ""} ${c.parecer}`
        .toLowerCase()
        .includes(query.toLowerCase());

      const matchesResp =
        responsavelFiltro === "todos" || (c.responsavel ?? "") === responsavelFiltro;

      const deadlineDate = new Date(c.deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const isHoje =
        new Date(deadlineDate.getFullYear(), deadlineDate.getMonth(), deadlineDate.getDate()).getTime() ===
        today.getTime();
      const isAtrasado = deadlineDate < new Date();

      const matchesPrazo =
        prazoFiltro === "todos" || (prazoFiltro === "hoje" ? isHoje : isAtrasado);

      // View filter for reanalysts
      const matchesView = viewFilter === "all" || 
                         (viewFilter === "mine" && c.assignedReanalyst === profile?.id) ||
                         (viewFilter === "company" && c.companyId === profile?.company_id);

      return matchesQuery && matchesResp && matchesPrazo && matchesView;
    });
  }, [cards, query, responsavelFiltro, prazoFiltro, viewFilter, profile]);

// New card creation handled by NovaFichaComercialForm component
// Load applications from Supabase (with company and customer for logos and names)
useEffect(() => {
  let mounted = true;
  const load = async () => {
    try {
      const { data, error } = await supabase
        .from("applications")
        .select(`
          id,
          status,
          analyst_name,
          comments,
          received_at,
          due_at,
          created_at,
          company_id,
          assigned_reanalyst,
          companies:company_id ( name, logo_url ),
          customers:customer_id ( full_name, phone ),
          reanalyst:assigned_reanalyst ( full_name, avatar_url )
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (!mounted || !data) return;
      const mapped: CardItem[] = (data as any[]).map((row: any) => {
        const createdAt = row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString();
        const receivedAt = row.received_at ? new Date(row.received_at).toISOString() : createdAt;
        const deadline = row.due_at ? new Date(row.due_at).toISOString() : createdAt;
        const col = (row.status as ColumnId) ?? "recebido";
        return {
          id: row.id,
          nome: row.customers?.full_name ?? "Cliente",
          receivedAt,
          deadline,
          responsavel: row.analyst_name ?? undefined,
          telefone: row.customers?.phone ?? undefined,
          score: undefined,
          checks: { moradia: false, emprego: false, vinculos: false },
          parecer: row.comments ?? "",
          columnId: col,
          createdAt,
          updatedAt: createdAt,
          lastMovedAt: createdAt,
          labels: [],
          companyId: row.company_id ?? undefined,
          companyName: row.companies?.name ?? undefined,
          companyLogoUrl: row.companies?.logo_url ?? undefined,
          assignedReanalyst: row.assigned_reanalyst ?? undefined,
          reanalystName: row.reanalyst?.full_name ?? undefined,
          reanalystAvatarUrl: row.reanalyst?.avatar_url ?? undefined,
        } as CardItem;
      });
      setCards(mapped);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("[Kanban] Falha ao carregar aplicações", e);
    }
  };
  
  const loadReanalysts = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, company_id")
        .eq("role", "reanalista");

      if (error) throw error;
      setReanalysts(data || []);
    } catch (error) {
      console.error("Error loading reanalysts:", error);
    }
  };

  load();
  loadReanalysts();
  return () => {
    mounted = false;
  };
}, [profile?.id]);

  // Auto-alert re-render timer
  useEffect(() => {
    const t = setInterval(() => {
      // trigger rerender to update alert animation condition
      setCards((prev) => [...prev]);
    }, 60 * 1000);
    return () => clearInterval(t);
  }, []);

  // Actions for Em Análise - Enhanced with routing
  async function moveTo(cardId: string, target: ColumnId, label?: string) {
    try {
      const card = cards.find(c => c.id === cardId);
      if (!card) return;

      // Map frontend ColumnId to backend status values with proper typing
      const statusMap: Record<ColumnId, "aprovado" | "pendente" | "reanalisar" | "negado"> = {
        "recebido": "pendente",
        "em_analise": "pendente", 
        "reanalise": "reanalisar",
        "aprovado": "aprovado",
        "negado_taxa": "negado",
        "finalizado": "aprovado"
      };

      const backendStatus = statusMap[target];

      // Call the Supabase RPC to change status (if available)
      if (supabase.rpc && backendStatus) {
        const { error } = await supabase.rpc('applications_change_status', {
          p_app_id: cardId,
          p_new_status: backendStatus,
          p_comment: label || `Movido para ${target}`
        });

        if (error) {
          console.error("Error changing status:", error);
        }
      }

      // If status is one that requires reanalyst assignment, call routing
      if (['aprovado', 'negado_taxa', 'reanalise'].includes(target)) {
        try {
          const { data: assignedReanalyst, error: routeError } = await supabase.rpc('route_application', {
            p_app_id: cardId
          });

          if (routeError) {
            console.error("Error routing application:", routeError);
          } else if (assignedReanalyst) {
            const reanalyst = reanalysts.find(r => r.id === assignedReanalyst);
            toast({
              title: "Ficha atribuída",
              description: `Atribuída para ${reanalyst?.full_name || 'reanalista'}`,
            });
          } else {
            toast({
              title: "Sem responsável",
              description: "Nenhum reanalista disponível na empresa",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error("Error calling route_application:", error);
        }
      }

      // Update local state
      setCards(prev => prev.map(c => {
        if (c.id !== cardId) return c;
        const base = {
          ...c,
          columnId: target,
          lastMovedAt: new Date().toISOString(),
        };
        if (!label) return base;
        const cleaned = c.labels.filter((l) => l !== "Aprovado" && l !== "Negado");
        return { ...base, labels: Array.from(new Set([...cleaned, label])) };
      }));

      toast({
        title: "Status atualizado",
        description: `Ficha movida para ${target}`,
      });
    } catch (error) {
      console.error("Error moving card:", error);
      toast({
        title: "Erro",
        description: "Erro ao mover ficha",
        variant: "destructive",
      });
    }
  }

  function setResponsavel(cardId: string, resp: string) {
    setCards((prev) =>
      prev.map((c) => {
        if (c.id !== cardId) return c;
        const nextLabels = new Set(c.labels);
        if (resp) nextLabels.add("Em Análise");
        const isInRecebido = c.columnId === "recebido";
        return {
          ...c,
          responsavel: resp,
          labels: Array.from(nextLabels),
          columnId: allowMove && isInRecebido ? "em_analise" : c.columnId,
          lastMovedAt: allowMove && isInRecebido ? new Date().toISOString() : c.lastMovedAt,
        };
      })
    );
  }
  
  function unassignAndReturn(cardId: string) {
    console.log("unassignAndReturn called", cardId);
    setCards((prev) =>
      prev.map((c) => {
        if (c.id !== cardId) return c;
        return {
          ...c,
          responsavel: undefined,
          columnId: "recebido",
          labels: c.labels.filter((l) => l !== "Em Análise"),
          lastMovedAt: new Date().toISOString(),
        };
      })
    );
  }

  function openEdit(card: CardItem) {
    setMockCard(card);
  }

  const handleIngressar = async (card: CardItem) => {
    try {
      const { error } = await supabase
        .from('applications')
        .update({
          status: 'em_analise',
          analyst_id: profile?.id,
          analyst_name: profile?.full_name
        })
        .eq('id', card.id);

      if (error) throw error;
      
      // Reload the page to refresh data
      window.location.reload();
      
      toast({
        title: "Sucesso",
        description: "Ficha movida para Em Análise",
      });
    } catch (error) {
      console.error('Erro ao ingressar:', error);
      toast({
        title: "Erro",
        description: "Erro ao mover ficha",
        variant: "destructive",
      });
    }
  };

  const handleAprovar = async (card: CardItem, parecer: string) => {
    console.log("Aprovando card:", card.id, "parecer:", parecer);
    if (!parecer.trim()) {
      setParecerAction({ action: 'aprovar', card });
      setShowParecerConfirm(true);
      return;
    }
    
    try {
      const { error } = await supabase.rpc('applications_change_status', {
        p_app_id: card.id,
        p_new_status: 'aprovado',
        p_comment: parecer
      });

      if (error) throw error;
      
      // Reload page to get fresh data
      window.location.reload();

      toast({
        title: "Ficha aprovada",
        description: "Decisão registrada com sucesso",
      });
    } catch (error: any) {
      console.error('Erro ao aprovar:', error);
      toast({
        title: "Erro",
        description: `Erro ao aprovar ficha: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleNegar = async (card: CardItem, parecer: string) => {
    console.log("Negando card:", card.id, "parecer:", parecer);
    if (!parecer.trim()) {
      setParecerAction({ action: 'negar', card });
      setShowParecerConfirm(true);
      return;
    }
    
    try {
      const { error } = await supabase.rpc('applications_change_status', {
        p_app_id: card.id,
        p_new_status: 'negado',
        p_comment: parecer
      });

      if (error) throw error;
      
      // Reload page to get fresh data
      window.location.reload();

      toast({
        title: "Ficha negada",
        description: "Decisão registrada com sucesso",
      });
    } catch (error: any) {
      console.error('Erro ao negar:', error);
      toast({
        title: "Erro",
        description: `Erro ao negar ficha: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleReanalisar = async (card: CardItem, parecer: string) => {
    console.log("Reanalysando card:", card.id, "parecer:", parecer);
    if (!parecer.trim()) {
      setParecerAction({ action: 'reanalisar', card });
      setShowParecerConfirm(true);
      return;
    }
    
    try {
      const { error } = await supabase.rpc('applications_change_status', {
        p_app_id: card.id,
        p_new_status: 'reanalisar',
        p_comment: parecer
      });

      if (error) throw error;
      
      // Reload page to get fresh data
      window.location.reload();

      toast({
        title: "Enviado para reanálise",
        description: "Decisão registrada com sucesso",
      });
    } catch (error: any) {
      console.error('Erro ao reanalisar:', error);
      toast({
        title: "Erro",
        description: `Erro ao enviar para reanálise: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const confirmParecerAction = async () => {
    if (!parecerAction) return;
    
    const { action, card } = parecerAction;
    const parecer = card.parecer;
    
    setShowParecerConfirm(false);
    setParecerAction(null);
    
    // Executar a ação confirmada
    switch (action) {
      case 'aprovar':
        await handleAprovar(card, parecer);
        break;
      case 'negar':
        await handleNegar(card, parecer);
        break;
      case 'reanalisar':
        await handleReanalisar(card, parecer);
        break;
    }
  };

  function saveEdits() {
    if (!editing || !editing.parecer.trim()) {
      toast({ title: "Parecer do analista é obrigatório." });
      return;
    }
    setCards((prev) =>
      prev.map((c) =>
        c.id === editing.id
          ? {
              ...c,
              nome: editing.nome.trim(),
              telefone: editing.telefone || undefined,
              responsavel: editing.responsavel || undefined,
              parecer: editing.parecer.trim(),
              receivedAt: editing.recebido ? editing.recebido.toISOString() : c.receivedAt,
              deadline: editing.prazo ? editing.prazo.toISOString() : c.deadline,
              updatedAt: new Date().toISOString(),
            }
          : c
      )
    );
    setEditOpen(false);
    setEditing(null);
    toast({ title: "Alterações salvas" });
  }

  return (
    <section className="space-y-6 animate-fade-in">
      <Card className="shadow-md" style={{ boxShadow: "var(--shadow-elegant)" }}>
        <CardHeader>
          <CardTitle className="text-2xl">Fluxo de Análise – WBR Net</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Busca global (nome, parecer, responsável)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Label className="min-w-24">Responsável</Label>
              <Select value={responsavelFiltro} onValueChange={setResponsavelFiltro}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar" />
                </SelectTrigger>
                <SelectContent className="z-50">
                  <SelectItem value="todos">Todos</SelectItem>
                  {responsaveisOptions.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Label className="min-w-24">Prazo</Label>
              <Select value={prazoFiltro} onValueChange={(v: PrazoFiltro) => setPrazoFiltro(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Prazo" />
                </SelectTrigger>
                <SelectContent className="z-50">
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="hoje">Vence hoje</SelectItem>
                  <SelectItem value="atrasados">Atrasados</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {profile?.role === "reanalista" && (
              <div className="flex items-center gap-2">
                <Label className="min-w-24">Visualização</Label>
                <Select value={viewFilter} onValueChange={(v: ViewFilter) => setViewFilter(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Visualização" />
                  </SelectTrigger>
                  <SelectContent className="z-50">
                    <SelectItem value="all">Todas (empresa)</SelectItem>
                    <SelectItem value="mine">Minhas tarefas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="flex gap-2 flex-wrap">
              <Badge className="bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]">Em Análise</Badge>
              <Badge className="bg-[hsl(var(--success))] text-white">Aprovado</Badge>
              <Badge className="bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))]">Atrasado</Badge>
            </div>
            <Button 
              variant="pill" 
              size="xl" 
              className="hover-scale" 
              style={{ backgroundImage: "var(--gradient-primary)" }}
              onClick={() => setShowConfirmCreate(true)}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Nova ficha
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Legacy Dialog - Hidden */}
      <Dialog open={openNew} onOpenChange={setOpenNew}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Nova ficha</DialogTitle>
          </DialogHeader>
          <NovaFichaComercialForm
                  onCancel={() => setOpenNew(false)}
                  onSubmit={async (values: ComercialFormValues) => {
                    try {
                      // 1. Criar customer primeiro
                      const { data: customer, error: customerError } = await supabase
                        .from('customers')
                        .insert({
                          full_name: values.cliente.nome.trim(),
                          cpf: values.cliente.cpf,
                          phone: values.cliente.tel || null,
                          whatsapp: values.cliente.whats || null,
                          email: values.cliente.email || null,
                          birth_date: values.cliente.nasc ? new Date(values.cliente.nasc).toISOString().split('T')[0] : null,
                          birthplace: values.cliente.naturalidade || null,
                          birthplace_uf: values.cliente.uf || null,
                        })
                        .select()
                        .single();

                      if (customerError) throw customerError;

                      // 2. Criar application
                      const now = new Date();
                      const deadline = new Date(Date.now() + 1000 * 60 * 60 * 24);
                      
                      const { data: application, error: applicationError } = await supabase
                        .from('applications')
                        .insert({
                          customer_id: customer.id,
                          company_id: profile?.company_id || null,
                          created_by: profile?.id || null,
                          status: 'recebido',
                          due_at: deadline.toISOString().split('T')[0],
                          received_at: now.toISOString().split('T')[0],
                          comments: values.infoRelevantes?.info || null,
                        })
                        .select()
                        .single();

                      if (applicationError) throw applicationError;

                      // 3. Criar dados de endereço
                      if (values.endereco) {
                        await supabase.from('application_address').insert({
                          application_id: application.id,
                          street: values.endereco.end || null,
                          number: values.endereco.n || null,
                          complement: values.endereco.compl || null,
                          zipcode: values.endereco.cep || null,
                          neighborhood: values.endereco.bairro || null,
                          condo: values.endereco.cond || null,
                          city: null, // Não mapeado no form atual
                          state: null, // Não mapeado no form atual
                          housing_type: values.endereco.tipoMoradia || null,
                          housing_obs: values.endereco.tipoMoradiaObs || null,
                          household_with: values.relacoes?.comQuemReside || null,
                          others_relation: values.relacoes?.nasOutras || null,
                          has_contract: values.relacoes?.temContrato === 'Sim',
                          sent_contract: values.relacoes?.enviouContrato === 'Sim',
                          contract_named_to: values.relacoes?.nomeDe || null,
                          landlord_name: values.relacoes?.nomeLocador || null,
                          landlord_phone: values.relacoes?.telefoneLocador || null,
                          sent_proof: values.relacoes?.enviouComprovante === 'Sim',
                          proof_type: values.relacoes?.tipoComprovante || null,
                          proof_named_to: values.relacoes?.nomeComprovante || null,
                          has_fixed_internet: values.relacoes?.temInternetFixa === 'Sim',
                          fixed_internet_company: values.relacoes?.empresaInternet || null,
                        });
                      }

                      // 4. Criar dados de emprego
                      if (values.empregoRenda) {
                        await supabase.from('employment').insert({
                          application_id: application.id,
                          profession: values.empregoRenda.profissao || null,
                          company_name: values.empregoRenda.empresa || null,
                          employment_type: values.empregoRenda.vinculo || null,
                          employment_obs: values.empregoRenda.vinculoObs || null,
                          ctps: values.empregoRenda.vinculo === 'Carteira Assinada',
                        });
                      }

                      // 5. Criar dados do cônjuge se preenchidos
                      if (values.conjuge?.nome || values.conjuge?.cpf) {
                        await supabase.from('spouse').insert({
                          application_id: application.id,
                          full_name: values.conjuge.nome || null,
                          cpf: values.conjuge.cpf || null,
                          phone: values.conjuge.telefone || null,
                          whatsapp: values.conjuge.whatsapp || null,
                          birthplace: values.conjuge.naturalidade || null,
                          birthplace_uf: values.conjuge.uf || null,
                        });
                      }

                      // 6. Criar dados domiciliares
                      if (values.conjuge?.estadoCivil) {
                        await supabase.from('household').insert({
                          application_id: application.id,
                          marital_status: values.conjuge.estadoCivil,
                          family_links: true, // Padrão
                          family_links_obs: null,
                        });
                      }

                      // 7. Criar referências pessoais
                      const references = [];
                      if (values.referencias?.ref1?.nome) {
                        references.push({
                          application_id: application.id,
                          ref_name: values.referencias.ref1.nome,
                          relationship: values.referencias.ref1.parentesco || null,
                          lives_at: values.referencias.ref1.reside || null,
                          phone: values.referencias.ref1.telefone || null,
                        });
                      }
                      if (values.referencias?.ref2?.nome) {
                        references.push({
                          application_id: application.id,
                          ref_name: values.referencias.ref2.nome,
                          relationship: values.referencias.ref2.parentesco || null,
                          lives_at: values.referencias.ref2.reside || null,
                          phone: values.referencias.ref2.telefone || null,
                        });
                      }
                      if (references.length > 0) {
                        await supabase.from('references_personal').insert(references);
                      }

                      // 8. Criar card no estado local
                      const newCard: CardItem = {
                        id: application.id,
                        nome: customer.full_name,
                        receivedAt: now.toISOString(),
                        deadline: deadline.toISOString(),
                        responsavel: undefined,
                        telefone: customer.phone || undefined,
                        score: undefined,
                        checks: { moradia: false, emprego: false, vinculos: false },
                        parecer: application.comments || "",
                        columnId: "recebido",
                        createdAt: application.created_at,
                        updatedAt: application.created_at,
                        lastMovedAt: application.created_at,
                        companyId: application.company_id || undefined,
                        labels: [],
                      };

                      setCards((prev) => [newCard, ...prev]);
                      setOpenNew(false);
                      toast({ 
                        title: "Ficha criada com sucesso",
                        description: `Cliente ${customer.full_name} adicionado ao sistema.`
                      });

                    } catch (error) {
                      console.error('Erro ao criar ficha:', error);
                      toast({ 
                        title: "Erro ao criar ficha",
                        description: "Verifique os dados e tente novamente.",
                        variant: "destructive"
                      });
                    }
                  }}
                />
        </DialogContent>
      </Dialog>

      {mockCard && (
        <ModalEditarFicha
          card={mockCard}
          responsaveis={responsaveisOptions}
          onDesingressar={unassignAndReturn}
          onClose={() => setMockCard(null)}
          onSave={(form: any) => {
            setCards((prev) =>
              prev.map((c) =>
                c.id === (mockCard as CardItem).id
                  ? {
                      ...c,
                      nome: form.nome ?? c.nome,
                      telefone: form.telefone || undefined,
                      responsavel: form.responsavel || undefined,
                      deadline: form.agendamento ? new Date(form.agendamento).toISOString() : c.deadline,
                      receivedAt: c.columnId === "recebido" ? c.receivedAt : (form.recebido_em ? new Date(form.recebido_em).toISOString() : c.receivedAt),
                      updatedAt: new Date().toISOString(),
                    }
                  : c
              )
            );
            setMockCard(null);
          }}
        />
      )}

      <DndContext collisionDetection={closestCenter} sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {COLUMNS.map((col) => (
            <div key={col.id} className="rounded-xl border bg-card" id={col.id}>
              <div
                className="px-4 py-3 border-b flex items-center justify-between"
                style={{ backgroundImage: "var(--gradient-primary)", color: "hsl(var(--primary-foreground))" }}
              >
                <h2 className="font-semibold">{col.title}</h2>
                <Badge variant="secondary" className="bg-background text-foreground">
                  {filteredCards.filter((c) => c.columnId === col.id).length}
                </Badge>
              </div>
              <div className="p-3">
                <SortableContext
                  items={filteredCards.filter((c) => c.columnId === col.id).map((c) => c.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <ColumnDropArea columnId={col.id}>
                    {filteredCards
                      .filter((c) => c.columnId === col.id)
                       .map((card) => (
                           <OptimizedKanbanCard
                             key={card.id}
                             card={card}
                             isOverdue={isOverdue(card)}
                             allowMove={allowMove}
                             onEdit={openEdit}
                             onDelete={(card) => {
                               setCardToDelete(card);
                               setShowDeleteConfirm(true);
                             }}
                             onIngressar={handleIngressar}
                             onAprovar={handleAprovar}
                             onNegar={handleNegar}
                             onReanalisar={handleReanalisar}
                           />
                       ))}
                  </ColumnDropArea>
                </SortableContext>
              </div>
            </div>
          ))}
        </div>
      </DndContext>

      {/* New secure creation flow modals */}
      <ConfirmCreateModal
        open={showConfirmCreate}
        onClose={() => setShowConfirmCreate(false)}
        onConfirm={() => {
          setShowConfirmCreate(false);
          setShowBasicInfo(true);
        }}
      />

      <BasicInfoModal
        open={showBasicInfo}
        onClose={() => setShowBasicInfo(false)}
        onSubmit={async (data) => {
          setBasicInfoData(data);
          setShowBasicInfo(false);
          
          // Create minimal application first
          try {
            const { data: customer, error: customerError } = await supabase
              .from('customers')
              .insert({
                full_name: data.nome,
                cpf: data.cpf,
                phone: data.telefone,
                whatsapp: data.whatsapp || null,
                birth_date: data.nascimento.toISOString().split('T')[0],
                birthplace: data.naturalidade,
                birthplace_uf: data.uf,
                email: data.email || null,
              })
              .select()
              .single();

            if (customerError) throw customerError;

            const { data: application, error: appError } = await supabase
              .from('applications')
              .insert({
                customer_id: customer.id,
                status: 'recebido',
                is_draft: true,
              })
              .select()
              .single();

            if (appError) throw appError;

            setPendingApplicationId(application.id);
            setShowExpandedForm(true);
          } catch (error) {
            console.error('Error creating draft:', error);
            toast({
              title: "Erro ao criar ficha",
              description: "Tente novamente",
              variant: "destructive",
            });
          }
        }}
      />

      {basicInfoData && (
        <ExpandedFichaModal
          open={showExpandedForm}
          onClose={() => setShowExpandedForm(false)}
          onSubmit={async (data) => {
            // Complete application creation logic here
            setShowExpandedForm(false);
            toast({ title: "Ficha criada com sucesso!" });
            // Reload data
            window.location.reload();
          }}
          basicInfo={basicInfoData}
          applicationId={pendingApplicationId || undefined}
        />
      )}

      <DeleteConfirmDialog
        open={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setCardToDelete(null);
        }}
        onConfirm={async (reason) => {
          if (!cardToDelete) return;
          
          try {
            await supabase.rpc('delete_application_safely', {
              p_app_id: cardToDelete.id,
              p_reason: reason,
            });

            setCards(prev => prev.filter(c => c.id !== cardToDelete.id));
            toast({ title: "Ficha deletada com sucesso" });
          } catch (error) {
            console.error('Error deleting application:', error);
            toast({
              title: "Erro ao deletar ficha",
              variant: "destructive",
            });
          }
          
          setShowDeleteConfirm(false);
          setCardToDelete(null);
        }}
        customerName={cardToDelete?.nome || ''}
        customerCpf={cardToDelete?.telefone || ''}
      />

      <RecoveryToast
        onRecover={() => {
          setShowExpandedForm(true);
        }}
      />

      <ParecerConfirmModal
        isOpen={showParecerConfirm}
        onClose={() => {
          setShowParecerConfirm(false);
          setParecerAction(null);
        }}
        onConfirm={confirmParecerAction}
        action={parecerAction?.action || 'aprovar'}
        customerName={parecerAction?.card.nome || ''}
        parecer={parecerAction?.card.parecer}
      />
    </section>
  );
}

// Drop area
function ColumnDropArea({ columnId, children }: { columnId: ColumnId; children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({ id: columnId });
  return (
    <div ref={setNodeRef} id={columnId} className="min-h-[120px] space-y-3" data-droppable="true">
      {children}
    </div>
  );
}

// Card component
function KanbanCard({
  card,
  responsaveis,
  currentUserName,
  onSetResponsavel,
  onMove,
  onOpen,
  onDesingressar,
  reanalysts,
}: {
  card: CardItem;
  responsaveis: string[];
  currentUserName: string;
  onSetResponsavel: (id: string, resp: string) => void;
  onMove: (id: string, col: ColumnId, label?: string) => void;
  onOpen: (card: CardItem) => void;
  onDesingressar: (id: string) => void;
  reanalysts: Array<{id: string; full_name: string; avatar_url?: string; company_id?: string}>;
}) {
  const { profile } = useAuth();
  const allowDecide = canChangeStatus(profile);
  const premium = isPremium(profile);
  const overDue = isOverdue(card);
  const fireColumns = new Set<ColumnId>(["recebido", "em_analise", "reanalise", "aprovado"]);
  const msUntil = new Date(card.deadline).getTime() - Date.now();
  const onFire = fireColumns.has(card.columnId) && msUntil >= 0 && msUntil <= 24 * 60 * 60 * 1000;

  const companyName = card.companyName ?? "Empresa";
  const companyReanalysts = reanalysts.filter(r => r.company_id === card.companyId);

  const handleReassign = async (reanalystId: string) => {
    try {
      const { error } = await supabase.rpc('reassign_application', {
        p_app_id: card.id,
        p_reanalyst: reanalystId
      });

      if (error) throw error;

      const reanalyst = reanalysts.find(r => r.id === reanalystId);
      toast({
        title: "Reatribuição realizada",
        description: `Ficha atribuída para ${reanalyst?.full_name}`,
      });

      // Trigger reload of data
      window.location.reload();
    } catch (error) {
      console.error("Error reassigning application:", error);
      toast({
        title: "Erro",
        description: "Erro ao reatribuir ficha",
        variant: "destructive",
      });
    }
  };

  const displayLabels = premium ? card.labels.filter((l) => l !== "Em Análise") : card.labels;

  const headerBadges = (
    <div className="flex gap-2 flex-wrap">
      {displayLabels.map((l) => (
        <Badge key={l} variant="secondary">
          {l}
        </Badge>
      ))}
      {overDue && (
        <Badge className="bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))] animate-alert-pulse">
          Atrasado
        </Badge>
      )}
    </div>
  );

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: card.id, disabled: !allowDecide });
  const dragStyle = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;

  function handleCardClick(e: React.MouseEvent) {
    if (isDragging) return;
    const target = e.target as HTMLElement;
    if (target.closest('[data-ignore-card-click],button,select,input,textarea,[role="menuitem"]')) return;
    onOpen(card);
  }

  return (
    <div
      ref={setNodeRef}
      id={card.id}
      {...listeners}
      {...attributes}
      onClick={handleCardClick}
      className={cn(
        "kanban-card rounded-xl border bg-card shadow-sm hover-scale",
        allowDecide ? "cursor-grab active:cursor-grabbing" : "cursor-default select-none",
        overDue ? "ring-2 ring-[hsl(var(--destructive))]" : "",
        onFire ? "card-on-fire animate-fire-flicker" : "",
        isDragging ? "dragging opacity-80" : ""
      )}
      style={{ transition: "var(--transition-smooth)", ...dragStyle }}
    >
      {onFire && (
        <>
          <div className="fire-overlay" aria-hidden />
          <div className="corner-flame" aria-hidden />
        </>
      )}

<div className="p-3 border-b flex items-center justify-between">
  <div className="flex items-center gap-2">
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {card.companyLogoUrl ? (
            <img
              src={card.companyLogoUrl}
              alt={`Logo da empresa ${companyName}`}
              width={24}
              height={24}
              loading="lazy"
              className="h-6 w-6 rounded-sm object-contain"
            />
          ) : (
            <div
              className="h-6 w-6 flex items-center justify-center rounded-sm border bg-muted text-base"
              aria-label={`Empresa: ${companyName}`}
            >
              🏢
            </div>
          )}
        </TooltipTrigger>
        <TooltipContent>Empresa: {companyName}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
    <div className="font-medium">{card.nome}</div>
  </div>
  <div className="flex items-center gap-1">
    {premium && card.assignedReanalyst && companyReanalysts.length > 0 && (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" data-ignore-card-click>
            <Edit className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {companyReanalysts.map((reanalyst) => (
            <DropdownMenuItem
              key={reanalyst.id}
              onClick={() => handleReassign(reanalyst.id)}
            >
              {reanalyst.full_name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )}
    {headerBadges}
  </div>
</div>
      <div className="p-3 relative flex flex-col gap-2">
        <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
          <div>
            <span className="font-medium text-foreground">Recebido: </span>
            {format(new Date(card.receivedAt), "dd/MM/yyyy")}
          </div>
          <div>
            <span className="font-medium text-foreground">Prazo: </span>
            {format(new Date(card.deadline), "dd/MM/yyyy")}
          </div>
          <div>
            <span className="font-medium text-foreground">Score: </span>
            {card.score ?? "—"}
          </div>
          <div>
            <span className="font-medium text-foreground">Resp.: </span>
            {card.responsavel ?? "—"}
          </div>
        </div>

        {/* Reanalyst Assignment Display */}
        {card.assignedReanalyst && (
          <div className="flex items-center gap-2 text-sm">
            <Avatar className="w-5 h-5">
              <AvatarImage src={card.reanalystAvatarUrl} />
              <AvatarFallback className="text-[10px]">
                {card.reanalystName?.charAt(0) || <User className="w-3 h-3" />}
              </AvatarFallback>
            </Avatar>
            <span className="text-foreground font-medium">Reanalista: </span>
            <span className="text-muted-foreground">{card.reanalystName || 'Reanalista'}</span>
          </div>
        )}

        {/* No Reanalyst Warning */}
        {!card.assignedReanalyst && ['aprovado', 'negado_taxa', 'reanalise'].includes(card.columnId) && (
          <div className="flex items-center gap-2">
            <Badge variant="destructive" className="text-[10px] px-1 py-0">
              Sem responsável
            </Badge>
            {premium && companyReanalysts.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-5 text-[10px] px-1" data-ignore-card-click>
                    Atribuir
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {companyReanalysts.map((reanalyst) => (
                    <DropdownMenuItem
                      key={reanalyst.id}
                      onClick={() => handleReassign(reanalyst.id)}
                    >
                      {reanalyst.full_name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
          <Badge variant={card.checks.moradia ? "default" : "secondary"}>Moradia</Badge>
          <Badge variant={card.checks.emprego ? "default" : "secondary"}>Emprego</Badge>
          <Badge variant={card.checks.vinculos ? "default" : "secondary"}>Vínculos</Badge>
        </div>
        <div className="text-sm">
          <span className="font-medium">Parecer: </span>
          <span className="text-muted-foreground">{card.parecer || "—"}</span>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-sm" data-ignore-card-click>Responsável</Label>
          <Select value={card.responsavel} onValueChange={(v) => onSetResponsavel(card.id, v)}>
            <SelectTrigger className="h-8" data-ignore-card-click disabled={!allowDecide}>
              <SelectValue placeholder="Atribuir" />
            </SelectTrigger>
            <SelectContent className="z-50">
              {responsaveis.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {card.columnId === "em_analise" && allowDecide && (
          <>
            <div className="pt-2 flex gap-2">
              <Button size="sm" onClick={() => onMove(card.id, "aprovado")} data-ignore-card-click>
                Aprovar
              </Button>
              <Button size="sm" variant="destructive" onClick={() => onMove(card.id, "negado_taxa")} data-ignore-card-click>
                Negar
              </Button>
              <Button size="sm" variant="secondary" onClick={() => onMove(card.id, "reanalise")} data-ignore-card-click>
                Reanalisar
              </Button>
            </div>
          </>
        )}
        {card.columnId === "recebido" && (
          <div className="sticky bottom-0 -mx-3 px-3 pt-2 border-t bg-gradient-to-t from-background/90 to-background/0">
            <div className="flex gap-2">
              <Button
                size="sm"
                disabled={!allowDecide}
                onClick={() => {
                  onSetResponsavel(card.id, currentUserName);
                  toast({ title: "Ingresso efetuado" });
                }}
                data-ignore-card-click
              >
                Ingressar
              </Button>
            </div>
          </div>
        )}
        {card.columnId === "reanalise" && allowDecide && (
          <div className="sticky bottom-0 -mx-3 px-3 pt-2 border-t bg-gradient-to-t from-background/90 to-background/0">
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => {
                  if (!card.parecer || !card.parecer.trim()) {
                    toast({
                      title: "Preencha o Parecer antes de decidir.",
                      action: (
                        <ToastAction altText="Abrir card" onClick={() => onOpen(card)}>
                          Abrir card
                        </ToastAction>
                      ),
                    });
                    return;
                  }
                  onMove(card.id, "aprovado", "Aprovado");
                }}
                data-ignore-card-click
              >
                Aprovar
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  if (!card.parecer || !card.parecer.trim()) {
                    toast({
                      title: "Preencha o Parecer antes de decidir.",
                      action: (
                        <ToastAction altText="Abrir card" onClick={() => onOpen(card)}>
                          Abrir card
                        </ToastAction>
                      ),
                    });
                    return;
                  }
                  onMove(card.id, "negado_taxa", "Negado");
                }}
                data-ignore-card-click
              >
                Negar
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}