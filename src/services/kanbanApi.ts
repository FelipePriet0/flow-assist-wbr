import { supabase } from '@/supabaseClient';
import { useKanbanMockStore } from '@/stores/kanbanMockStore';
import { ApplicationMock } from '@/types/mock';
import { CardItem, ColumnId } from '@/components/KanbanBoard';

// Wrapper para API do Kanban que intercepta chamadas quando Mock Mode está ativo
export class KanbanApi {
  constructor(private isMockMode: boolean = false) {}

  async fetchApplications(): Promise<CardItem[]> {
    if (this.isMockMode) {
      return this.fetchMockApplications();
    }
    return this.fetchRealApplications();
  }

  private fetchMockApplications(): CardItem[] {
    const { applications } = useKanbanMockStore.getState();
    
    return applications.map((app: ApplicationMock): CardItem => ({
      id: app.id,
      columnId: this.mapStatusToColumn(app.status) as ColumnId,
      nome: app.customer_name,
      telefone: app.phone,
      cpf: app.customer_cpf,
      agendamento: app.agendamento,
      comercial: app.seller,
      empresa: app.company,
      analista: app.analyst_assignee || '',
      reanalista: app.reanalysis_assignee || '',
      parecer: app.comments.length > 0 ? app.comments[app.comments.length - 1].text : '',
      lastMovedAt: app.created_at,
      labels: [app.company],
    }));
  }

  private async fetchRealApplications(): Promise<CardItem[]> {
    const { data: applications, error } = await supabase
      .from('applications')
      .select(`
        id,
        customer_name,
        customer_cpf,
        phone,
        whats,
        status,
        agendamento,
        comercial,
        empresa,
        analista,
        reanalista,
        parecer,
        updated_at,
        companies (name)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return applications?.map((app: any): CardItem => ({
      id: app.id,
      columnId: app.status,
      nome: app.customer_name,
      telefone: app.phone,
      cpf: app.customer_cpf,
      agendamento: app.agendamento,
      comercial: app.comercial,
      empresa: app.empresa,
      analista: app.analista || '',
      reanalista: app.reanalista || '',
      parecer: app.parecer || '',
      lastMovedAt: app.updated_at,
      labels: app.companies ? [app.companies.name] : [],
    })) || [];
  }

  async ingressar(cardId: string, analystName: string): Promise<void> {
    if (this.isMockMode) {
      const { ingressMock } = useKanbanMockStore.getState();
      ingressMock(cardId, analystName);
      return;
    }

    const { error } = await supabase.rpc('applications_ingressar', {
      p_app_id: cardId
    });

    if (error) throw error;
  }

  async changeStatus(cardId: string, newStatus: string, comment?: string): Promise<void> {
    if (this.isMockMode) {
      const { changeStatusMock } = useKanbanMockStore.getState();
      const mockStatus = this.mapColumnToMockStatus(newStatus);
      changeStatusMock(cardId, mockStatus, comment);
      return;
    }

    const { error } = await supabase.rpc('applications_change_status', {
      p_app_id: cardId,
      p_new_status: newStatus,
      p_comment: comment
    });

    if (error) throw error;
  }

  async deleteApplication(cardId: string): Promise<void> {
    if (this.isMockMode) {
      const { deleteMock } = useKanbanMockStore.getState();
      deleteMock(cardId);
      return;
    }

    const { error } = await supabase
      .from('applications')
      .delete()
      .eq('id', cardId);

    if (error) throw error;
  }

  private mapStatusToColumn(status: ApplicationMock['status']): string {
    const statusMap: Record<ApplicationMock['status'], string> = {
      'pendente': 'recebidos',
      'em_analise': 'em_analise',
      'aprovado': 'aprovado',
      'negado': 'negado_taxa',
      'reanalisar': 'reanalise'
    };
    return statusMap[status] || 'recebidos';
  }

  private mapColumnToMockStatus(columnId: string): ApplicationMock['status'] {
    const columnMap: Record<string, ApplicationMock['status']> = {
      'recebidos': 'pendente',
      'em_analise': 'em_analise',
      'aprovado': 'aprovado',
      'negado_taxa': 'negado',
      'reanalise': 'reanalisar'
    };
    return columnMap[columnId] || 'pendente';
  }
}