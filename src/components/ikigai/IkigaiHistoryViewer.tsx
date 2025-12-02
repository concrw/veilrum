/**
 * IkigaiHistoryViewer Component
 * Displays version history of Ikigai (both AI-generated and user-designed)
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  History,
  Trash2,
  Eye,
  Clock,
  Sparkles,
  Pencil,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import {
  useCombinedIkigaiHistory,
  useDeleteIkigaiAssessment,
  useDeleteIkigaiDesign,
  calculateCompletenessScore,
  type IkigaiHistoryItem,
} from "@/hooks/useIkigaiHistory";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

interface IkigaiHistoryViewerProps {
  onSelectVersion?: (version: IkigaiHistoryItem) => void;
}

export function IkigaiHistoryViewer({ onSelectVersion }: IkigaiHistoryViewerProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<IkigaiHistoryItem | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [versionToDelete, setVersionToDelete] = useState<IkigaiHistoryItem | null>(null);

  const { data: history, isLoading } = useCombinedIkigaiHistory();
  const deleteAssessment = useDeleteIkigaiAssessment();
  const deleteDesign = useDeleteIkigaiDesign();

  const handleViewVersion = (version: IkigaiHistoryItem) => {
    setSelectedVersion(version);
    setDialogOpen(true);
  };

  const handleDeleteVersion = (version: IkigaiHistoryItem) => {
    setVersionToDelete(version);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!versionToDelete) return;

    if (versionToDelete.type === "assessment") {
      await deleteAssessment.mutateAsync(versionToDelete.id);
    } else {
      await deleteDesign.mutateAsync(versionToDelete.id);
    }

    setDeleteDialogOpen(false);
    setVersionToDelete(null);
  };

  const renderVersionCard = (version: IkigaiHistoryItem) => {
    const completeness = calculateCompletenessScore(version.data);
    const isComplete = completeness === 100;

    return (
      <Card key={version.id} className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              {version.type === "assessment" ? (
                <Sparkles className="w-4 h-4 text-purple-500" />
              ) : (
                <Pencil className="w-4 h-4 text-blue-500" />
              )}
              <CardTitle className="text-sm">
                {version.type === "assessment" ? "AI 생성" : "직접 설계"}
              </CardTitle>
              {isComplete && (
                <Badge variant="default" className="bg-green-500 text-xs">
                  완성
                </Badge>
              )}
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleViewVersion(version)}
              >
                <Eye className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={() => handleDeleteVersion(version)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <CardDescription className="flex items-center gap-1 text-xs">
            <Clock className="w-3 h-3" />
            {format(new Date(version.created_at), "PPP p", { locale: ko })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {/* Completeness bar */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">완성도</span>
                <span className="font-medium">{completeness.toFixed(0)}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${completeness}%` }}
                />
              </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">좋아하는 것</span>
                <Badge variant="outline" className="text-xs">
                  {version.data.love_elements.length}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">잘하는 것</span>
                <Badge variant="outline" className="text-xs">
                  {version.data.good_at_elements.length}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">세상이 필요한 것</span>
                <Badge variant="outline" className="text-xs">
                  {version.data.world_needs_elements.length}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">돈 벌 수 있는 것</span>
                <Badge variant="outline" className="text-xs">
                  {version.data.paid_for_elements.length}
                </Badge>
              </div>
            </div>

            {onSelectVersion && (
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2 text-xs"
                onClick={() => onSelectVersion(version)}
              >
                <ArrowRight className="w-3 h-3 mr-1" />
                이 버전 불러오기
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          히스토리 로딩 중...
        </CardContent>
      </Card>
    );
  }

  if (!history || history.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <History className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">아직 저장된 Ikigai가 없습니다.</p>
        </CardContent>
      </Card>
    );
  }

  const assessments = history.filter((v) => v.type === "assessment");
  const designs = history.filter((v) => v.type === "design");

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Ikigai 히스토리
              </CardTitle>
              <CardDescription>
                과거에 생성하거나 설계한 Ikigai 버전들을 확인하세요
              </CardDescription>
            </div>
            <Badge variant="outline">{history.length}개 버전</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">전체 ({history.length})</TabsTrigger>
              <TabsTrigger value="ai">AI 생성 ({assessments.length})</TabsTrigger>
              <TabsTrigger value="design">직접 설계 ({designs.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4">
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-3">
                  {history.map((version) => renderVersionCard(version))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="ai" className="mt-4">
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-3">
                  {assessments.length > 0 ? (
                    assessments.map((version) => renderVersionCard(version))
                  ) : (
                    <p className="text-center text-sm text-muted-foreground py-8">
                      AI로 생성된 Ikigai가 없습니다
                    </p>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="design" className="mt-4">
              <ScrollArea className="h-[600px] pr-4">
                <div className="space-y-3">
                  {designs.length > 0 ? (
                    designs.map((version) => renderVersionCard(version))
                  ) : (
                    <p className="text-center text-sm text-muted-foreground py-8">
                      직접 설계한 Ikigai가 없습니다
                    </p>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Version Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedVersion?.type === "assessment" ? (
                <Sparkles className="w-5 h-5 text-purple-500" />
              ) : (
                <Pencil className="w-5 h-5 text-blue-500" />
              )}
              Ikigai 버전 상세
            </DialogTitle>
            <DialogDescription>
              {selectedVersion &&
                format(new Date(selectedVersion.created_at), "PPP p", { locale: ko })}
            </DialogDescription>
          </DialogHeader>

          {selectedVersion && (
            <div className="space-y-4 mt-4">
              {/* Final Ikigai Text */}
              {"final_ikigai" in selectedVersion.data &&
                selectedVersion.data.final_ikigai && (
                  <Card className="bg-primary/5">
                    <CardHeader>
                      <CardTitle className="text-sm">최종 IKIGAI</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm leading-relaxed">
                        {selectedVersion.data.final_ikigai}
                      </p>
                    </CardContent>
                  </Card>
                )}

              {/* Four Sections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xs">좋아하는 것</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedVersion.data.love_elements.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {selectedVersion.data.love_elements.map((item, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">항목이 없습니다</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-xs">잘하는 것</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedVersion.data.good_at_elements.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {selectedVersion.data.good_at_elements.map((item, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">항목이 없습니다</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-xs">세상이 필요한 것</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedVersion.data.world_needs_elements.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {selectedVersion.data.world_needs_elements.map((item, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">항목이 없습니다</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-xs">돈 벌 수 있는 것</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedVersion.data.paid_for_elements.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {selectedVersion.data.paid_for_elements.map((item, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">항목이 없습니다</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>버전을 삭제하시겠습니까?</AlertDialogTitle>
            <AlertDialogDescription>
              이 작업은 되돌릴 수 없습니다. 선택한 Ikigai 버전이 영구적으로 삭제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
