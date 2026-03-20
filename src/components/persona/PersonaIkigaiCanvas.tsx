import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { usePersonas } from "@/hooks/usePersonas";
import { PersonaWithDetails } from "@/integrations/supabase/persona-types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, User } from "lucide-react";
import { ARCHETYPE_CONFIGS } from "@/integrations/supabase/persona-types";

interface PersonaIkigaiCanvasProps {
  children: (activePersona: PersonaWithDetails | null) => React.ReactNode;
}

export function PersonaIkigaiCanvas({ children }: PersonaIkigaiCanvasProps) {
  const [searchParams] = useSearchParams();
  const { data: personas, isLoading } = usePersonas();
  const [activePersona, setActivePersona] = useState<PersonaWithDetails | null>(null);

  useEffect(() => {
    if (!personas || personas.length === 0) return;

    const personaParam = searchParams.get("persona");

    if (personaParam) {
      // Find persona by ID from URL parameter
      const foundPersona = personas.find((p) => p.id === personaParam);
      if (foundPersona) {
        setActivePersona(foundPersona);
        return;
      }
    }

    // Default to main persona (rank_order = 1)
    const mainPersona = personas.find((p) => p.rank_order === 1) || personas[0];
    setActivePersona(mainPersona);
  }, [personas, searchParams]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!personas || personas.length === 0) {
    return (
      <Alert>
        <User className="h-4 w-4" />
        <AlertDescription>
          페르소나가 아직 생성되지 않았습니다. Why 분석을 완료하면 자동으로 페르소나가 감지됩니다.
        </AlertDescription>
      </Alert>
    );
  }

  if (!activePersona) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const archetypeConfig = ARCHETYPE_CONFIGS[activePersona.persona_archetype || "Explorer"];

  return (
    <div className="space-y-6">
      {/* Persona Context Header */}
      <Card className="border-2" style={{ borderColor: activePersona.color_hex }}>
        <CardHeader>
          <div className="flex items-start gap-4">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 text-2xl"
              style={{ backgroundColor: activePersona.color_hex }}
            >
              <span className="text-white">
                {archetypeConfig?.icon || "👤"}
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <CardTitle className="text-xl">{activePersona.persona_name}</CardTitle>
                <Badge variant="outline" style={{ borderColor: activePersona.color_hex }}>
                  {archetypeConfig?.name || activePersona.persona_archetype}
                </Badge>
                {activePersona.rank_order === 1 && (
                  <Badge variant="default">메인</Badge>
                )}
              </div>
              <CardDescription className="text-sm">
                {activePersona.theme_description}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>💪 강도: {Math.round(activePersona.strength_score || 0)}%</span>
            {activePersona.persona_keywords && activePersona.persona_keywords.length > 0 && (
              <>
                <span>•</span>
                <span>
                  키워드: {activePersona.persona_keywords.slice(0, 3).map((kw) => kw.keyword).join(", ")}
                </span>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Ikigai Content scoped to this persona */}
      {children(activePersona)}
    </div>
  );
}
