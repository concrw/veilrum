import { useState, RefObject } from "react";
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

interface WhyAnalysisExportButtonProps {
  contentRef: RefObject<HTMLDivElement>;
  userName?: string;
  analysisData: {
    perspective: { title: string; desc: string };
    counts: { happy: number; pain: number; neutral: number };
    insights: string[];
    keywords: { word: string; count: number }[];
    emotion: { score: number; label: string };
  };
}

export function WhyAnalysisExportButton({
  contentRef,
  userName = "User",
  analysisData,
}: WhyAnalysisExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const exportToPDF = async () => {
    if (!contentRef.current) {
      toast({
        title: "Export failed",
        description: "Content not found.",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);

    try {
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        logging: false,
        windowWidth: 800,
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
        (pdfHeight - 60) / imgHeight
      );
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 30;

      pdf.setFontSize(18);
      pdf.text("WHY Analysis Report", pdfWidth / 2, 15, { align: "center" });

      pdf.addImage(
        imgData,
        "PNG",
        imgX,
        imgY,
        imgWidth * ratio,
        imgHeight * ratio
      );

      const footerY = pdfHeight - 10;
      pdf.setFontSize(9);
      pdf.setTextColor(128, 128, 128);
      pdf.text(`Generated: ${new Date().toLocaleDateString("ko-KR")}`, 10, footerY);
      pdf.text(`${userName} | PRIPER`, pdfWidth - 10, footerY, { align: "right" });

      const fileName = `WHY_Analysis_${userName}_${new Date().getTime()}.pdf`;
      pdf.save(fileName);

      toast({
        title: "Export complete",
        description: `${fileName} has been downloaded.`,
      });
    } catch (error) {
      console.error("PDF export error:", error);
      toast({
        title: "Export failed",
        description: "An error occurred while generating the PDF.",
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
        whyAnalysis: {
          perspective: analysisData.perspective,
          distribution: analysisData.counts,
          insights: analysisData.insights,
          topKeywords: analysisData.keywords,
          emotionScore: analysisData.emotion,
        },
      };

      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `WHY_Analysis_${userName}_${new Date().getTime()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Export complete",
        description: "JSON file has been downloaded.",
      });
    } catch (error) {
      console.error("JSON export error:", error);
      toast({
        title: "Export failed",
        description: "An error occurred while generating the JSON.",
        variant: "destructive",
      });
    }
  };

  const total = analysisData.counts.happy + analysisData.counts.pain + analysisData.counts.neutral;
  const isDataEmpty = total === 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={isExporting || isDataEmpty}
          className="gap-2"
        >
          {isExporting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Export
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Select format</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={exportToPDF} className="gap-2">
          <FileDown className="w-4 h-4" />
          Export as PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportAsJSON} className="gap-2">
          <FileDown className="w-4 h-4" />
          Export as JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
