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
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Calendar as CalendarIcon, UserPlus, Search } from "lucide-react";

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

  // New card form state
  const [novoNome, setNovoNome] = useState("");
  const [novoTelefone, setNovoTelefone] = useState("");
  const [novoScore, setNovoScore] = useState<number | undefined>(undefined);
  const [novoResp, setNovoResp] = useState<string | undefined>(undefined);
  const [novoParecer, setNovoParecer] = useState("");
  const [novoRecebido, setNovoRecebido] = useState<Date | undefined>(new Date());
  const [novoPrazo, setNovoPrazo] = useState<Date | undefined>(
    new Date(Date.now() + 1000 * 60 * 60 * 24)
  );
  const [novoChecks, setNovoChecks] = useState({ moradia: false, emprego: false, vinculos: false });

  function addCard() {
    if (!novoNome.trim() || !novoParecer.trim() || !novoRecebido || !novoPrazo) {
      toast({ title: "Preencha todos os campos obrigatórios." });
      return;
    }

    const id = Math.random().toString(36).slice(2);
    const hasResp = Boolean(novoResp);
    const columnId: ColumnId = hasResp ? "em_analise" : "recebido";

    const newCard: CardItem = {
      id,
      nome: novoNome.trim(),
      receivedAt: novoRecebido.toISOString(),
      deadline: novoPrazo.toISOString(),
      responsavel: novoResp || undefined,
      telefone: novoTelefone || undefined,
      score: novoScore,
      checks: { ...novoChecks },
      parecer: novoParecer.trim(),
      columnId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastMovedAt: new Date().toISOString(),
      labels: hasResp ? ["Em Análise"] : [],
    };

    setCards((prev) => [newCard, ...prev]);
    setOpenNew(false);
    // reset
    setNovoNome("");
    setNovoTelefone("");
    setNovoScore(undefined);
    setNovoResp(undefined);
    setNovoParecer("");
    setNovoRecebido(new Date());
    setNovoPrazo(new Date(Date.now() + 1000 * 60 * 60 * 24));
    setNovoChecks({ moradia: false, emprego: false, vinculos: false });

    toast({ title: "Nova ficha criada" });
  }

  // Auto-alert re-render timer
  useEffect(() => {
    const t = setInterval(() => {
      // trigger rerender to update alert animation condition
      setCards((prev) => [...prev]);
    }, 60 * 1000);
    return () => clearInterval(t);
  }, []);

  // Actions for Em Análise
  function moveTo(cardId: string, target: ColumnId) {
    setCards((prev) =>
      prev.map((c) =>
        c.id === cardId
          ? { ...c, columnId: target, lastMovedAt: new Date().toISOString() }
          : c
      )
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
          columnId: isInRecebido ? "em_analise" : c.columnId,
          lastMovedAt: new Date().toISOString(),
        };
      })
    );
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
                <Button className="hover-scale" style={{ backgroundImage: "var(--gradient-primary)" }}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Nova ficha
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[640px]">
                <DialogHeader>
                  <DialogTitle>Nova ficha</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Nome do cliente</Label>
                    <Input value={novoNome} onChange={(e) => setNovoNome(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Telefone</Label>
                    <Input
                      type="tel"
                      inputMode="tel"
                      value={novoTelefone}
                      onChange={(e) => setNovoTelefone(e.target.value)}
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Responsável</Label>
                    <Select value={novoResp} onValueChange={setNovoResp}>
                      <SelectTrigger>
                        <SelectValue placeholder="Atribuir" />
                      </SelectTrigger>
                      <SelectContent className="z-50">
                        {RESPONSAVEIS.map((r) => (
                          <SelectItem key={r} value={r}>
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Recebido em</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="justify-start font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {novoRecebido ? format(novoRecebido, "dd/MM/yyyy") : "Selecionar"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={novoRecebido}
                          onSelect={setNovoRecebido}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label>Prazo de agendamento</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="justify-start font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {novoPrazo ? format(novoPrazo, "dd/MM/yyyy") : "Selecionar"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={novoPrazo}
                          onSelect={setNovoPrazo}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="col-span-1 md:col-span-2 space-y-2">
                    <Label>Parecer do analista (obrigatório)</Label>
                    <Input value={novoParecer} onChange={(e) => setNovoParecer(e.target.value)} placeholder="Descreva o parecer" />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={addCard}>Criar ficha</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      <DndContext collisionDetection={closestCenter} sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {COLUMNS.map((col) => (
            <div key={col.id} className="rounded-lg border bg-card" id={col.id}>
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
                        <KanbanCard key={card.id} card={card} onSetResponsavel={setResponsavel} onMove={moveTo} />
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
  onSetResponsavel,
  onMove,
}: {
  card: CardItem;
  onSetResponsavel: (id: string, resp: string) => void;
  onMove: (id: string, col: ColumnId) => void;
}) {
  const overDue = isOverdue(card);
  const headerBadges = (
    <div className="flex gap-2 flex-wrap">
      {card.labels.map((l) => (
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

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: card.id });
  const dragStyle = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;

  return (
    <div
      ref={setNodeRef}
      id={card.id}
      {...listeners}
      {...attributes}
      className={cn(
        "rounded-lg border bg-card shadow-sm hover-scale cursor-grab active:cursor-grabbing",
        overDue ? "ring-2 ring-[hsl(var(--destructive))]" : "",
        isDragging ? "opacity-80" : ""
      )}
      style={{ transition: "var(--transition-smooth)", ...dragStyle }}
    >
      <div className="p-3 border-b flex items-center justify-between">
        <div className="font-medium">{card.nome}</div>
        {headerBadges}
      </div>
      <div className="p-3 space-y-2">
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
          <Label className="text-sm">Responsável</Label>
          <Select value={card.responsavel} onValueChange={(v) => onSetResponsavel(card.id, v)}>
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Atribuir" />
            </SelectTrigger>
            <SelectContent className="z-50">
              {RESPONSAVEIS.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {card.columnId === "em_analise" && (
          <div className="pt-2 flex gap-2">
            <Button size="sm" onClick={() => onMove(card.id, "aprovado")}>
              Aprovar
            </Button>
            <Button size="sm" variant="destructive" onClick={() => onMove(card.id, "negado_taxa")}>Negar</Button>
            <Button size="sm" variant="secondary" onClick={() => onMove(card.id, "reanalise")}>
              Reanalisar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
