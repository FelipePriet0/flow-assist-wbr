import { useEffect } from "react";
import KanbanBoard from "@/components/KanbanBoard";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const Index = () => {
  useEffect(() => {
    document.title = "Kanban WBR Net – Análise de Cadastro";
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="pt-8 pb-4">
        <div className="container">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Kanban de Análise de Cadastro – WBR Net
          </h1>
          <p className="mt-2 text-muted-foreground">
            Gerencie fichas de clientes: arraste entre colunas, filtre por responsável/prazo e aplique decisões rápidas.
          </p>
        </div>
      </header>
      <main className="container pb-16 pt-2">
        <ErrorBoundary>
          <KanbanBoard />
        </ErrorBoundary>
      </main>
    </div>
  );
};

export default Index;
