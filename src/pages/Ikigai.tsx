import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";

// Components
import { Step1LoveElements } from "@/components/ikigai/DesignModeSteps/Step1LoveElements";
import { Step2SkillsAssessment } from "@/components/ikigai/DesignModeSteps/Step2SkillsAssessment";
import { Step3SocialNeeds } from "@/components/ikigai/DesignModeSteps/Step3SocialNeeds";
import { Step4RevenueOpportunities } from "@/components/ikigai/DesignModeSteps/Step4RevenueOpportunities";
import { Step5IkigaiCompletion } from "@/components/ikigai/DesignModeSteps/Step5IkigaiCompletion";
import { IkigaiViewMode } from "@/components/ikigai/ViewMode/IkigaiViewMode";
import { StepNavigation } from "@/components/ikigai/Shared/StepNavigation";
import { ProgressIndicator } from "@/components/ikigai/Shared/ProgressIndicator";
import { PersonaIkigaiCanvas } from "@/components/persona/PersonaIkigaiCanvas";
import { IkigaiHistoryViewer } from "@/components/ikigai/IkigaiHistoryViewer";

// Interfaces
interface AssessmentRow {
  id: string;
  created_at: string;
  final_ikigai: string | null;
  love_elements: any;
  good_at_elements: any;
  world_needs_elements: any;
  paid_for_elements: any;
  ikigai_intersections: any;
}

interface Skill {
  name: string;
  level: number;
  category: string;
}

interface WhyAnalysisResult {
  love_elements: string[];
  has_analysis: boolean;
  last_session_completed: string | null;
}

const steps = [
  { title: "좋아하는 것", subtitle: "Why 분석 결과 확인" },
  { title: "잘하는 것", subtitle: "숙련도 기반 스킬 평가" },
  { title: "세상이 필요한 것", subtitle: "사회적 가치 선택" },
  { title: "돈 벌 수 있는 것", subtitle: "고객 코호트 매칭" },
  { title: "Ikigai 완성", subtitle: "통합 결과 확인" }
];

const Ikigai = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<'view' | 'design' | 'history'>('design');
  const [currentStep, setCurrentStep] = useState(0);
  const [currentPersonaId, setCurrentPersonaId] = useState<string | null>(null);

  // AI Generated Mode State
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [row, setRow] = useState<AssessmentRow | null>(null);

  // Design Mode State
  const [whyAnalysisResults, setWhyAnalysisResults] = useState<WhyAnalysisResult>({
    love_elements: [],
    has_analysis: false,
    last_session_completed: null
  });
  const [loadingWhyData, setLoadingWhyData] = useState(false);

  const [skills, setSkills] = useState<Skill[]>([]);
  const [newSkill, setNewSkill] = useState<Skill>({ name: "", level: 1, category: "기술" });
  const [selectedSocialNeeds, setSelectedSocialNeeds] = useState<string[]>([]);
  const [customSocialNeed, setCustomSocialNeed] = useState("");
  const [selectedCohorts, setSelectedCohorts] = useState<string[]>([]);
  const [customRevenue, setCustomRevenue] = useState("");
  const [designedIkigai, setDesignedIkigai] = useState({
    love: [] as string[],
    goodAt: [] as string[],
    worldNeeds: [] as string[],
    paidFor: [] as string[]
  });

  // Data Loading Functions
  const loadWhyAnalysisResults = async () => {
    if (!user) return;
    
    setLoadingWhyData(true);
    try {
      const { data: session, error: sessionError } = await supabase
        .from('brainstorm_sessions')
        .select('id, ended_at, status')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('ended_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (sessionError) {
        console.error('Error loading WHY session:', sessionError);
        return;
      }

      if (!session) {
        setWhyAnalysisResults({
          love_elements: [],
          has_analysis: false,
          last_session_completed: null
        });
        return;
      }

      const { data: loveData, error: loveError } = await supabase.rpc(
        'extract_love_from_why_analysis', 
        { input_user_id: user.id }
      );

      if (loveError) {
        console.error('Error extracting LOVE elements:', loveError);
        setWhyAnalysisResults({
          love_elements: ['창의적 문제 해결', '사람들과 소통', '지식 공유'],
          has_analysis: true,
          last_session_completed: session.ended_at
        });
        return;
      }

      setWhyAnalysisResults({
        love_elements: Array.isArray(loveData) ? loveData : [],
        has_analysis: true,
        last_session_completed: session.ended_at
      });

    } catch (error) {
      console.error('Error in loadWhyAnalysisResults:', error);
      toast({
        title: "WHY 분석 로드 실패",
        description: "WHY 분석 결과를 불러오는데 실패했습니다.",
        variant: "destructive"
      });
    } finally {
      setLoadingWhyData(false);
    }
  };

  const loadAllDesignData = async () => {
    if (!user) return;
    
    try {
      await Promise.all([
        loadUserSkills(),
        loadUserSocialNeeds(),
        loadUserRevenueOpportunities(),
        loadIkigaiDesign(),
        loadWhyAnalysisResults()
      ]);
    } catch (error) {
      console.error('Error loading design data:', error);
    }
  };

  const loadUserSkills = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('user_skills')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });
    
    if (!error && data) {
      setSkills(data.map(item => ({
        name: item.skill_name,
        level: item.skill_level,
        category: item.category
      })));
    }
  };

  const loadUserSocialNeeds = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('user_social_needs')
      .select('*')
      .eq('user_id', user.id);
    
    if (!error && data) {
      setSelectedSocialNeeds(data.map(item => item.need_text));
    }
  };

  const loadUserRevenueOpportunities = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('user_revenue_opportunities')
      .select('*')
      .eq('user_id', user.id);
    
    if (!error && data) {
      setSelectedCohorts(data.map(item => item.opportunity_text));
    }
  };

  const loadIkigaiDesign = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('ikigai_designs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (!error && data) {
      setDesignedIkigai({
        love: data.love_elements || [],
        goodAt: data.good_at_elements || [],
        worldNeeds: data.world_needs_elements || [],
        paidFor: data.paid_for_elements || []
      });
    }
  };

  // Data Saving Functions
  const saveUserSkills = async () => {
    if (!user) return;
    
    await supabase.from('user_skills').delete().eq('user_id', user.id);
    
    if (skills.length > 0) {
      const skillsToInsert = skills.map(skill => ({
        user_id: user.id,
        skill_name: skill.name,
        skill_level: skill.level,
        category: skill.category
      }));
      
      const { error } = await supabase.from('user_skills').insert(skillsToInsert);
      if (error) {
        console.error('Error saving skills:', error);
        toast({
          title: "스킬 저장 실패",
          description: "스킬 정보 저장에 실패했습니다.",
          variant: "destructive"
        });
      }
    }
  };

  const saveUserSocialNeeds = async () => {
    if (!user) return;
    
    await supabase.from('user_social_needs').delete().eq('user_id', user.id);
    
    if (selectedSocialNeeds.length > 0) {
      const needsToInsert = selectedSocialNeeds.map(need => ({
        user_id: user.id,
        need_text: need,
        is_custom: true // 일단 모두 커스텀으로 처리 (나중에 마스터 데이터와 비교 로직 추가 가능)
      }));
      
      const { error } = await supabase.from('user_social_needs').insert(needsToInsert);
      if (error) {
        console.error('Error saving social needs:', error);
        toast({
          title: "사회적 가치 저장 실패",
          description: "사회적 가치 정보 저장에 실패했습니다.",
          variant: "destructive"
        });
      }
    }
  };

  const saveUserRevenueOpportunities = async () => {
    if (!user) return;
    
    await supabase.from('user_revenue_opportunities').delete().eq('user_id', user.id);
    
    if (selectedCohorts.length > 0) {
      const opportunitiesToInsert = selectedCohorts.map(cohort => ({
        user_id: user.id,
        opportunity_text: cohort,
        is_custom: true // 일단 모두 커스텀으로 처리
      }));
      
      const { error } = await supabase.from('user_revenue_opportunities').insert(opportunitiesToInsert);
      if (error) {
        console.error('Error saving revenue opportunities:', error);
        toast({
          title: "수익 기회 저장 실패",
          description: "수익 기회 정보 저장에 실패했습니다.",
          variant: "destructive"
        });
      }
    }
  };

  const saveIkigaiDesign = async () => {
    if (!user) return;
    
    const ikigaiToSave = {
      user_id: user.id,
      love_elements: designedIkigai.love,
      good_at_elements: designedIkigai.goodAt,
      world_needs_elements: designedIkigai.worldNeeds,
      paid_for_elements: designedIkigai.paidFor,
      final_ikigai_text: designedIkigai.love[0] && designedIkigai.goodAt[0] ? 
        `${designedIkigai.love[0]}을 통한 ${designedIkigai.goodAt[0]} 전문가` : 
        null
    };
    
    await supabase.from('ikigai_designs').delete().eq('user_id', user.id);
    const { error } = await supabase.from('ikigai_designs').insert(ikigaiToSave);
    
    if (error) {
      console.error('Error saving ikigai design:', error);
      toast({
        title: "Ikigai 저장 실패",
        description: "Ikigai 설계 저장에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  // AI View Mode Functions
  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("ikigai_assessments")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!error) setRow(data as AssessmentRow);
    setLoading(false);
  };

  const runAnalysis = async () => {
    if (!user) return;
    setRunning(true);
    const { data, error } = await (supabase as any).functions.invoke("generate-ikigai", { body: {} });
    setRunning(false);
    if (error) {
      toast({
        title: "IKIGAI 생성 실패",
        description: error.message,
        variant: "destructive"
      });
      return;
    }
    if (data?.assessment) setRow(data.assessment);
    toast({
      title: "IKIGAI 업데이트",
      description: "최신 IKIGAI가 생성되었습니다."
    });
  };

  // Event Handlers for Design Mode
  const handleSyncWhyToIkigai = async () => {
    if (!user) return;
    
    setLoadingWhyData(true);
    try {
      const { error } = await supabase.rpc('sync_why_to_ikigai_love', {
        input_user_id: user.id
      });
      
      if (error) {
        console.error('Error syncing WHY to Ikigai:', error);
        toast({
          title: "동기화 실패",
          description: "WHY 분석 결과 동기화에 실패했습니다.",
          variant: "destructive"
        });
        return;
      }
      
      await loadWhyAnalysisResults();
      await loadIkigaiDesign();
      
      toast({
        title: "동기화 완료",
        description: "WHY 분석 결과가 Ikigai에 반영되었습니다."
      });
    } catch (error) {
      console.error('Error in syncWhyToIkigai:', error);
    } finally {
      setLoadingWhyData(false);
    }
  };

  const handleAddSkill = async () => {
    if (newSkill.name.trim()) {
      const updatedSkills = [...skills, { ...newSkill, name: newSkill.name.trim() }];
      setSkills(updatedSkills);
      setNewSkill({ name: "", level: 1, category: "기술" });
      
      await saveUserSkills();
      toast({
        title: "스킬 추가됨",
        description: "스킬이 성공적으로 추가되었습니다."
      });
    }
  };

  const handleRemoveSkill = async (index: number) => {
    const updatedSkills = skills.filter((_, i) => i !== index);
    setSkills(updatedSkills);
    
    await saveUserSkills();
    toast({
      title: "스킬 삭제됨",
      description: "스킬이 성공적으로 삭제되었습니다."
    });
  };

  const handleUpdateSkillLevel = async (index: number, level: number[]) => {
    const updated = [...skills];
    updated[index].level = level[0];
    setSkills(updated);
    
    await saveUserSkills();
  };

  const handleToggleSocialNeed = async (need: string, checked: boolean) => {
    if (checked) {
      const updatedNeeds = [...selectedSocialNeeds, need];
      setSelectedSocialNeeds(updatedNeeds);
    } else {
      const updatedNeeds = selectedSocialNeeds.filter(item => item !== need);
      setSelectedSocialNeeds(updatedNeeds);
    }
    await saveUserSocialNeeds();
  };

  const handleAddCustomSocialNeed = async () => {
    if (customSocialNeed.trim()) {
      const updatedNeeds = [...selectedSocialNeeds, customSocialNeed.trim()];
      setSelectedSocialNeeds(updatedNeeds);
      setCustomSocialNeed("");
      
      await saveUserSocialNeeds();
      toast({
        title: "사회적 가치 추가됨",
        description: "사회적 가치가 성공적으로 추가되었습니다."
      });
    }
  };

  const handleRemoveSocialNeed = async (need: string) => {
    const updatedNeeds = selectedSocialNeeds.filter(item => item !== need);
    setSelectedSocialNeeds(updatedNeeds);
    await saveUserSocialNeeds();
  };

  const handleToggleCohort = async (cohort: string, checked: boolean) => {
    if (checked) {
      const updatedCohorts = [...selectedCohorts, cohort];
      setSelectedCohorts(updatedCohorts);
    } else {
      const updatedCohorts = selectedCohorts.filter(item => item !== cohort);
      setSelectedCohorts(updatedCohorts);
    }
    await saveUserRevenueOpportunities();
  };

  const handleAddCustomRevenue = async () => {
    if (customRevenue.trim()) {
      const updatedCohorts = [...selectedCohorts, customRevenue.trim()];
      setSelectedCohorts(updatedCohorts);
      setCustomRevenue("");
      
      await saveUserRevenueOpportunities();
      toast({
        title: "수익 기회 추가됨",
        description: "수익 기회가 성공적으로 추가되었습니다."
      });
    }
  };

  const handleRemoveCohort = async (cohort: string) => {
    const updatedCohorts = selectedCohorts.filter(item => item !== cohort);
    setSelectedCohorts(updatedCohorts);
    await saveUserRevenueOpportunities();
  };

  const handleGenerateDesignedIkigai = async () => {
    const goodAtFiltered = skills.filter(skill => skill.level >= 3).map(skill => skill.name);
    
    const newIkigaiData = {
      love: whyAnalysisResults.love_elements,
      goodAt: goodAtFiltered,
      worldNeeds: selectedSocialNeeds,
      paidFor: selectedCohorts
    };
    
    setDesignedIkigai(newIkigaiData);
    
    await saveIkigaiDesign();
    toast({
      title: "IKIGAI 완성",
      description: "설계된 IKIGAI가 저장되었습니다."
    });
  };

  const calculateIntersections = (ikigaiData: typeof designedIkigai) => {
    const { love, goodAt, worldNeeds, paidFor } = ikigaiData;
    
    return {
      passion: love.filter(item => goodAt.includes(item)),
      mission: love.filter(item => worldNeeds.some(need => item.includes(need.split(' ')[0]))),
      profession: goodAt.filter(item => paidFor.some(cohort => cohort.includes(item))),
      vocation: worldNeeds.filter(need => paidFor.some(cohort => cohort.includes(need.split(' ')[0])))
    };
  };

  // Navigation Handlers
  const handleStepNavigation = async (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentStep(Math.max(0, currentStep - 1));
    } else {
      // Save current step data before moving to next
      if (currentStep === 1) await saveUserSkills();
      if (currentStep === 2) await saveUserSocialNeeds();
      if (currentStep === 3) {
        await saveUserRevenueOpportunities();
        await handleGenerateDesignedIkigai();
      }
      setCurrentStep(Math.min(steps.length - 1, currentStep + 1));
    }
  };

  // Effects
  useEffect(() => {
    if (user && mode === 'design') {
      loadAllDesignData();
    }
  }, [user, mode]);

  useEffect(() => {
    load();
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("ikigai-changes")
      .on("postgres_changes", { 
        event: "*", 
        schema: "public", 
        table: "ikigai_assessments", 
        filter: `user_id=eq.${user.id}` 
      }, (payload) => {
        if (payload.new) setRow(payload.new as AssessmentRow);
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    if (!loading && !row && mode === 'view') runAnalysis();
  }, [loading, row, mode]);

  // Render Step Content
  const renderStepContent = () => {
    const intersections = calculateIntersections(designedIkigai);

    switch (currentStep) {
      case 0:
        return (
          <Step1LoveElements
            whyAnalysisResults={whyAnalysisResults}
            loadingWhyData={loadingWhyData}
            onSync={handleSyncWhyToIkigai}
          />
        );
      case 1:
        return (
          <Step2SkillsAssessment
            skills={skills}
            newSkill={newSkill}
            onNewSkillChange={setNewSkill}
            onAddSkill={handleAddSkill}
            onRemoveSkill={handleRemoveSkill}
            onUpdateSkillLevel={handleUpdateSkillLevel}
          />
        );
      case 2:
        return (
          <Step3SocialNeeds
            selectedSocialNeeds={selectedSocialNeeds}
            customSocialNeed={customSocialNeed}
            onCustomSocialNeedChange={setCustomSocialNeed}
            onToggleSocialNeed={handleToggleSocialNeed}
            onAddCustomSocialNeed={handleAddCustomSocialNeed}
            onRemoveSocialNeed={handleRemoveSocialNeed}
          />
        );
      case 3:
        return (
          <Step4RevenueOpportunities
            selectedCohorts={selectedCohorts}
            customRevenue={customRevenue}
            onCustomRevenueChange={setCustomRevenue}
            onToggleCohort={handleToggleCohort}
            onAddCustomRevenue={handleAddCustomRevenue}
            onRemoveCohort={handleRemoveCohort}
          />
        );
      case 4:
        return (
          <Step5IkigaiCompletion
            designedIkigai={designedIkigai}
            intersections={intersections}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Helmet>
        <title>IKIGAI 완성 | PRIPER</title>
        <meta name="description" content="분석 데이터를 통합해 나만의 IKIGAI를 시각화하고 완성하세요" />
        <link rel="canonical" href={`${window.location.origin}/ikigai`} />
      </Helmet>
      
      <main className="min-h-screen bg-background text-foreground px-4 pb-24 pt-6">
        <header className="mb-4 text-center" aria-label="IKIGAI 페이지 헤더">
          <img
            src="/lovable-uploads/01961ee6-f231-439d-a4f0-45342dd0623f.png"
            width={168}
            style={{ height: 'auto' }}
            alt="IKIGAI 헤더 이미지"
            className="mx-auto mt-5 opacity-90"
            loading="eager"
            decoding="async"
          />
        </header>

        <PersonaIkigaiCanvas>
          {(activePersona) => {
            // Update currentPersonaId when activePersona changes
            if (activePersona && currentPersonaId !== activePersona.id) {
              setCurrentPersonaId(activePersona.id);
            }

            return (
              <>
                {/* Mode Toggle */}
                <div className="mb-6">
                  <Tabs value={mode} onValueChange={(value) => setMode(value as 'view' | 'design' | 'history')}>
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="design">직접 설계</TabsTrigger>
                      <TabsTrigger value="view">AI 생성 결과</TabsTrigger>
                      <TabsTrigger value="history">히스토리</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

        {/* AI 생성 모드 */}
        {mode === 'view' && (
          <IkigaiViewMode
            loading={loading}
            running={running}
            row={row}
            onLoad={load}
            onRunAnalysis={runAnalysis}
          />
        )}

        {/* 직접 설계 모드 */}
        {mode === 'design' && (
          <>
            <header className="mb-6 text-center">
              <h1 className="text-sm font-medium mb-2">IKIGAI 직접 설계</h1>
              <p className="text-muted-foreground text-xs">
                4가지 영역을 단계별로 완성하여 당신의 생의 목적을 발견하세요
              </p>
            </header>

            <ProgressIndicator
              currentStep={currentStep}
              totalSteps={steps.length}
            />

            <StepNavigation
              steps={steps}
              currentStep={currentStep}
              onStepChange={setCurrentStep}
              onPrevious={() => handleStepNavigation('prev')}
              onNext={() => handleStepNavigation('next')}
              onComplete={handleGenerateDesignedIkigai}
              isLastStep={currentStep === steps.length - 1}
            />

            {/* Step Content */}
            <div className="space-y-6">
              {renderStepContent()}
            </div>
          </>
        )}

        {/* 히스토리 모드 */}
        {mode === 'history' && (
          <IkigaiHistoryViewer
            onSelectVersion={(version) => {
              // Load the selected version into current state
              const data = version.data;
              setDesignedIkigai({
                love: data.love_elements,
                goodAt: data.good_at_elements,
                worldNeeds: data.world_needs_elements,
                paidFor: data.paid_for_elements,
              });

              // Switch to appropriate mode
              if (version.type === 'assessment') {
                setMode('view');
              } else {
                setMode('design');
                setCurrentStep(4); // Go to completion step
              }

              toast({
                title: "버전 불러오기 완료",
                description: "선택한 Ikigai 버전이 불러와졌습니다.",
              });
            }}
          />
        )}
              </>
            );
          }}
        </PersonaIkigaiCanvas>
      </main>
    </>
  );
};

export default Ikigai;