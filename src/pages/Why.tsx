import { Helmet } from "react-helmet-async";
import { Progress } from "@/components/ui/progress";

import { Step1BrainstormingSection } from "@/components/why/Step1BrainstormingSection";
import { Step2DefinitionSection } from "@/components/why/Step2DefinitionSection";
import { Step3ClassificationSection } from "@/components/why/Step3ClassificationSection";
import { Step4ResultsSection } from "@/components/why/Step4ResultsSection";

import { useWhyPageFlow } from "@/hooks/useWhyPageFlow";

const Why = () => {
  const {
    step,
    setStep,
    loading,
    session,
    jobs,
    secondsLeft,
    memoText,
    setMemoText,
    idx,
    setIdx,
    isNormalizing,
    phase,
    setPhase,
    happySet,
    painSet,
    flowProgress,
    currentJobCount,
    canGoStep3,
    finalizeStep1Early,
    goBackToEditMode,
    saveCurrent,
    toggleHappy,
    togglePain,
    commitClassification,
  } = useWhyPageFlow();

  return (
    <>
      <Helmet>
        <title>WHY 단계별 플로우 | V-File</title>
        <meta name="description" content="10분 브레인스토밍부터 정의·분류·결과까지 한 페이지에서 흐름대로 진행" />
        <link rel="canonical" href={`${window.location.origin}/why`} />
      </Helmet>

      <main className="min-h-screen bg-background text-foreground px-4 pb-24 pt-6">
        <header className="mb-4 text-center" aria-label="WHY 페이지 헤더">
          <img
            src="/lovable-uploads/01961ee6-f231-439d-a4f0-45342dd0623f.png"
            width={168}
            style={{ height: 'auto' }}
            alt="WHY 단계 헤더 이미지"
            className="mx-auto mt-5 opacity-90"
            loading="eager"
            decoding="async"
          />
        </header>

        {loading ? (
          <div className="py-16 text-center text-muted-foreground">불러오는 중...</div>
        ) : (
          <div className="space-y-5">
            {step === 1 && (
              <Step1BrainstormingSection
                memoText={memoText}
                setMemoText={setMemoText}
                secondsLeft={secondsLeft}
                currentJobCount={currentJobCount}
                onFinalize={finalizeStep1Early}
                sessionEnded={!!session?.ended_at}
              />
            )}

            {step === 2 && (
              <Step2DefinitionSection
                jobs={jobs}
                idx={idx}
                setIdx={setIdx}
                session={session}
                isNormalizing={isNormalizing}
                onSaveCurrent={saveCurrent}
                onPrevStep={() => setStep(1)}
                onNextStep={() => setStep(3)}
                canGoStep3={canGoStep3}
              />
            )}

            {step === 3 && (
              <Step3ClassificationSection
                jobs={jobs}
                phase={phase}
                setPhase={setPhase}
                happySet={happySet}
                painSet={painSet}
                onToggleHappy={toggleHappy}
                onTogglePain={togglePain}
                onCommitClassification={commitClassification}
                onPrevStep={() => setStep(2)}
              />
            )}

            {step === 4 && (
              <Step4ResultsSection
                jobs={jobs}
                onPrevStep={() => setStep(3)}
                onGoBackToEditMode={goBackToEditMode}
              />
            )}
          </div>
        )}

        <header className="mt-6">
          <div className="mt-3">
            <Progress value={flowProgress} />
            <p className="text-xs text-muted-foreground mt-2">진행률 {flowProgress}% · 단계 {step}/4</p>
          </div>
        </header>
      </main>
    </>
  );
};

export default Why;
