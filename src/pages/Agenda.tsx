import * as React from "react";
import { useSearchParams } from "react-router-dom";
import { format } from "date-fns/format";
import { addDays } from "date-fns/addDays";
import { startOfWeek } from "date-fns/startOfWeek";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { KanbanSquare, ChevronLeft, ChevronRight, CalendarDays, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AgendaItem, Etiqueta } from "@/components/agenda/types";
import { AgendaModal } from "@/components/agenda/AgendaModal";
import { CIDADES, ETIQUETAS, TECNICOS, TIMES, etiquetaColorVar, getAgenda, createAgenda, updateAgenda, deleteAgenda } from "@/services/agendaApi";
import { useQuery, useQueryClient } from "@tanstack/react-query";

function monday(date: Date) {
  return startOfWeek(date, { weekStartsOn: 1 });
}

function toISO(d: Date) {
  return d.toISOString().slice(0, 10);
}

function useWeekState() {
  const [params, setParams] = useSearchParams();
  const initial = params.get("week");
  const [weekStart, setWeekStart] = React.useState(() => initial ? new Date(initial) : monday(new Date()));

  React.useEffect(() => {
    setParams((p) => {
      const np = new URLSearchParams(p);
      np.set("week", toISO(weekStart));
      return np;
    }, { replace: true });
  }, [weekStart, setParams]);

  return { weekStart, setWeekStart };
}

const daysLabels = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

function DayHeader({ date, items }: { date: Date; items: AgendaItem[] }) {
  const iso = toISO(date);
  const manutCount = items.filter((i) => i.dia === iso && i.manutencao).length;
  return (
    <div className="px-2 py-2 text-sm font-medium flex items-center justify-between">
      <span>{daysLabels[date.getDay() - 1]} • {format(date, "dd/MM")}</span>
      <span className="text-xs text-muted-foreground">Manutenção (Azul): {manutCount}</span>
    </div>
  );
}

function Cell({ dayISO, time, items, onNew, onEdit }: {
  dayISO: string;
  time: string;
  items: AgendaItem[];
  onNew: () => void;
  onEdit: (it: AgendaItem) => void;
}) {
  return (
    <div className="min-h-[88px] rounded-lg border p-2 hover:bg-muted/40 transition" onClick={onNew}>
      <div className="flex flex-col gap-2">
        {items.map((it) => (
          <div
            key={it.id}
            className="rounded-md px-2 py-1 text-xs cursor-pointer shadow-sm"
            style={{ backgroundColor: `hsl(var(${etiquetaColorVar(it.etiqueta)}))` }}
            onClick={(e) => { e.stopPropagation(); onEdit(it); }}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">{it.cliente}</span>
              <span>{it.tecnico}</span>
            </div>
            <div className="opacity-80 flex items-center justify-between">
              <span>{it.cidade}</span>
              <span>{time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Agenda() {
  React.useEffect(() => {
    document.title = "Agenda – WBR Net";
  }, []);

  const { weekStart, setWeekStart } = useWeekState();
  const weekDays = React.useMemo(() => Array.from({ length: 6 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const weekISO = toISO(weekStart);

  const qc = useQueryClient();
  const { data: items = [] } = useQuery({
    queryKey: ["agenda", weekISO],
    queryFn: () => getAgenda(weekISO),
  });

  const [filterTec, setFilterTec] = React.useState<string>("Todos");
  const [filterCid, setFilterCid] = React.useState<string>("Todas");
  const [filterTags, setFilterTags] = React.useState<Etiqueta[]>([]);

  const filtered = items.filter((i) => {
    const byTec = filterTec === "Todos" || i.tecnico === filterTec;
    const byCid = filterCid === "Todas" || i.cidade === filterCid;
    const byTag = filterTags.length === 0 || filterTags.includes(i.etiqueta);
    return byTec && byCid && byTag;
  });

  const [modalOpen, setModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<AgendaItem | null>(null);
  const [targetSlot, setTargetSlot] = React.useState<{ dia: string; horario: string } | null>(null);

  function openNew(dayISO: string, time: string) {
    setEditing(null);
    setTargetSlot({ dia: dayISO, horario: time });
    setModalOpen(true);
  }
  function openEdit(it: AgendaItem) {
    setEditing(it);
    setTargetSlot({ dia: it.dia, horario: it.horario });
    setModalOpen(true);
  }

  async function handleSubmit(data: Omit<AgendaItem, "id">) {
    if (editing) {
      await updateAgenda(editing.id, data);
    } else {
      await createAgenda(data);
    }
    await qc.invalidateQueries({ queryKey: ["agenda", weekISO] });
  }

  async function handleDelete() {
    if (!editing) return;
    await deleteAgenda(editing.id);
    setModalOpen(false);
    await qc.invalidateQueries({ queryKey: ["agenda", weekISO] });
  }

  function onDragEnd(_ev: DragEndEvent) {
    // DnD enhancement could be added here; keeping simple per scope time
  }

  const dayISOList = weekDays.map(toISO);

  return (
    <div className="min-h-screen bg-background">
      <header className="pt-6 pb-3 border-b">
        <div className="container flex items-center gap-3">
          <CalendarDays className="h-5 w-5" />
          <h1 className="text-2xl font-bold tracking-tight">Agenda semanal</h1>
        </div>
      </header>

      <main className="container py-6 space-y-4">
        <section aria-label="Controles da agenda" className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => setWeekStart(addDays(weekStart, -7))}><ChevronLeft className="h-4 w-4" /> Semana anterior</Button>
          <Button variant="outline" onClick={() => setWeekStart(monday(new Date()))}>Hoje</Button>
          <Button variant="outline" onClick={() => setWeekStart(addDays(weekStart, 7))}>Próxima semana <ChevronRight className="h-4 w-4" /></Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="ml-2"><CalendarDays className="mr-2 h-4 w-4" /> {format(weekStart, "dd/MM/yyyy")}</Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={weekStart}
                onSelect={(d) => d && setWeekStart(monday(d))}
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>

          <div className="ml-auto flex items-center gap-2">
            <KanbanSquare className="h-4 w-4 opacity-50" />
            <span className="text-sm text-muted-foreground">Filtros</span>
          </div>

          <Select value={filterTec} onValueChange={setFilterTec}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Técnico" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todos</SelectItem>
              {TECNICOS.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterCid} onValueChange={setFilterCid}>
            <SelectTrigger className="w-[240px]"><SelectValue placeholder="Cidade" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Todas">Todas</SelectItem>
              {CIDADES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline"><Filter className="mr-2 h-4 w-4" /> Etiquetas</Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <div className="grid gap-2">
                {ETIQUETAS.map((e) => {
                  const checked = filterTags.includes(e);
                  return (
                    <label key={e} className="flex items-center gap-2 text-sm">
                      <Checkbox checked={checked} onCheckedChange={(v) => {
                        const val = Boolean(v);
                        setFilterTags((prev) =>
                          val ? [...prev, e] : prev.filter((x) => x !== e)
                        );
                      }} />
                      <span className="inline-flex items-center gap-2">
                        <span className="inline-block h-3 w-3 rounded" style={{ backgroundColor: `hsl(var(${etiquetaColorVar(e)}))` }} />
                        {e}
                      </span>
                    </label>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>
        </section>

        <section aria-label="Grade semanal" className="overflow-auto">
          <DndContext onDragEnd={onDragEnd}>
            <div className="grid" style={{ gridTemplateColumns: `120px repeat(${dayISOList.length}, 1fr)` }}>
              {/* Header row */}
              <div></div>
              {weekDays.map((d) => (
                <Card key={toISO(d)} className="rounded-xl shadow-sm">
                  <DayHeader date={d} items={filtered} />
                </Card>
              ))}

              {/* Time rows */}
              {TIMES.map((time) => (
                <React.Fragment key={time}>
                  <div className="py-6 pr-3 text-right text-sm text-muted-foreground">{time}</div>
                  {weekDays.map((d) => {
                    const iso = toISO(d);
                    const list = filtered.filter((i) => i.dia === iso && i.horario === time);
                    return (
                      <div key={iso + time} className="p-2">
                        <Cell
                          dayISO={iso}
                          time={time}
                          items={list}
                          onNew={() => openNew(iso, time)}
                          onEdit={openEdit}
                        />
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </DndContext>
        </section>

        {/* Legend */}
        <footer className="sticky bottom-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t py-2">
          <div className="flex flex-wrap gap-4 text-sm">
            {ETIQUETAS.map((e) => (
              <span key={e} className="inline-flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded" style={{ backgroundColor: `hsl(var(${etiquetaColorVar(e)}))` }} />
                {e}
              </span>
            ))}
          </div>
        </footer>
      </main>

      {targetSlot && (
        <AgendaModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          initial={{ ...editing, dia: targetSlot.dia, horario: targetSlot.horario }}
          onSubmit={handleSubmit}
          onDelete={editing ? handleDelete : undefined}
        />
      )}
    </div>
  );
}
