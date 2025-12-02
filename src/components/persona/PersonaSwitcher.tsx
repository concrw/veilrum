import { useState } from "react";
import { useAccessiblePersonas, useSetActivePersona } from "@/hooks/usePersonas";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Lock, Settings, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PersonaPaywall } from "./PersonaPaywall";

interface PersonaSwitcherProps {
  activePersonaId?: string | null;
}

export function PersonaSwitcher({ activePersonaId }: PersonaSwitcherProps) {
  const navigate = useNavigate();
  const { data: personas, isLoading } = useAccessiblePersonas();
  const { mutate: setActive } = useSetActivePersona();
  const [paywallOpen, setPaywallOpen] = useState(false);

  if (isLoading || !personas || personas.length === 0) {
    return null;
  }

  const handlePersonaChange = (personaId: string) => {
    if (personaId === "upgrade") {
      setPaywallOpen(true);
      return;
    }

    if (personaId === "manage") {
      navigate("/personas");
      return;
    }

    setActive(personaId);
  };

  const activePersona = personas.find((p) => p.id === activePersonaId) || personas[0];
  const hasLockedPersonas = personas.some((p) => p.is_accessible === false);

  return (
    <>
      <div className="flex items-center gap-2 px-4 py-2 bg-card/50 rounded-lg">
        <User className="w-4 h-4 text-muted-foreground" />
        <Select value={activePersona?.id} onValueChange={handlePersonaChange}>
          <SelectTrigger className="w-[200px] h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {personas.map((persona) => (
              <SelectItem
                key={persona.id}
                value={persona.id}
                disabled={persona.is_accessible === false}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: persona.color_hex }}
                  />
                  <span>{persona.persona_name}</span>
                  {persona.is_accessible === false && (
                    <Lock className="w-3 h-3 ml-1 text-muted-foreground" />
                  )}
                </div>
              </SelectItem>
            ))}

            {hasLockedPersonas && (
              <>
                <SelectItem value="upgrade" className="border-t">
                  <div className="flex items-center gap-2 text-primary">
                    <Lock className="w-3 h-3" />
                    <span>Pro로 업그레이드</span>
                  </div>
                </SelectItem>
              </>
            )}

            <SelectItem value="manage" className="border-t">
              <div className="flex items-center gap-2">
                <Settings className="w-3 h-3" />
                <span>페르소나 관리</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        {personas.length > 1 && (
          <Button variant="ghost" size="sm" onClick={() => navigate("/personas")}>
            관리
          </Button>
        )}
      </div>

      <PersonaPaywall
        open={paywallOpen}
        onOpenChange={setPaywallOpen}
        personaCount={personas.length}
        triggerContext="discovery"
      />
    </>
  );
}
