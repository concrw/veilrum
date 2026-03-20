import { Helmet } from "react-helmet-async";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UnifiedBrandingStrategy } from "@/components/persona/UnifiedBrandingStrategy";
import { PersonaRelationshipGraph } from "@/components/persona/PersonaRelationshipGraph";
import { PersonaGrowthDashboard } from "@/components/persona/PersonaGrowthDashboard";
import { Network, Palette, TrendingUp } from "lucide-react";

export default function PersonaRelationships() {
  return (
    <>
      <Helmet>
        <title>페르소나 관계 분석 | PRIPER</title>
        <meta
          name="description"
          content="여러 페르소나 간의 시너지를 분석하고 통합 브랜딩 전략을 수립하세요"
        />
        <link rel="canonical" href={`${window.location.origin}/personas/relationships`} />
      </Helmet>

      <main className="min-h-screen bg-background text-foreground px-4 pb-24 pt-6">
        <header className="mb-6 text-center">
          <h1 className="text-3xl font-bold mb-2">페르소나 통합 분석</h1>
          <p className="text-muted-foreground">
            여러 페르소나의 관계를 분석하고 성장을 추적하세요
          </p>
        </header>

        <Tabs defaultValue="relationships" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="relationships">
              <Network className="w-4 h-4 mr-2" />
              관계 분석
            </TabsTrigger>
            <TabsTrigger value="branding">
              <Palette className="w-4 h-4 mr-2" />
              브랜딩 전략
            </TabsTrigger>
            <TabsTrigger value="growth">
              <TrendingUp className="w-4 h-4 mr-2" />
              성장 추적
            </TabsTrigger>
          </TabsList>

          <TabsContent value="relationships">
            <PersonaRelationshipGraph />
          </TabsContent>

          <TabsContent value="branding">
            <UnifiedBrandingStrategy />
          </TabsContent>

          <TabsContent value="growth">
            <PersonaGrowthDashboard />
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}
