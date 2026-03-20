import { Progress } from "@/components/ui/progress";

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export const ProgressIndicator = ({ 
  currentStep, 
  totalSteps 
}: ProgressIndicatorProps) => {
  const progressValue = Math.round((currentStep / (totalSteps - 1)) * 100);

  return (
    <div className="mb-6">
      <div className="flex justify-between text-xs text-muted-foreground mb-2">
        <span>진행률</span>
        <span>{progressValue}%</span>
      </div>
      <Progress value={progressValue} className="h-2" />
    </div>
  );
};