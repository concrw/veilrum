/**
 * IkigaiVennDiagram Component
 * Interactive Venn diagram visualization for Ikigai
 * Shows 4 overlapping circles with intersection areas
 */

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { IkigaiIntersectionDialog } from "./IkigaiIntersectionDialog";

type IntersectionType = "passion" | "mission" | "profession" | "vocation" | "ikigai";

interface IkigaiData {
  love: string[];
  goodAt: string[];
  worldNeeds: string[];
  paidFor: string[];
}

interface IkigaiVennDiagramProps {
  data: IkigaiData;
  interactive?: boolean;
  size?: "sm" | "md" | "lg";
  showLabels?: boolean;
}

// Circle positions and colors
const CIRCLES = {
  love: {
    cx: 250,
    cy: 200,
    r: 150,
    fill: "#FF6B9D",
    fillOpacity: 0.3,
    label: "좋아하는 것",
    position: { x: 250, y: 100 },
  },
  goodAt: {
    cx: 350,
    cy: 200,
    r: 150,
    fill: "#4ECDC4",
    fillOpacity: 0.3,
    label: "잘하는 것",
    position: { x: 450, y: 100 },
  },
  worldNeeds: {
    cx: 250,
    cy: 300,
    r: 150,
    fill: "#95E1D3",
    fillOpacity: 0.3,
    label: "세상이 필요한 것",
    position: { x: 150, y: 400 },
  },
  paidFor: {
    cx: 350,
    cy: 300,
    r: 150,
    fill: "#FFE66D",
    fillOpacity: 0.3,
    label: "돈 벌 수 있는 것",
    position: { x: 450, y: 400 },
  },
};

// Intersection labels
const INTERSECTIONS = {
  loveGoodAt: { x: 300, y: 150, label: "열정 (Passion)" },
  loveWorldNeeds: { x: 200, y: 250, label: "사명 (Mission)" },
  goodAtPaidFor: { x: 400, y: 250, label: "직업 (Profession)" },
  worldNeedsPaidFor: { x: 300, y: 350, label: "천직 (Vocation)" },
  center: { x: 300, y: 250, label: "IKIGAI", highlight: true },
};

export function IkigaiVennDiagram({
  data,
  interactive = true,
  size = "md",
  showLabels = true,
}: IkigaiVennDiagramProps) {
  const [hoveredCircle, setHoveredCircle] = useState<keyof typeof CIRCLES | null>(null);
  const [hoveredIntersection, setHoveredIntersection] = useState<keyof typeof INTERSECTIONS | null>(
    null
  );
  const [selectedIntersection, setSelectedIntersection] = useState<IntersectionType | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleIntersectionClick = (type: IntersectionType) => {
    setSelectedIntersection(type);
    setDialogOpen(true);
  };

  // Calculate size multiplier
  const sizeMultiplier = size === "sm" ? 0.6 : size === "lg" ? 1.2 : 1;
  const width = 600 * sizeMultiplier;
  const height = 500 * sizeMultiplier;

  // Check if data is complete
  const isComplete = useMemo(() => {
    return (
      data.love.length > 0 &&
      data.goodAt.length > 0 &&
      data.worldNeeds.length > 0 &&
      data.paidFor.length > 0
    );
  }, [data]);

  // Calculate completeness percentage
  const completeness = useMemo(() => {
    const sections = [data.love, data.goodAt, data.worldNeeds, data.paidFor];
    const filled = sections.filter((s) => s.length > 0).length;
    return (filled / 4) * 100;
  }, [data]);

  const getCircleClassName = (circle: keyof typeof CIRCLES) => {
    if (!interactive) return "";
    return hoveredCircle === circle
      ? "cursor-pointer opacity-100"
      : hoveredCircle
      ? "opacity-40"
      : "cursor-pointer opacity-80 hover:opacity-100";
  };

  const getIntersectionClassName = (intersection: keyof typeof INTERSECTIONS) => {
    if (!interactive) return "";
    return hoveredIntersection === intersection
      ? "fill-primary opacity-100"
      : "opacity-0 hover:opacity-30";
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Progress indicator */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Ikigai 다이어그램</h3>
            <p className="text-sm text-muted-foreground">
              완성도: {completeness.toFixed(0)}%
              {isComplete && " ✨ 완성!"}
            </p>
          </div>
          {isComplete && (
            <Badge variant="default" className="bg-green-500">
              완료
            </Badge>
          )}
        </div>

        {/* SVG Venn Diagram */}
        <TooltipProvider>
          <svg
            width={width}
            height={height}
            viewBox={`0 0 ${600} ${500}`}
            className="mx-auto"
            style={{ maxWidth: "100%" }}
          >
            {/* Define gradients */}
            <defs>
              <radialGradient id="loveGradient">
                <stop offset="0%" stopColor={CIRCLES.love.fill} stopOpacity="0.5" />
                <stop offset="100%" stopColor={CIRCLES.love.fill} stopOpacity="0.2" />
              </radialGradient>
              <radialGradient id="goodAtGradient">
                <stop offset="0%" stopColor={CIRCLES.goodAt.fill} stopOpacity="0.5" />
                <stop offset="100%" stopColor={CIRCLES.goodAt.fill} stopOpacity="0.2" />
              </radialGradient>
              <radialGradient id="worldNeedsGradient">
                <stop offset="0%" stopColor={CIRCLES.worldNeeds.fill} stopOpacity="0.5" />
                <stop offset="100%" stopColor={CIRCLES.worldNeeds.fill} stopOpacity="0.2" />
              </radialGradient>
              <radialGradient id="paidForGradient">
                <stop offset="0%" stopColor={CIRCLES.paidFor.fill} stopOpacity="0.5" />
                <stop offset="100%" stopColor={CIRCLES.paidFor.fill} stopOpacity="0.2" />
              </radialGradient>
            </defs>

            {/* Circles */}
            {Object.entries(CIRCLES).map(([key, circle]) => (
              <Tooltip key={key}>
                <TooltipTrigger asChild>
                  <circle
                    cx={circle.cx}
                    cy={circle.cy}
                    r={circle.r}
                    fill={`url(#${key}Gradient)`}
                    stroke={circle.fill}
                    strokeWidth="2"
                    className={getCircleClassName(key as keyof typeof CIRCLES)}
                    onMouseEnter={() => interactive && setHoveredCircle(key as keyof typeof CIRCLES)}
                    onMouseLeave={() => interactive && setHoveredCircle(null)}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <div className="max-w-xs">
                    <p className="font-semibold mb-2">{circle.label}</p>
                    {data[key as keyof IkigaiData].length > 0 ? (
                      <ul className="text-xs space-y-1">
                        {data[key as keyof IkigaiData].slice(0, 5).map((item, idx) => (
                          <li key={idx}>• {item}</li>
                        ))}
                        {data[key as keyof IkigaiData].length > 5 && (
                          <li className="text-muted-foreground">
                            ...외 {data[key as keyof IkigaiData].length - 5}개
                          </li>
                        )}
                      </ul>
                    ) : (
                      <p className="text-xs text-muted-foreground">아직 입력되지 않았습니다</p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            ))}

            {/* Intersection hover areas (clickable) */}
            {interactive && (
              <>
                {/* Passion: love + goodAt */}
                <circle
                  cx={INTERSECTIONS.loveGoodAt.x}
                  cy={INTERSECTIONS.loveGoodAt.y}
                  r={40}
                  className="fill-pink-400 opacity-0 hover:opacity-30 cursor-pointer"
                  onClick={() => handleIntersectionClick("passion")}
                />
                {/* Mission: love + worldNeeds */}
                <circle
                  cx={INTERSECTIONS.loveWorldNeeds.x}
                  cy={INTERSECTIONS.loveWorldNeeds.y}
                  r={40}
                  className="fill-green-400 opacity-0 hover:opacity-30 cursor-pointer"
                  onClick={() => handleIntersectionClick("mission")}
                />
                {/* Profession: goodAt + paidFor */}
                <circle
                  cx={INTERSECTIONS.goodAtPaidFor.x}
                  cy={INTERSECTIONS.goodAtPaidFor.y}
                  r={40}
                  className="fill-blue-400 opacity-0 hover:opacity-30 cursor-pointer"
                  onClick={() => handleIntersectionClick("profession")}
                />
                {/* Vocation: worldNeeds + paidFor */}
                <circle
                  cx={INTERSECTIONS.worldNeedsPaidFor.x}
                  cy={INTERSECTIONS.worldNeedsPaidFor.y}
                  r={40}
                  className="fill-yellow-400 opacity-0 hover:opacity-30 cursor-pointer"
                  onClick={() => handleIntersectionClick("vocation")}
                />
                {/* IKIGAI: center */}
                {isComplete && (
                  <circle
                    cx={INTERSECTIONS.center.x}
                    cy={INTERSECTIONS.center.y}
                    r={50}
                    className="fill-purple-400 opacity-0 hover:opacity-20 cursor-pointer"
                    onClick={() => handleIntersectionClick("ikigai")}
                  />
                )}
              </>
            )}

            {/* Labels */}
            {showLabels && (
              <>
                {/* Circle labels */}
                {Object.entries(CIRCLES).map(([key, circle]) => (
                  <text
                    key={key}
                    x={circle.position.x}
                    y={circle.position.y}
                    textAnchor="middle"
                    className="text-sm font-semibold fill-foreground"
                    style={{ userSelect: "none" }}
                  >
                    {circle.label}
                  </text>
                ))}

                {/* Intersection labels */}
                {Object.entries(INTERSECTIONS).map(([key, intersection]) => (
                  <text
                    key={key}
                    x={intersection.x}
                    y={intersection.y}
                    textAnchor="middle"
                    className={`text-xs font-medium ${
                      intersection.highlight ? "fill-primary font-bold" : "fill-muted-foreground"
                    }`}
                    style={{ userSelect: "none" }}
                  >
                    {intersection.label}
                  </text>
                ))}
              </>
            )}

            {/* Center Ikigai indicator */}
            {isComplete && (
              <g>
                <circle cx="300" cy="250" r="50" fill="white" fillOpacity="0.9" />
                <circle cx="300" cy="250" r="50" fill="none" stroke="#10B981" strokeWidth="3" />
                <text
                  x="300"
                  y="245"
                  textAnchor="middle"
                  className="text-lg font-bold fill-primary"
                >
                  IKIGAI
                </text>
                <text x="300" y="262" textAnchor="middle" className="text-xs fill-green-600">
                  완성!
                </text>
              </g>
            )}
          </svg>
        </TooltipProvider>

        {/* Legend */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
          {Object.entries(CIRCLES).map(([key, circle]) => (
            <div key={key} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: circle.fill }}
              />
              <span className="text-xs font-medium">{circle.label}</span>
              <Badge variant="outline" className="ml-auto text-xs">
                {data[key as keyof IkigaiData].length}
              </Badge>
            </div>
          ))}
        </div>

        {/* Intersection descriptions */}
        {isComplete && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-muted rounded-lg">
              <strong>열정 (Passion):</strong> 좋아하면서 잘하는 것
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <strong>사명 (Mission):</strong> 좋아하면서 세상이 필요로 하는 것
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <strong>직업 (Profession):</strong> 잘하면서 돈을 벌 수 있는 것
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <strong>천직 (Vocation):</strong> 세상이 필요로 하고 돈을 벌 수 있는 것
            </div>
          </div>
        )}
      </div>

      {/* Intersection Dialog */}
      <IkigaiIntersectionDialog
        data={data}
        intersectionType={selectedIntersection}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </Card>
  );
}
