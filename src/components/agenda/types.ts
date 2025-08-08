export type Tecnico =
  | "Alessandro"
  | "Fabio"
  | "Gustavo"
  | "Jorge"
  | "Matheus"
  | "Cássio"
  | "Italo"
  | "Francisco";

export type Cidade =
  | "Cruzeiro da Fortaleza"
  | "Patrocínio"
  | "Guimarânia"
  | "Tejuco"
  | "São João da Serra Negra"
  | "Salitre de Minas"
  | "Serra do Salitre"
  | "Zona Rural";

export type Etiqueta =
  | "Aprovado"
  | "Mud End + Manutenção"
  | "Já instalados"
  | "Negados"
  | "Reanálise"
  | "Salitre/Serra/Tejuco"
  | "Guimarânia/São João/Cruzeiro"
  | "Zona Rural";

export interface AgendaItem {
  id: string;
  cliente: string;
  telefone?: string;
  cidade: Cidade;
  tecnico: Tecnico;
  etiqueta: Etiqueta;
  obs?: string;
  dia: string; // ISO date YYYY-MM-DD
  horario: string; // "08:30" | "10:30" | "13:30" | "15:30"
  manutencao?: boolean; // etiqueta azul
}
