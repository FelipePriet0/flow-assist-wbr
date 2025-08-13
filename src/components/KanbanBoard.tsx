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
import { Calendar as CalendarIcon, UserPlus, Search } from "lucide-react";
import ModalEditarFicha from "@/components/ui/ModalEditarFicha";
import NovaFichaComercialForm, { ComercialFormValues } from "@/components/NovaFichaComercialForm";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useAuth } from "@/context/AuthContext";
import { canChangeStatus, isPremium } from "@/lib/access";
import wbrLogo from "@/assets/wbr-logo.svg";
import mznetLogo from "@/assets/mznet-logo.svg";

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

export default function KanbanBoard() {
  const [cards, setCards] = useState<CardItem[]>(initialCards);
  const [query, setQuery] = useState("");
  const [responsavelFiltro, setResponsavelFiltro] = useState<string>("todos");
  const [prazoFiltro, setPrazoFiltro] = useState<PrazoFiltro>("todos");
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

    setCards((prev) =>
      prev.map((c) =>
        c.id === cardId
          ? {
              ...c,
              columnId: targetColumn,
              lastMovedAt: new Date().toISOString(),
            }
          : c
      )
    );
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

      return matchesQuery && matchesResp && matchesPrazo;
    });
  }, [cards, query, responsavelFiltro, prazoFiltro]);

  // New card creation handled by NovaFichaComercialForm component


  // Auto-alert re-render timer
  useEffect(() => {
    const t = setInterval(() => {
      // trigger rerender to update alert animation condition
      setCards((prev) => [...prev]);
    }, 60 * 1000);
    return () => clearInterval(t);
  }, []);

  // Actions for Em Análise
  function moveTo(cardId: string, target: ColumnId, label?: string) {
    setCards((prev) =>
      prev.map((c) => {
        if (c.id !== cardId) return c;
        const base = {
          ...c,
          columnId: target,
          lastMovedAt: new Date().toISOString(),
        };
        if (!label) return base;
        const cleaned = c.labels.filter((l) => l !== "Aprovado" && l !== "Negado");
        return { ...base, labels: Array.from(new Set([...cleaned, label])) };
      })
    );
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
          <div className="grid gap-4 md:grid-cols-3">
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
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="flex gap-2 flex-wrap">
              <Badge className="bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]">Em Análise</Badge>
              <Badge className="bg-[hsl(var(--success))] text-white">Aprovado</Badge>
              <Badge className="bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))]">Atrasado</Badge>
            </div>
            <Dialog open={openNew} onOpenChange={setOpenNew}>
              <DialogTrigger asChild>
                <Button variant="pill" size="xl" className="hover-scale" style={{ backgroundImage: "var(--gradient-primary)" }}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Nova ficha
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[800px]">
                <DialogHeader>
                  <DialogTitle>Nova ficha</DialogTitle>
                </DialogHeader>
                <NovaFichaComercialForm
                  onCancel={() => setOpenNew(false)}
                  onSubmit={(values: ComercialFormValues) => {
                    const id = Math.random().toString(36).slice(2)
                    const now = new Date()
                    const deadline = new Date(Date.now() + 1000 * 60 * 60 * 24)
                    const newCard: CardItem = {
                      id,
                      nome: values.cliente?.nome?.trim() || "Sem nome",
                      receivedAt: now.toISOString(),
                      deadline: deadline.toISOString(),
                      responsavel: undefined,
                      telefone: values.cliente?.tel || undefined,
                      score: undefined,
                      checks: { moradia: false, emprego: false, vinculos: false },
                      parecer: "",
                      columnId: "recebido",
                      createdAt: now.toISOString(),
                      updatedAt: now.toISOString(),
                      lastMovedAt: now.toISOString(),
                      companyId: profile?.company_id || undefined,
                      labels: [],
                    }
                    setCards((prev) => [newCard, ...prev])
                    setOpenNew(false)
                    toast({ title: "Nova ficha criada" })
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

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
                        <KanbanCard key={card.id} card={card} responsaveis={responsaveisOptions} currentUserName={currentUserName} onSetResponsavel={setResponsavel} onMove={moveTo} onOpen={openEdit} onDesingressar={unassignAndReturn} />
                      ))}
                  </ColumnDropArea>
                </SortableContext>
              </div>
            </div>
          ))}
        </div>
      </DndContext>
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
}: {
  card: CardItem;
  responsaveis: string[];
  currentUserName: string;
  onSetResponsavel: (id: string, resp: string) => void;
  onMove: (id: string, col: ColumnId, label?: string) => void;
  onOpen: (card: CardItem) => void;
  onDesingressar: (id: string) => void;
}) {
  const { profile } = useAuth();
  const allowDecide = canChangeStatus(profile);
  const premium = isPremium(profile);
  const overDue = isOverdue(card);
  const fireColumns = new Set<ColumnId>(["recebido", "em_analise", "reanalise", "aprovado"]);
  const msUntil = new Date(card.deadline).getTime() - Date.now();
  const onFire = fireColumns.has(card.columnId) && msUntil >= 0 && msUntil <= 24 * 60 * 60 * 1000;

  const COMPANY_MAP: Record<string, { name: string; src: string }> = {
    "38f31fb4-e7bc-44d8-9aaf-85ecaf69f514": { name: "WBR Net", src: wbrLogo },
    "c7ee5a75-8412-48a9-a30e-dac354a4af52": { name: "Mznet", src: mznetLogo },
  };
  const resolvedCompanyId = (card.companyId ?? profile?.company_id) || "";
  const companyLogo = COMPANY_MAP[resolvedCompanyId]?.src;
  const companyName = COMPANY_MAP[resolvedCompanyId]?.name ?? "Empresa";

  const displayLabels = overDue ? card.labels.filter((l) => l !== "Em Análise") : card.labels;

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
        overDue ? (premium ? "fire-border" : "ring-2 ring-[hsl(var(--destructive))]") : "",
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
        <div className="font-medium flex items-center gap-2">
          {companyLogo && (
            <img
              src={companyLogo}
              alt={`Logo ${companyName}`}
              className="h-5 w-5 rounded-sm"
              loading="lazy"
              width={20}
              height={20}
            />
          )}
          <span>{card.nome}</span>
        </div>
        {headerBadges}
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
