import { AgendaItem, Cidade, Etiqueta, Tecnico } from "@/components/agenda/types";

const STORAGE_KEY = "agenda:items";

function read(): AgendaItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function write(items: AgendaItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export async function getAgenda(weekStartISO: string): Promise<AgendaItem[]> {
  const all = read();
  // Filter by week start (Mon..Sat of that week)
  const start = new Date(weekStartISO);
  const days = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
  return all.filter((i) => days.includes(i.dia));
}

export async function createAgenda(item: Omit<AgendaItem, "id">): Promise<AgendaItem> {
  const items = read();
  const id = crypto.randomUUID();
  const newItem: AgendaItem = { id, ...item };
  items.push(newItem);
  write(items);
  return newItem;
}

export async function updateAgenda(id: string, patch: Partial<AgendaItem>): Promise<AgendaItem | null> {
  const items = read();
  const idx = items.findIndex((i) => i.id === id);
  if (idx === -1) return null;
  items[idx] = { ...items[idx], ...patch };
  write(items);
  return items[idx];
}

export async function deleteAgenda(id: string): Promise<boolean> {
  const items = read();
  const next = items.filter((i) => i.id !== id);
  write(next);
  return next.length !== items.length;
}

export const TECNICOS: Tecnico[] = [
  "Alessandro",
  "Fabio",
  "Gustavo",
  "Jorge",
  "Matheus",
  "Cássio",
  "Italo",
  "Francisco",
];

export const CIDADES: Cidade[] = [
  "Cruzeiro da Fortaleza",
  "Patrocínio",
  "Guimarânia",
  "Tejuco",
  "São João da Serra Negra",
  "Salitre de Minas",
  "Serra do Salitre",
  "Zona Rural",
];

export const ETIQUETAS: Etiqueta[] = [
  "Aprovado",
  "Mud End + Manutenção",
  "Já instalados",
  "Negados",
  "Reanálise",
  "Salitre/Serra/Tejuco",
  "Guimarânia/São João/Cruzeiro",
  "Zona Rural",
];

export const TIMES = ["08:30", "10:30", "13:30", "15:30"] as const;

export function etiquetaColorVar(et: Etiqueta): string {
  switch (et) {
    case "Aprovado":
      return "--agenda-tag-approved";
    case "Mud End + Manutenção":
      return "--agenda-tag-maintenance";
    case "Já instalados":
      return "--agenda-tag-installed";
    case "Negados":
      return "--agenda-tag-denied";
    case "Reanálise":
      return "--agenda-tag-reanalysis";
    case "Salitre/Serra/Tejuco":
      return "--agenda-tag-orange-cities";
    case "Guimarânia/São João/Cruzeiro":
      return "--agenda-tag-purple-cities";
    case "Zona Rural":
      return "--agenda-tag-rural";
  }
}

export function suggestEtiqueta(cidade: Cidade): Etiqueta | null {
  if (["Salitre de Minas", "Tejuco", "Serra do Salitre"].includes(cidade))
    return "Salitre/Serra/Tejuco";
  if (["Guimarânia", "São João da Serra Negra", "Cruzeiro da Fortaleza"].includes(cidade))
    return "Guimarânia/São João/Cruzeiro";
  if (cidade === "Zona Rural") return "Zona Rural";
  return null;
}
