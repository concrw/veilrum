interface Step {
  title: string;
  subtitle: string;
}

interface StepNavigationProps {
  steps: Step[];
  currentStep: number;
  onStepChange: (step: number) => void;
}

export const StepNavigation = ({
  steps,
  currentStep,
  onStepChange
}: StepNavigationProps) => {
  return (
    <div className="mb-8">
      <div className="flex justify-between items-center">
        {steps.map((step, index) => (
          <div 
            key={index} 
            className={`text-center flex-1 cursor-pointer transition-colors ${
              index <= currentStep ? 'text-primary' : 'text-muted-foreground'
            }`}
            onClick={() => onStepChange(index)}
          >
            <div className={`w-6 h-6 rounded-full mx-auto mb-1 flex items-center justify-center text-xs font-medium transition-colors ${
              index <= currentStep 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground'
            }`}>
              {index + 1}
            </div>
            <div className="text-xs font-medium">{step.title}</div>
            <div className="text-xs text-muted-foreground">{step.subtitle}</div>
          </div>
        ))}
      </div>
    </div>
  );
};