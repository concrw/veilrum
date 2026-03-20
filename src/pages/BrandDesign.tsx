import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, RefreshCw, Save } from "lucide-react";

// Components
import { BrandAnalysisPanel } from "@/components/brand/BrandAnalysisPanel";
import { BrandDirectionStep } from "@/components/brand/BrandDirectionStep";
import { ContentStrategyStep } from "@/components/brand/ContentStrategyStep";
import { TargetAudienceStep } from "@/components/brand/TargetAudienceStep";
import { BrandNamingStep } from "@/components/brand/BrandNamingStep";
import { RevenueModelStep } from "@/components/brand/RevenueModelStep";
import { StepNavigation } from "@/components/brand/StepNavigation";
import { BrandStrategySummary } from "@/components/brand/BrandStrategySummary";

// Types
interface IkigaiData {
  love_elements: string[];
  good_at_elements: string[];
  world_needs_elements: string[];
  paid_for_elements: string[];
  final_ikigai_text: string | null;
}

interface WhyAnalysisData {
  happy_jobs: Array<{ name: string; reason?: string }>;
  pain_jobs: Array<{ name: string; reason?: string }>;
  prime_perspective: string | null;
}

interface BrandStrategy {
  brand_direction: {
    field: string;
    positioning: string;
    core_message: string;
  };
  content_strategy: {
    topics: string[];
    formats: string[];
    channels: string[];
    cadence: string;
  };
  target_audience: {
    age_range: string;
    interests: string[];
    pain_points: string[];
    preferred_channels: string[];
  };
  brand_names: string[];
  revenue_model: {
    primary_model: string;
    price_points: string[];
    monetization_channels: string[];
  };
}

const steps = [
  { title: "브랜드 방향", subtitle: "분야·포지션·메시지" },
  { title: "콘텐츠 전략", subtitle: "주제·형식·채널" },
  { title: "타겟 고객", subtitle: "연령·관심사·페인포인트" },
  { title: "브랜드명", subtitle: "네이밍·선택" },
  { title: "수익 모델", subtitle: "가격·채널·전략" },
  { title: "전략 요약", subtitle: "최종 검토·저장" }
];

const BrandDesign = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  
  // State
  const [mode, setMode] = useState<'analysis' | 'strategy'>('analysis');
  const [currentStep, setCurrentStep] = useState(0);
  const [loadingData, setLoadingData] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Data State
  const [ikigaiData, setIkigaiData] = useState<IkigaiData | null>(null);
  const [whyData, setWhyData] = useState<WhyAnalysisData | null>(null);
  const [brandStrategy, setBrandStrategy] = useState<BrandStrategy | null>(null);
  const [selectedBrandName, setSelectedBrandName] = useState<string>("");

  // Data Loading
  const loadIkigaiData = async () => {
    if (!user) return null;
    
    const { data, error } = await supabase
      .from('ikigai_designs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (error) {
      console.error('Error loading Ikigai data:', error);
      return null;
    }
    
    return data;
  };

  const loadWhyAnalysisData = async () => {
    if (!user) return null;
    
    try {
      // Get latest completed session
      const { data: session } = await supabase
        .from('brainstorm_sessions')
        .select('id, ended_at')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('ended_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!session) return null;

      // Get job entries
      const { data: jobs } = await supabase
        .from('job_entries')
        .select('job_name, reason, first_memory, category')
        .eq('session_id', session.id);

      if (!jobs) return null;

      const happy_jobs = jobs
        .filter(j => j.category === 'happy')
        .map(j => ({ name: j.job_name, reason: j.reason || undefined }));
      
      const pain_jobs = jobs
        .filter(j => j.category === 'pain')
        .map(j => ({ name: j.job_name, reason: j.reason || undefined }));

      // AI 분석은 선택적으로 (실패해도 기본 데이터는 제공)
      let prime_perspective = null;
      try {
        const { data: ai } = await supabase.functions.invoke('analyze-perspective', {
          body: { 
            happyJobs: happy_jobs, 
            painJobs: pain_jobs, 
            firstMemories: jobs.map(j => j.first_memory).filter(Boolean)
          }
        });
        prime_perspective = ai?.primePerspective || ai?.prime_perspective || null;
      } catch (aiError) {
        console.log('AI analysis skipped:', aiError);
        // AI 분석 실패해도 기본 데이터는 반환
      }

      return {
        happy_jobs,
        pain_jobs,
        prime_perspective
      };
    } catch (error) {
      console.error('Error loading Why analysis data:', error);
      return null;
    }
  };

  const loadExistingBrandStrategy = async () => {
    if (!user) return null;
    
    const { data, error } = await supabase
      .from('brand_strategies')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (error) {
      console.error('Error loading brand strategy:', error);
      return null;
    }
    
    return data;
  };

  // AI Strategy Generation
  const generateBrandStrategy = async () => {
    if (!user || !ikigaiData || !whyData) {
      toast({
        title: "데이터 부족",
        description: "Ikigai와 Why 분석을 먼저 완료해주세요.",
        variant: "destructive"
      });
      return;
    }

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-brand-strategy', {
        body: {
          ikigai: ikigaiData,
          whyAnalysis: whyData,
          user: { id: user.id, email: user.email }
        }
      });

      if (error) throw error;

      setBrandStrategy(data as BrandStrategy);
      setSelectedBrandName(data.brand_names?.[0] || "");
      setMode('strategy');
      
      toast({
        title: "브랜드 전략 생성 완료",
        description: "AI가 분석한 브랜드 전략을 확인하세요."
      });
    } catch (error) {
      console.error('Error generating brand strategy:', error);
      toast({
        title: "생성 실패",
        description: "브랜드 전략 생성에 실패했습니다. 다시 시도해주세요.",
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };

  // Save Strategy
  const saveBrandStrategy = async () => {
    if (!user || !brandStrategy) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('brand_strategies')
        .insert({
          user_id: user.id,
          brand_direction: brandStrategy.brand_direction,
          content_strategy: brandStrategy.content_strategy,
          target_audience: brandStrategy.target_audience,
          brand_names: brandStrategy.brand_names,
          revenue_model: brandStrategy.revenue_model,
          selected_brand_name: selectedBrandName || null
        });

      if (error) throw error;

      toast({
        title: "저장 완료",
        description: "브랜드 전략이 저장되었습니다."
      });
      
      navigate('/me');
    } catch (error) {
      console.error('Error saving brand strategy:', error);
      toast({
        title: "저장 실패",
        description: "브랜드 전략 저장에 실패했습니다.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  // Data Loading Effect
  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate('/auth/login');
      return;
    }

    const loadAllData = async () => {
      setLoadingData(true);
      
      try {
        // 1단계: 필수 데이터만 먼저 로드 (빠른 화면 표시)
        const existingStrategy = await loadExistingBrandStrategy();
        
        if (existingStrategy) {
          // 기존 전략이 있으면 바로 표시
          setBrandStrategy(existingStrategy);
          setSelectedBrandName(existingStrategy.selected_brand_name || "");
          setMode('strategy');
          setLoadingData(false); // 먼저 로딩 완료
          
          // 2단계: 나머지 데이터는 백그라운드에서 로드
          Promise.all([
            loadIkigaiData(),
            loadWhyAnalysisData()
          ]).then(([ikigai, why]) => {
            setIkigaiData(ikigai);
            setWhyData(why);
          }).catch(error => {
            console.error('Background data loading error:', error);
          });
          
          return;
        }
        
        // 기존 전략이 없으면 분석 데이터 로드
        const [ikigai, why] = await Promise.all([
          loadIkigaiData(),
          loadWhyAnalysisData()
        ]);

        setIkigaiData(ikigai);
        setWhyData(why);
        
      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          title: "데이터 로드 실패", 
          description: "일부 데이터를 불러오지 못했습니다.",
          variant: "destructive"
        });
      } finally {
        setLoadingData(false);
      }
    };

    loadAllData();
  }, [user, loading, navigate]);

  // Check if we have required data
  const hasRequiredData = ikigaiData && whyData;
  const progress = (currentStep / (steps.length - 1)) * 100;

  if (loadingData) {
    return (
      <main className="min-h-screen bg-background text-foreground px-4 pb-24 pt-6">
        <header className="mb-4 text-center" aria-label="브랜드 설계 페이지 헤더">
          <img
            src="/lovable-uploads/01961ee6-f231-439d-a4f0-45342dd0623f.png"
            width={168}
            style={{ height: 'auto' }}
            alt="브랜드 설계 헤더 이미지"
            className="mx-auto mt-5 opacity-90"
            loading="eager"
            decoding="async"
          />
        </header>
        <div className="py-8 text-center space-y-3">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-muted-foreground">브랜드 설계 데이터를 불러오는 중...</p>
          <p className="text-xs text-muted-foreground/70">첫 실행 시 몇 초 소요될 수 있습니다</p>
        </div>
      </main>
    );
  }

  return (
    <>
      <Helmet>
        <title>브랜드 설계 | PRIPER</title>
        <meta name="description" content="Prime Perspective와 Ikigai 기반 개인 브랜드 전략 설계" />
        <link rel="canonical" href={`${window.location.origin}/brand`} />
      </Helmet>
      
      <main className="min-h-screen bg-background text-foreground px-4 pb-24 pt-6">
        <header className="mb-4 text-center" aria-label="브랜드 설계 페이지 헤더">
          <img
            src="/lovable-uploads/01961ee6-f231-439d-a4f0-45342dd0623f.png"
            width={168}
            style={{ height: 'auto' }}
            alt="브랜드 설계 헤더 이미지"
            className="mx-auto mt-5 opacity-90"
            loading="eager"
            decoding="async"
          />
        </header>

        {/* Navigation */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/ikigai')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Ikigai로 돌아가기
          </Button>
        </div>

        {/* Mode Toggle */}
        <div className="mb-6">
          <Tabs value={mode} onValueChange={(value) => setMode(value as 'analysis' | 'strategy')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="analysis" className="text-xs">데이터 분석</TabsTrigger>
              <TabsTrigger value="strategy" disabled={!brandStrategy} className="text-xs">브랜드 전략</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Content */}
        {mode === 'analysis' && (
          <div className="space-y-6">
            <header className="text-center">
              <h1 className="text-sm font-medium mb-2">브랜드 기반 데이터 분석</h1>
              <p className="text-muted-foreground text-xs">
                Ikigai와 Why 분석 결과를 기반으로 브랜드 전략을 생성합니다
              </p>
            </header>

            <BrandAnalysisPanel
              ikigaiData={ikigaiData}
              whyData={whyData}
              hasRequiredData={hasRequiredData}
              onNavigateToIkigai={() => navigate('/ikigai')}
              onNavigateToWhy={() => navigate('/why')}
            />

            {hasRequiredData && (
              <div className="text-center">
                <Button 
                  onClick={generateBrandStrategy}
                  disabled={generating}
                  size="sm"
                >
                  {generating ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      AI 브랜드 전략 생성 중...
                    </>
                  ) : (
                    'AI 브랜드 전략 생성'
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

        {mode === 'strategy' && brandStrategy && (
          <div className="space-y-6">
            <header className="text-center">
              <h1 className="text-sm font-medium mb-2">브랜드 전략 설계</h1>
              <p className="text-muted-foreground text-xs">
                AI가 생성한 브랜드 전략을 검토하고 수정하세요
              </p>
            </header>

            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex justify-between text-xs text-muted-foreground mb-2">
                <span>진행률</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Step Navigation */}
            <StepNavigation
              steps={steps}
              currentStep={currentStep}
              onStepChange={setCurrentStep}
            />

            {/* Step Content */}
            <div className="space-y-6">
              {currentStep === 0 && (
                <BrandDirectionStep
                  brandDirection={brandStrategy.brand_direction}
                  onUpdate={(direction) => setBrandStrategy({
                    ...brandStrategy,
                    brand_direction: direction
                  })}
                />
              )}

              {currentStep === 1 && (
                <ContentStrategyStep
                  contentStrategy={brandStrategy.content_strategy}
                  onUpdate={(strategy) => setBrandStrategy({
                    ...brandStrategy,
                    content_strategy: strategy
                  })}
                />
              )}

              {currentStep === 2 && (
                <TargetAudienceStep
                  targetAudience={brandStrategy.target_audience}
                  onUpdate={(audience) => setBrandStrategy({
                    ...brandStrategy,
                    target_audience: audience
                  })}
                />
              )}

              {currentStep === 3 && (
                <BrandNamingStep
                  brandNames={brandStrategy.brand_names}
                  selectedName={selectedBrandName}
                  onNameSelect={setSelectedBrandName}
                  onUpdateNames={(names) => setBrandStrategy({
                    ...brandStrategy,
                    brand_names: names
                  })}
                />
              )}

              {currentStep === 4 && (
                <RevenueModelStep
                  revenueModel={brandStrategy.revenue_model}
                  onUpdate={(model) => setBrandStrategy({
                    ...brandStrategy,
                    revenue_model: model
                  })}
                />
              )}

              {currentStep === 5 && (
                <BrandStrategySummary
                  strategy={brandStrategy}
                  selectedBrandName={selectedBrandName}
                  userName={user?.email || "User"}
                />
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <Button 
                variant="outline" 
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
                size="sm"
              >
                이전
              </Button>
              
              {currentStep === steps.length - 1 ? (
                <Button 
                  onClick={saveBrandStrategy}
                  disabled={saving}
                  size="sm"
                >
                  {saving ? (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      저장 중...
                    </>
                  ) : (
                    '브랜드 전략 완료'
                  )}
                </Button>
              ) : (
                <Button 
                  onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
                  size="sm"
                >
                  다음
                </Button>
              )}
            </div>
          </div>
        )}
      </main>
    </>
  );
};

export default BrandDesign;