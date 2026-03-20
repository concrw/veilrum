/**
 * IkigaiExportButton Component
 * Exports Ikigai Venn diagram to PDF
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileDown, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface IkigaiExportButtonProps {
  diagramRef: React.RefObject<HTMLDivElement>;
  userName?: string;
  data: {
    love: string[];
    goodAt: string[];
    worldNeeds: string[];
    paidFor: string[];
  };
}

export function IkigaiExportButton({
  diagramRef,
  userName = "User",
  data,
}: IkigaiExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const exportToPDF = async () => {
    if (!diagramRef.current) {
      toast({
        title: "내보내기 실패",
        description: "다이어그램을 찾을 수 없습니다.",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);

    try {
      // Capture the diagram as canvas
      const canvas = await html2canvas(diagramRef.current, {
        scale: 2, // Higher quality
        backgroundColor: "#ffffff",
        logging: false,
      });

      // Create PDF
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // Calculate dimensions to fit A4
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(
        (pdfWidth - 20) / imgWidth,
        (pdfHeight - 60) / imgHeight
      );
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 30;

      // Add title
      pdf.setFontSize(18);
      pdf.text("나의 IKIGAI", pdfWidth / 2, 15, { align: "center" });

      // Add diagram
      pdf.addImage(
        imgData,
        "PNG",
        imgX,
        imgY,
        imgWidth * ratio,
        imgHeight * ratio
      );

      // Add footer with metadata
      const footerY = pdfHeight - 10;
      pdf.setFontSize(9);
      pdf.setTextColor(128, 128, 128);
      pdf.text(`생성일: ${new Date().toLocaleDateString("ko-KR")}`, 10, footerY);
      pdf.text(`${userName}`, pdfWidth - 10, footerY, { align: "right" });

      // Save PDF
      const fileName = `IKIGAI_${userName}_${new Date().getTime()}.pdf`;
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
    } finally {
      setIsExporting(false);
    }
  };

  const exportAsJSON = () => {
    try {
      const exportData = {
        userName,
        exportDate: new Date().toISOString(),
        ikigaiData: data,
        completeness: {
          love: data.love.length,
          goodAt: data.goodAt.length,
          worldNeeds: data.worldNeeds.length,
          paidFor: data.paidFor.length,
          total:
            data.love.length +
            data.goodAt.length +
            data.worldNeeds.length +
            data.paidFor.length,
        },
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `IKIGAI_${userName}_${new Date().getTime()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "내보내기 완료",
        description: "JSON 파일이 다운로드되었습니다.",
      });
    } catch (error) {
      console.error("JSON export error:", error);
      toast({
        title: "내보내기 실패",
        description: "JSON 생성 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const isDataEmpty =
    data.love.length === 0 &&
    data.goodAt.length === 0 &&
    data.worldNeeds.length === 0 &&
    data.paidFor.length === 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          disabled={isExporting || isDataEmpty}
          className="gap-2"
        >
          {isExporting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              내보내는 중...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              내보내기
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>파일 형식 선택</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={exportToPDF} className="gap-2">
          <FileDown className="w-4 h-4" />
          PDF로 내보내기
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportAsJSON} className="gap-2">
          <FileDown className="w-4 h-4" />
          JSON으로 내보내기
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
