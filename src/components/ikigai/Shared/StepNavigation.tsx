import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface Step {
  title: string;
  subtitle: string;
}

interface StepNavigationProps {
  steps: Step[];
  currentStep: number;
  onStepChange: (step: number) => void;
  onPrevious: () => void;
  onNext: () => void;
  onComplete: () => void;
  isLastStep: boolean;
  canGoNext?: boolean;
}

export const StepNavigation = ({
  steps,
  currentStep,
  onPrevious,
  onNext,
  onComplete,
  isLastStep,
  canGoNext = true
}: StepNavigationProps) => {
  return (
    <>
      {/* Step Indicators */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          {steps.map((step, index) => (
            <div 
              key={index} 
              className={`text-center flex-1 ${
                index <= currentStep ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <div className={`w-5 h-5 rounded-full mx-auto mb-1 flex items-center justify-center text-xs font-medium ${
                index <= currentStep 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted'
              }`}>
                {index + 1}
              </div>
              <div className="text-xs font-medium">{step.title}</div>
              <div className="text-xs text-muted-foreground">{step.subtitle}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-6">
        <Button 
          variant="outline" 
          onClick={onPrevious}
          disabled={currentStep === 0}
          className="text-xs"
        >
          <ArrowLeft className="w-3 h-3 mr-2" />
          이전
        </Button>
        
        {isLastStep ? (
          <Button onClick={onComplete} className="text-xs">
            IKIGAI 최종 완성
          </Button>
        ) : (
          <Button 
            onClick={onNext}
            disabled={!canGoNext}
            className="text-xs"
          >
            다음
            <ArrowRight className="w-3 h-3 ml-2" />
          </Button>
        )}
      </div>
    </>
  );
};