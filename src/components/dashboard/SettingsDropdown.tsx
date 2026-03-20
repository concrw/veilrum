import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Settings, LogOut, User, Bell } from "lucide-react";

interface SettingsDropdownProps {
  onProfileEdit: () => void;
  onLogout: () => void;
}

export const SettingsDropdown = ({ onProfileEdit, onLogout }: SettingsDropdownProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Settings className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={onProfileEdit} className="text-xs">
          <User className="mr-2 h-3 w-3" />
          프로필 편집
        </DropdownMenuItem>
        <DropdownMenuItem className="text-xs">
          <Bell className="mr-2 h-3 w-3" />
          알림 설정
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onLogout} className="text-xs text-red-600">
          <LogOut className="mr-2 h-3 w-3" />
          로그아웃
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};