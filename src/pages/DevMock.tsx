import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useKanbanMockStore } from "@/stores/kanbanMockStore";
import { useMockMode } from "@/hooks/useMockMode";
import { useToast } from "@/hooks/use-toast";
import { Trash2, TestTube, RotateCcw, Database } from "lucide-react";

const DevMock = () => {
  const { isMockMode, toggleMockMode } = useMockMode();
  const { applications, deletedMocks, resetMock, generateMockData } = useKanbanMockStore();
  const { toast } = useToast();

  useEffect(() => {
    document.title = "Dev Tools - Mock Kanban";
  }, []);

  const handleReset = () => {
    resetMock();
    toast({
      title: "Mock resetado",
      description: "Todos os dados mock foram removidos",
    });
  };

  const handleGenerate5 = () => {
    generateMockData(5);
    toast({
      title: "5 fichas mock criadas",
      description: "Fichas adicionadas para stress test",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="pt-8 pb-4">
        <div className="container">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Dev Tools - Mock Kanban
          </h1>
          <p className="mt-2 text-muted-foreground">
            Ferramentas para desenvolvimento e teste do sistema mock
          </p>
        </div>
      </header>

      <main className="container pb-16 pt-2 space-y-6">
        {/* Mock Mode Toggle */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Configuração do Mock Mode
            </CardTitle>
            <CardDescription>
              Ative o modo mock para interceptar todas as chamadas do backend
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Switch
                id="mock-mode"
                checked={isMockMode}
                onCheckedChange={toggleMockMode}
              />
              <Label htmlFor="mock-mode">
                Mock Mode {isMockMode ? 'ATIVO' : 'DESATIVO'}
              </Label>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {isMockMode 
                ? "Todas as operações usam dados locais (localStorage)" 
                : "Aplicação conectada ao Supabase"
              }
            </p>
          </CardContent>
        </Card>

        {/* Mock Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Estatísticas Mock</CardTitle>
            <CardDescription>
              Estado atual dos dados mock em memória
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{applications.length}</div>
                <div className="text-sm text-muted-foreground">Fichas Ativas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-destructive">{deletedMocks.length}</div>
                <div className="text-sm text-muted-foreground">Fichas Excluídas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {applications.filter(app => app.status === 'pendente').length}
                </div>
                <div className="text-sm text-muted-foreground">Recebidos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {applications.filter(app => app.status === 'em_analise').length}
                </div>
                <div className="text-sm text-muted-foreground">Em Análise</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mock Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Ações Mock</CardTitle>
            <CardDescription>
              Ferramentas para manipular dados mock
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <Button
                onClick={handleGenerate5}
                variant="default"
                className="gap-2"
                disabled={!isMockMode}
              >
                <TestTube className="h-4 w-4" />
                Gerar 5 Fichas Mock
              </Button>
              
              <Button
                onClick={handleReset}
                variant="destructive"
                className="gap-2"
                disabled={!isMockMode}
              >
                <RotateCcw className="h-4 w-4" />
                Resetar Mock
              </Button>
            </div>
            
            {!isMockMode && (
              <p className="text-sm text-muted-foreground">
                Ative o Mock Mode para usar essas ferramentas
              </p>
            )}
          </CardContent>
        </Card>

        {/* Deleted Mocks History */}
        {deletedMocks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5" />
                Histórico de Fichas Excluídas (Mock)
              </CardTitle>
              <CardDescription>
                Lista das fichas mock que foram excluídas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {deletedMocks.map((mock, index) => (
                  <div
                    key={mock.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <div className="font-medium">{mock.customer_name}</div>
                      <div className="text-sm text-muted-foreground">
                        CPF: {mock.customer_cpf} | Empresa: {mock.company}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      #{index + 1}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default DevMock;