import { useState } from "react";
import { useVerifyPersona, useUpdatePersona } from "@/hooks/usePersonas";
import { PersonaWithDetails } from "@/integrations/supabase/persona-types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Edit3 } from "lucide-react";

interface PersonaVerificationFlowProps {
  persona: PersonaWithDetails;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerified?: () => void;
}

export function PersonaVerificationFlow({
  persona,
  open,
  onOpenChange,
  onVerified,
}: PersonaVerificationFlowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(persona.persona_name);
  const [editedDescription, setEditedDescription] = useState(persona.theme_description);

  const { mutate: verifyPersona, isPending: verifyPending } = useVerifyPersona();
  const { mutate: updatePersona, isPending: updatePending } = useUpdatePersona();

  const handleVerify = (accept: boolean) => {
    if (accept) {
      verifyPersona(persona.id, {
        onSuccess: () => {
          onVerified?.();
          onOpenChange(false);
        },
      });
    } else {
      setIsEditing(true);
    }
  };

  const handleSaveEdit = () => {
    updatePersona(
      {
        personaId: persona.id,
        updates: {
          persona_name: editedName,
          theme_description: editedDescription,
          is_user_verified: true,
        },
      },
      {
        onSuccess: () => {
          onVerified?.();
          onOpenChange(false);
          setIsEditing(false);
        },
      }
    );
  };

  const isPending = verifyPending || updatePending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {isEditing ? "페르소나 수정" : "페르소나 검증"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "AI가 제안한 내용을 수정할 수 있습니다"
              : "AI가 분석한 페르소나가 정확한가요?"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!isEditing ? (
            // Verification view
            <>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: persona.color_hex }}
                  >
                    <span className="text-white text-xl">
                      {persona.persona_archetype?.charAt(0) || "P"}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg">{persona.persona_name}</h3>
                      <Badge variant="outline">{persona.persona_archetype}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {Math.round(persona.strength_score || 0)}% 강도
                    </p>
                  </div>
                </div>

                <div className="border rounded-lg p-4 bg-muted/50">
                  <p className="text-sm font-medium mb-2">테마 설명</p>
                  <p className="text-sm">{persona.theme_description}</p>
                </div>

                {persona.keywords && persona.keywords.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">관련 키워드</p>
                    <div className="flex flex-wrap gap-2">
                      {persona.keywords.slice(0, 8).map((kw) => (
                        <Badge key={kw.keyword} variant="secondary">
                          {kw.keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  className="flex-1"
                  onClick={() => handleVerify(true)}
                  disabled={isPending}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  정확해요
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleVerify(false)}
                  disabled={isPending}
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  수정할래요
                </Button>
              </div>
            </>
          ) : (
            // Edit view
            <>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="persona-name">페르소나 이름</Label>
                  <Input
                    id="persona-name"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    placeholder="예: 돕는 나, 창작하는 나"
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="persona-description">테마 설명</Label>
                  <Textarea
                    id="persona-description"
                    value={editedDescription}
                    onChange={(e) => setEditedDescription(e.target.value)}
                    placeholder="이 페르소나를 설명하는 문장을 작성하세요"
                    rows={4}
                    className="mt-2"
                  />
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setEditedName(persona.persona_name);
                    setEditedDescription(persona.theme_description);
                  }}
                  disabled={isPending}
                >
                  취소
                </Button>
                <Button onClick={handleSaveEdit} disabled={isPending}>
                  저장하고 검증 완료
                </Button>
              </DialogFooter>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
