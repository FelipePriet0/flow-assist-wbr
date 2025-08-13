import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ApplicationMock, MockComment } from '@/types/mock';
import { v4 as uuidv4 } from 'uuid';

interface KanbanMockStore {
  applications: ApplicationMock[];
  deletedMocks: ApplicationMock[];
  
  // Actions
  addMock: (application: Omit<ApplicationMock, 'id' | 'created_at' | 'comments'>) => void;
  ingressMock: (id: string, analystName: string) => void;
  changeStatusMock: (id: string, status: ApplicationMock['status'], comment?: string, userName?: string) => void;
  assignReanalystMock: (id: string, reanalystName: string) => void;
  deleteMock: (id: string) => void;
  resetMock: () => void;
  generateMockData: (count?: number) => void;
}

const generateMockApplication = (index = 0): Omit<ApplicationMock, 'id' | 'created_at' | 'comments'> => {
  const timestamp = Date.now() + index;
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 3);
  
  return {
    status: 'pendente',
    company: Math.random() > 0.5 ? 'WBR' : 'MZNET',
    customer_name: `Cliente Mock ${timestamp}`,
    customer_cpf: `${String(timestamp).slice(-11).padStart(11, '1')}`,
    phone: `34999${String(timestamp).slice(-6)}`,
    whats: `34999${String(timestamp).slice(-6)}`,
    email: `cliente.mock+${timestamp}@example.com`,
    birth_date: '1995-05-05',
    naturalidade: 'Uberlândia',
    uf: 'MG',
    emprego: 'CLT',
    tipo_de_moradia: 'Alugada sem contrato',
    obs: `Observações do cliente mock ${timestamp}`,
    ps: `PS do cliente mock ${timestamp}`,
    agendamento: futureDate.toISOString(),
    seller: `Comercial Mock ${index + 1}`,
  };
};

export const useKanbanMockStore = create<KanbanMockStore>()(
  persist(
    (set, get) => ({
      applications: [],
      deletedMocks: [],

      addMock: (applicationData) => {
        const newApplication: ApplicationMock = {
          ...applicationData,
          id: uuidv4(),
          created_at: new Date().toISOString(),
          comments: [],
        };
        
        set((state) => ({
          applications: [...state.applications, newApplication],
        }));
      },

      ingressMock: (id, analystName) => {
        set((state) => ({
          applications: state.applications.map((app) =>
            app.id === id
              ? {
                  ...app,
                  status: 'em_analise' as const,
                  analyst_assignee: analystName,
                  analysis_started_at: new Date().toISOString(),
                }
              : app
          ),
        }));
      },

      changeStatusMock: (id, status, comment, userName = 'Mock User') => {
        set((state) => ({
          applications: state.applications.map((app) =>
            app.id === id
              ? {
                  ...app,
                  status,
                  comments: comment
                    ? [
                        ...app.comments,
                        {
                          id: uuidv4(),
                          by: userName,
                          at: new Date().toISOString(),
                          text: comment,
                          newStatus: status,
                        },
                      ]
                    : app.comments,
                  ...(status === 'reanalisar' && {
                    reanalysis_assignee: `Reanalista Mock ${app.company}`,
                  }),
                }
              : app
          ),
        }));
      },

      assignReanalystMock: (id, reanalystName) => {
        set((state) => ({
          applications: state.applications.map((app) =>
            app.id === id ? { ...app, reanalysis_assignee: reanalystName } : app
          ),
        }));
      },

      deleteMock: (id) => {
        const { applications } = get();
        const appToDelete = applications.find((app) => app.id === id);
        
        if (appToDelete) {
          set((state) => ({
            applications: state.applications.filter((app) => app.id !== id),
            deletedMocks: [...state.deletedMocks, appToDelete],
          }));
        }
      },

      resetMock: () => {
        set({
          applications: [],
          deletedMocks: [],
        });
      },

      generateMockData: (count = 1) => {
        const { addMock } = get();
        
        for (let i = 0; i < count; i++) {
          addMock(generateMockApplication(i));
        }
      },
    }),
    {
      name: 'kanban-mock-v1',
    }
  )
);