import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart } from "lucide-react";
import { useState } from "react";

interface KeywordCardProps {
  keyword: string;
  definition: string;
  memory: string;
  author: string;
  reactions: number;
  id: string;
}

export function KeywordCard({ keyword, definition, memory, author, reactions, id }: KeywordCardProps) {
  const [liked, setLiked] = useState(false);
  const [currentReactions, setCurrentReactions] = useState(reactions);

  const handleLike = () => {
    setLiked(!liked);
    setCurrentReactions(prev => liked ? prev - 1 : prev + 1);
  };

  return (
    <Card className="p-6 shadow-card hover:shadow-warm transition-all duration-300 bg-black/10 border border-border/50 hover:border-accent/50">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="bg-accent/50 text-accent-foreground font-medium">
            {keyword}
          </Badge>
          <button
            onClick={handleLike}
            className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
          >
            <Heart 
              className={`w-4 h-4 transition-all ${
                liked ? 'fill-primary text-primary scale-110' : 'hover:scale-105'
              }`} 
            />
            <span className="text-sm">{currentReactions}</span>
          </button>
        </div>
        
        <div className="space-y-3">
          <div>
            <h3 className="text-xs font-medium text-muted-foreground mb-1">내 정의</h3>
            <p className="text-sm text-foreground leading-relaxed">{definition}</p>
          </div>
          
          <div>
            <h3 className="text-xs font-medium text-muted-foreground mb-1">각인된 순간</h3>
            <p className="text-sm text-foreground/80 italic leading-relaxed">{memory}</p>
          </div>
        </div>
        
        <div className="pt-2 border-t border-border/30">
          <p className="text-xs text-muted-foreground">by {author}</p>
        </div>
      </div>
    </Card>
  );
}