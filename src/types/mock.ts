export interface ApplicationMock {
  id: string;
  status: 'pendente' | 'em_analise' | 'aprovado' | 'negado' | 'reanalisar';
  company: 'WBR' | 'MZNET';
  customer_name: string;
  customer_cpf: string;
  phone: string;
  whats: string;
  email: string;
  birth_date: string;
  naturalidade: string;
  uf: string;
  emprego: string;
  tipo_de_moradia: string;
  obs: string;
  ps: string;
  agendamento: string;
  seller: string;
  analyst_assignee?: string;
  reanalysis_assignee?: string;
  analysis_started_at?: string;
  created_at: string;
  comments: Array<{
    id: string;
    by: string;
    at: string;
    text: string;
    newStatus: string;
  }>;
}

export interface MockComment {
  id: string;
  by: string;
  at: string;
  text: string;
  newStatus: string;
}