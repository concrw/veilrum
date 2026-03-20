import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Profile {
  id: string;
  email: string | null;
  name: string | null;
  avatar_url: string | null;
}

interface ProfileEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: Profile | null;
  onSave: (updatedProfile: Profile) => Promise<void>;
  saving: boolean;
}

export const ProfileEditDialog = ({ 
  open, 
  onOpenChange, 
  profile, 
  onSave,
  saving 
}: ProfileEditDialogProps) => {
  const [localProfile, setLocalProfile] = useState<Profile | null>(profile);

  const handleSave = async () => {
    if (!localProfile) return;
    await onSave(localProfile);
    onOpenChange(false);
  };

  if (!profile) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm">프로필 편집</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="name" className="text-xs">이름</Label>
            <Input
              id="name"
              value={localProfile?.name ?? ''}
              onChange={(e) => setLocalProfile(prev => 
                prev ? { ...prev, name: e.target.value } : prev
              )}
              placeholder="이름을 입력하세요"
              className="text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="avatar" className="text-xs">아바타 URL</Label>
            <Input
              id="avatar"
              value={localProfile?.avatar_url ?? ''}
              onChange={(e) => setLocalProfile(prev => 
                prev ? { ...prev, avatar_url: e.target.value } : prev
              )}
              placeholder="프로필 이미지 URL"
              className="text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">이메일</Label>
            <Input 
              value={profile.email ?? ''} 
              disabled 
              className="text-xs bg-muted" 
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              취소
            </Button>
            <Button 
              size="sm" 
              onClick={handleSave}
              disabled={saving}
              className="text-xs"
            >
              {saving ? '저장 중...' : '저장'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};