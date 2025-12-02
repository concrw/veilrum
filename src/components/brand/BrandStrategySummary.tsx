/**
 * BrandStrategySummary Component
 * Visual summary of the complete brand strategy
 */

import { useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Compass,
  MessageSquare,
  Users,
  DollarSign,
  Sparkles,
  FileText,
  Target,
  TrendingUp,
  Download,
  FileDown,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

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

interface BrandStrategySummaryProps {
  strategy: BrandStrategy;
  selectedBrandName?: string;
  userName?: string;
}

export function BrandStrategySummary({
  strategy,
  selectedBrandName,
  userName = "User",
}: BrandStrategySummaryProps) {
  const summaryRef = useRef<HTMLDivElement>(null);

  const exportToPDF = async () => {
    if (!summaryRef.current) {
      toast({
        title: "내보내기 실패",
        description: "요약 내용을 찾을 수 없습니다.",
        variant: "destructive",
      });
      return;
    }

    try {
      const canvas = await html2canvas(summaryRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(
        (pdfWidth - 20) / imgWidth,
        (pdfHeight - 30) / imgHeight
      );
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 15;

      pdf.setFontSize(16);
      pdf.text("브랜드 전략 요약", pdfWidth / 2, 10, { align: "center" });

      pdf.addImage(
        imgData,
        "PNG",
        imgX,
        imgY,
        imgWidth * ratio,
        imgHeight * ratio
      );

      const footerY = pdfHeight - 10;
      pdf.setFontSize(8);
      pdf.setTextColor(128, 128, 128);
      pdf.text(`생성일: ${new Date().toLocaleDateString("ko-KR")}`, 10, footerY);
      pdf.text(`${userName}`, pdfWidth - 10, footerY, { align: "right" });

      const fileName = `브랜드전략_${selectedBrandName || userName}_${new Date().getTime()}.pdf`;
      pdf.save(fileName);

      toast({
        title: "내보내기 완료",
        description: `${fileName} 파일이 다운로드되었습니다.`,
      });
    } catch (error) {
      console.error("PDF export error:", error);
      toast({
        title: "내보내기 실패",
        description: "PDF 생성 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Export Button */}
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={exportToPDF} className="gap-2">
          <Download className="w-4 h-4" />
          PDF 내보내기
        </Button>
      </div>

      <div ref={summaryRef} className="space-y-4 bg-white p-4 rounded-lg">
        {/* Brand Identity Header */}
        <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-none">
          <CardContent className="pt-6">
            <div className="text-center space-y-3">
              <Sparkles className="w-8 h-8 mx-auto text-primary" />
              <h2 className="text-lg font-bold">
                {selectedBrandName || strategy.brand_names[0] || "My Brand"}
              </h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                {strategy.brand_direction.positioning}
              </p>
              <div className="bg-background/50 rounded-lg p-3 max-w-lg mx-auto">
                <p className="text-xs text-muted-foreground mb-1">핵심 메시지</p>
                <p className="text-sm font-medium">{strategy.brand_direction.core_message}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Strategy Overview Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Brand Direction */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs flex items-center gap-2">
                <Compass className="w-4 h-4 text-blue-500" />
                브랜드 방향
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-xs text-muted-foreground">전문 분야</p>
                <p className="text-sm font-medium">{strategy.brand_direction.field}</p>
              </div>
            </CardContent>
          </Card>

          {/* Target Audience */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs flex items-center gap-2">
                <Users className="w-4 h-4 text-green-500" />
                타겟 고객
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-xs text-muted-foreground">연령대</p>
                <p className="text-sm font-medium">{strategy.target_audience.age_range}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">관심사</p>
                <div className="flex flex-wrap gap-1">
                  {strategy.target_audience.interests.slice(0, 4).map((interest, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content Strategy */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-500" />
                콘텐츠 전략
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-xs text-muted-foreground mb-1">주요 주제</p>
                <div className="flex flex-wrap gap-1">
                  {strategy.content_strategy.topics.slice(0, 3).map((topic, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {topic}
                    </Badge>
                  ))}
                  {strategy.content_strategy.topics.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{strategy.content_strategy.topics.length - 3}
                    </Badge>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">채널</p>
                <div className="flex flex-wrap gap-1">
                  {strategy.content_strategy.channels.map((channel, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs bg-purple-500/10">
                      {channel}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">발행 주기</p>
                <p className="text-sm">{strategy.content_strategy.cadence}</p>
              </div>
            </CardContent>
          </Card>

          {/* Revenue Model */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-amber-500" />
                수익 모델
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-xs text-muted-foreground">주요 모델</p>
                <p className="text-sm font-medium">{strategy.revenue_model.primary_model}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">가격 정책</p>
                <div className="flex flex-wrap gap-1">
                  {strategy.revenue_model.price_points.slice(0, 3).map((price, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs bg-amber-500/10">
                      {price}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pain Points & Solutions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs flex items-center gap-2">
              <Target className="w-4 h-4 text-red-500" />
              고객 페인포인트 & 솔루션
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium mb-2 text-red-600">고객의 고충</p>
                <ul className="space-y-1">
                  {strategy.target_audience.pain_points.map((pain, idx) => (
                    <li key={idx} className="text-xs flex items-start gap-2">
                      <span className="text-red-400">•</span>
                      {pain}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-medium mb-2 text-green-600">콘텐츠로 해결</p>
                <ul className="space-y-1">
                  {strategy.content_strategy.formats.map((format, idx) => (
                    <li key={idx} className="text-xs flex items-start gap-2">
                      <span className="text-green-400">•</span>
                      {format}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Brand Names */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-pink-500" />
              브랜드명 후보
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {strategy.brand_names.map((name, idx) => (
                <Badge
                  key={idx}
                  variant={selectedBrandName === name ? "default" : "outline"}
                  className={`text-sm py-1 px-3 ${
                    selectedBrandName === name ? "bg-primary" : ""
                  }`}
                >
                  {name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Action Roadmap */}
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              실행 로드맵
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                  1
                </div>
                <div>
                  <p className="text-xs font-medium">브랜드 정체성 확립</p>
                  <p className="text-xs text-muted-foreground">
                    브랜드명 확정, 프로필 설정, 소개 문구 작성
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                  2
                </div>
                <div>
                  <p className="text-xs font-medium">콘텐츠 채널 개설</p>
                  <p className="text-xs text-muted-foreground">
                    {strategy.content_strategy.channels.slice(0, 2).join(", ")} 계정 생성 및 최적화
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                  3
                </div>
                <div>
                  <p className="text-xs font-medium">첫 콘텐츠 발행</p>
                  <p className="text-xs text-muted-foreground">
                    "{strategy.content_strategy.topics[0]}" 주제로 첫 콘텐츠 제작
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                  4
                </div>
                <div>
                  <p className="text-xs font-medium">수익화 준비</p>
                  <p className="text-xs text-muted-foreground">
                    {strategy.revenue_model.monetization_channels[0]}에서{" "}
                    {strategy.revenue_model.primary_model} 상품 기획
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
