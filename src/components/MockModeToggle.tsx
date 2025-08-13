import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useMockMode } from "@/hooks/useMockMode";
import { TestTube } from "lucide-react";

export function MockModeToggle() {
  const { isMockMode, toggleMockMode } = useMockMode();

  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="flex items-center gap-2 px-2 py-1 bg-muted rounded-md">
      <TestTube className="h-4 w-4 text-muted-foreground" />
      <Label htmlFor="mock-mode" className="text-sm font-medium">
        Mock Mode
      </Label>
      <Switch
        id="mock-mode"
        checked={isMockMode}
        onCheckedChange={toggleMockMode}
      />
      {isMockMode && (
        <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full">
          SIMULAÇÃO
        </span>
      )}
    </div>
  );
}