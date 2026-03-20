import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Check, Trash2, Lock } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useCurrentKeywordInfo } from "@/hooks/useKeywordSealStatus";
import { isWritingPeriod, getKSTTime } from "@/lib/timeUtils";
import { useToast } from "@/hooks/use-toast";
import { STRINGS } from "@/constants/strings";
import { MESSAGES } from "@/constants/messages";
import { UI_TEXT } from "@/constants/ui";
import { PLACEHOLDERS } from "@/constants/placeholders";
import { UNLOCK_HOUR, LOCK_HOUR } from "@/lib/constants";

interface TodayKeywordProps {
  keyword: string;
  onSubmit: (definition: string, memory: string) => Promise<void>;
  disabled?: boolean;
  onKeywordChange: (keyword: string) => void;
  hasParticipated: boolean;
}

export function TodayKeyword({
  keyword,
  onSubmit,
  disabled,
  onKeywordChange,
  hasParticipated
}: TodayKeywordProps) {
  const { toast } = useToast();
  const [definition, setDefinition] = useState("");
  const [memory, setMemory] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showWordSelection, setShowWordSelection] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [savedDraft, setSavedDraft] = useState<{
    definition: string;
    memory: string;
  } | null>(null);
  const [hasUnsavedContent, setHasUnsavedContent] = useState(false);

  // New hooks for keyword management
  const {
    data: keywordInfo
  } = useCurrentKeywordInfo();

  // Check if user can write - always allow writing (6PM 이후: 다음 날 키워드, 6PM 이전: 당일 키워드)
  const canWrite = !disabled;

  // Check for drafts on mount
  useEffect(() => {
    const checkForDrafts = () => {
      const draftKey = `story_draft_${keyword}`;
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        try {
          const parsedDraft = JSON.parse(saved);
          setSavedDraft(parsedDraft);
          setShowRestoreDialog(true);
        } catch (error) {
          console.error('Error parsing saved draft:', error);
          localStorage.removeItem(draftKey);
        }
      }
    };
    if (keyword && !hasParticipated && canWrite) {
      checkForDrafts();
    }
  }, [keyword, hasParticipated, canWrite]);

  // Auto-save to localStorage (only during writing period)
  useEffect(() => {
    if (!hasParticipated && canWrite && (definition || memory)) {
      const timer = setTimeout(() => {
        const draftKey = `story_draft_${keyword}`;
        localStorage.setItem(draftKey, JSON.stringify({
          definition,
          memory
        }));
      }, 2000); // Save after 2 seconds of inactivity

      return () => clearTimeout(timer);
    }
  }, [definition, memory, keyword, hasParticipated, canWrite]);

  // Warn user before leaving page with unsaved content (only during writing period)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedContent && canWrite) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedContent, canWrite]);

  // Update unsaved content status
  useEffect(() => {
    setHasUnsavedContent(!!(definition.trim() || memory.trim()));
  }, [definition, memory]);

  const handleSubmit = async () => {
    const trimmedDefinition = definition.trim();
    const trimmedMemory = memory.trim();

    if (!trimmedDefinition || !trimmedMemory) return;

    if (trimmedDefinition.length > 500) {
      toast.error('정의는 500자 이내로 입력해주세요.');
      return;
    }

    if (trimmedMemory.length > 500) {
      toast.error('기억은 500자 이내로 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(trimmedDefinition, trimmedMemory);

      // Clear localStorage after successful submission
      const draftKey = `story_draft_${keyword}`;
      localStorage.removeItem(draftKey);

      // Reset form
      setDefinition("");
      setMemory("");
      setHasUnsavedContent(false);
    } catch (error) {
      console.error('Error submitting story:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestoreDraft = () => {
    if (savedDraft) {
      setDefinition(savedDraft.definition);
      setMemory(savedDraft.memory);
    }
    setShowRestoreDialog(false);
  };

  const handleDiscardDraft = () => {
    const draftKey = `story_draft_${keyword}`;
    localStorage.removeItem(draftKey);
    setSavedDraft(null);
    setShowRestoreDialog(false);
  };
  
  const handleWordSelect = (selectedWord: string) => {
    onKeywordChange(selectedWord);
    setShowWordSelection(false);
  };

  // Show success message if user has already participated
  if (hasParticipated) {
    const kstNow = getKSTTime();
    const currentHour = kstNow.getHours();
    // (완벽-절대변경금지) 퍼블릭스토리 오픈 시간: 당일 오후 6시 ~ 다음날 새벽 2시
    const isReadingPeriod = currentHour >= UNLOCK_HOUR && currentHour <= 23 || currentHour >= 0 && currentHour <= LOCK_HOUR;
    console.log('🔍 [TodayKeyword] Participated user screen:', {
      currentHour,
      isReadingPeriod,
      keyword,
      message: isReadingPeriod ? '피드탭으로이동안내' : '오후6시대기안내'
    });
    return <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="space-y-5">
            <h2 className="text-lg font-medium text-foreground leading-8">
              {`'${keyword}'${MESSAGES.KEYWORD.ALREADY_RECORDED}`}
            </h2>
          </div>
          
          {/* PWA 캐시 문제 해결을 위한 새로고침 버튼 (개발/테스트용) */}
          
        </div>
      </div>;
  }

  // Show word selection if needed
  if (showWordSelection) {
    return <Card className="p-8 bg-transparent backdrop-blur-sm border border-white/10 network-glow">
        <div className="text-center mb-6">
          <h2 className="text-lg font-medium text-foreground mb-2">{MESSAGES.KEYWORD.SELECT_WORD}</h2>
          <p className="text-muted-foreground">
            {MESSAGES.KEYWORD.SELECT_WORD_DESC}
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {STRINGS.PREDEFINED_WORDS.map(word => <Button key={word} onClick={() => handleWordSelect(word)} variant="outline" className="p-3 h-auto text-base font-normal border-border hover:bg-accent">
              {word}
            </Button>)}
        </div>
        
        <Button onClick={() => setShowWordSelection(false)} variant="ghost" className="w-full">
          {MESSAGES.KEYWORD.BACK}
        </Button>
      </Card>;
  }

  // Show restore dialog if needed
  if (showRestoreDialog) {
    return <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{MESSAGES.KEYWORD.RESTORE_DRAFT}</DialogTitle>
            <DialogDescription>
              {MESSAGES.KEYWORD.RESTORE_DRAFT_DESC}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">{MESSAGES.FORM.MY_DEFINITION}</p>
              <p className="text-sm text-muted-foreground p-2 bg-muted rounded-md">
                {savedDraft?.definition}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">{MESSAGES.FORM.MEMORY_POINT}</p>
              <p className="text-sm text-muted-foreground p-2 bg-muted rounded-md">
                {savedDraft?.memory}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleDiscardDraft}>
              <Trash2 className="w-4 h-4 mr-2" />
              {MESSAGES.KEYWORD.DELETE_AND_NEW}
            </Button>
            <Button onClick={handleRestoreDraft}>{MESSAGES.KEYWORD.RESTORE}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>;
  }

  // Main writing interface
  return <Card className="px-4 pt-4 pb-3 -mt-5 bg-transparent backdrop-blur-sm border border-white/10 network-glow">
      <div className={`space-y-6 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="space-y-2">
          <label htmlFor="definition" className="text-xs font-medium text-foreground ml-2">
            {MESSAGES.FORM.MY_DEFINITION}
          </label>
          <Textarea 
            id="definition" 
            placeholder={PLACEHOLDERS.DEFINITION} 
            value={definition} 
            onChange={e => setDefinition(e.target.value)} 
            disabled={disabled || !canWrite} 
            className="min-h-[100px] text-xs bg-background/90 backdrop-blur-sm border-border/50 resize-none"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="memory" className="text-xs font-medium text-foreground ml-2">
            {MESSAGES.FORM.MEMORY_POINT}
          </label>
          <Textarea 
            id="memory" 
            placeholder={PLACEHOLDERS.MEMORY} 
            value={memory} 
            onChange={e => setMemory(e.target.value)} 
            disabled={disabled || !canWrite} 
            className="min-h-[330px] text-xs bg-background/90 backdrop-blur-sm border-border/50 resize-none"
          />
        </div>

        <Button 
          onClick={handleSubmit} 
          disabled={disabled || !definition.trim() || !memory.trim() || isSubmitting} 
          className="w-full py-3 -mt-25 !bg-black !text-white hover:!bg-black/90 network-button-glow"
        >
          {isSubmitting ? MESSAGES.KEYWORD.RECORDING : UI_TEXT.BUTTONS.RECORD}
        </Button>
      </div>
    </Card>;
}