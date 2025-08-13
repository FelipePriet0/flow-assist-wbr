import { Button } from "@/components/ui/button";
import { useKanbanMockStore } from "@/stores/kanbanMockStore";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useToast } from "@/hooks/use-toast";
import { useMockMode } from "@/hooks/useMockMode";
import { TestTube } from "lucide-react";

export function GenerateMockButton() {
  const { isMockMode } = useMockMode();
  const { generateMockData } = useKanbanMockStore();
  const { name: currentUserName } = useCurrentUser();
  const { toast } = useToast();

  if (!isMockMode) return null;

  const handleGenerateMock = () => {
    generateMockData(1);
    toast({
      title: "Ficha mock criada",
      description: "Nova ficha adicionada em Recebidos",
    });
    
    // Trigger a page reload to show the new mock data
    window.location.reload();
  };

  return (
    <Button
      onClick={handleGenerateMock}
      variant="outline"
      className="gap-2"
    >
      <TestTube className="h-4 w-4" />
      Gerar Ficha Mock
    </Button>
  );
}