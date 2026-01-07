import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FloatingSelect } from '@/components/ui/FloatingSelect';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sparkles, AlertCircle, Trophy, User } from 'lucide-react';
import { Category, GroupSize, DrawResult, Prize, TicketOwner } from '@/types/raffle';
import { cn } from '@/lib/utils';
import { drawWithSuffle } from '@/service/employeeApi';

interface DrawExecutionProps {
  tickets: string[];
  categories: Category[];
  getAvailablePrizes: (category: Category) => Prize[];
  isDrawing: boolean;
  currentResults: DrawResult[];
  onExecuteDraw: (
    category: Category,
    groupSize: GroupSize,
    onAnimationTick?: (tickets: string[]) => void,
    selectedPrizeId?: string | null
  ) => Promise<DrawResult[]>;
  onClearResults: () => void;
  getOwnerByTicket: (ticketNumber: string) => TicketOwner | undefined;
}

const CATEGORY_COLORS: Record<string, string> = {
  A: 'bg-category-a text-category-a-foreground',
  B: 'bg-category-b text-category-b-foreground',
  C: 'bg-category-c text-category-c-foreground',
};

const getCategoryColor = (category: string) => {
  if (CATEGORY_COLORS[category]) return CATEGORY_COLORS[category];
  const hue = (category.charCodeAt(0) * 137) % 360;
  return `bg-[hsl(${hue},70%,50%)] text-white`;
};

const groupSizes = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export function DrawExecution({
  tickets,
  categories,
  getAvailablePrizes,
  isDrawing,
  currentResults,
  onExecuteDraw,
  onClearResults,
  getOwnerByTicket,
}: DrawExecutionProps) {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedGroupSize, setSelectedGroupSize] = useState<GroupSize>(null);
  const [animatingTickets, setAnimatingTickets] = useState<string[]>([]);
  const [selectedPrizeId, setSelectedPrizeId] = useState<string | null>(null);
  const [results, setResults] = useState([]);
  const [isloading, setIsloading] = useState(false);

  const availablePrizes = getAvailablePrizes(selectedCategory);
  const canDraw =
    tickets.length >= selectedGroupSize && availablePrizes.length >= selectedGroupSize;
  const prizeSelectedOrNot = selectedGroupSize === 1 ? selectedPrizeId !== null : true;

  useEffect(() => {
    setSelectedPrizeId(null);
  }, [selectedCategory, selectedGroupSize]);

  const getDisabledReason = () => {
    if (tickets.length < selectedGroupSize)
      return `Need ${selectedGroupSize - tickets.length} more tickets`;
    if (availablePrizes.length < selectedGroupSize)
      return `Need ${
        selectedGroupSize - availablePrizes.length
      } more prizes in Category ${selectedCategory}`;
    return null;
  };

  const disabledReason = getDisabledReason();

  const generateRandomTickets = (count: number): string[] => {
    return Array.from({ length: count }, () =>
      Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, '0')
    );
  };

  const handleDraw = async () => {
    if (!canDraw || isDrawing) return;

    // onClearResults();
    setAnimatingTickets([]);
    setIsloading(true);

    // Start shuffle animation immediately
    const animationDuration = 10000; // 20 seconds in milliseconds
    const shuffleInterval = 100; // Update every 100ms for smooth animation
    const startTime = Date.now();

    const shuffleAnimationInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;

      if (elapsed < animationDuration) {
        // Generate random tickets for the current frame
        const randomTickets = generateRandomTickets(selectedGroupSize);
        setAnimatingTickets(randomTickets);
      } else {
        // Animation complete - clear interval
        clearInterval(shuffleAnimationInterval);
      }
    }, shuffleInterval);

    try {
      console.log('Starting draw with:', {
        category: selectedCategory,
        groupSize: selectedGroupSize,
        prizeId: selectedPrizeId,
      });
      const payload = {
        category: selectedCategory,
        groupSize: selectedGroupSize,
        prizeId: selectedPrizeId,
      };
      const response = await drawWithSuffle(payload);
      const flatResults = response.data.flat();
      console.log('Draw results:', flatResults);

      // Wait for shuffle animation to complete
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, animationDuration - elapsedTime);

      setTimeout(() => {
        clearInterval(shuffleAnimationInterval);
        setResults(flatResults);
        setAnimatingTickets(flatResults.map((r) => r.ticket_number));
        setIsloading(false);
      }, remainingTime);
    } catch (error) {
      clearInterval(shuffleAnimationInterval);
      setIsloading(false);
      console.error(error);
      alert(error?.response?.data?.error || 'Draw failed');
    }
  };

  console.log('currentResults:', results);
  console.log('animatingTickets:', animatingTickets);
  const handleClearResults = () => {
    setResults([]);
    onClearResults();
  };
  return (
    // <Card className={cn('h-full', isDrawing && 'pointer-events-none opacity-50 blur-sm')}>
    <Card
      className={cn(
        'relative h-full transition-all duration-200',
        isDrawing && 'pointer-events-none opacity-60 blur-[1px]'
      )}
    >
      {isDrawing && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-background/40 backdrop-blur-[1px]">
          <span className="text-3xl font-medium text-muted-foreground animate-pulse">
            Resetting…
          </span>
        </div>
      )}
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-primary" /> Draw Execution
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Configuration */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Category Select */}
          <div className="space-y-2">
            <FloatingSelect
              label="Select Category"
              value={selectedCategory ?? undefined} // no default selection
              onValueChange={(v: string) => setSelectedCategory(v as Category)}
              className="w-full flex-shrink-0"
              placeholder="Select Category" // this text will show when value is undefined
            >
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat} className="flex items-center gap-2">
                  <span className={cn('w-2 h-2 rounded-full', getCategoryColor(cat))} />
                  Category {cat} ({getAvailablePrizes(cat).length} prizes)
                </SelectItem>
              ))}
            </FloatingSelect>
          </div>

          {/* Group Size Select */}
          <div className="space-y-2">
            <FloatingSelect
              label="Draw Size"
              value={selectedGroupSize?.toString() ?? undefined} // no default selection
              onValueChange={(v) => setSelectedGroupSize(parseInt(v) as GroupSize)}
              className="w-full flex-shrink-0"
              placeholder="Draw Size" // placeholder text
            >
              {groupSizes.map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size} winner{size > 1 ? 's' : ''}
                </SelectItem>
              ))}
            </FloatingSelect>
          </div>
        </div>

        {/* Prize Selection for Single Winner */}
        {selectedGroupSize === 1 && (
          <div className="space-y-1">
            {/* <label className="text-sm font-medium">Select Prize</label> */}
            <FloatingSelect
              label="Select Prize"
              value={selectedPrizeId ?? undefined}
              onValueChange={setSelectedPrizeId}
              className="w-full flex-shrink-0"
            >
              {availablePrizes.map((prize) => (
                <SelectItem key={prize.id} value={prize.id}>
                  {prize.name}
                </SelectItem>
              ))}
            </FloatingSelect>
          </div>
        )}

        {/* Draw Button */}
        <div className="space-y-2">
          <Button
            onClick={handleDraw}
            disabled={!canDraw || isDrawing || isloading || !prizeSelectedOrNot}
            className={cn(
              'w-full h-16 text-xl font-bold transition-all',
              canDraw && !isDrawing ? 'bg-primary hover:bg-primary/90 hover:scale-[1.02]' : ''
            )}
          >
            {isloading ? (
              <span className="flex items-center gap-2 animate-spin-slow">🎰 Drawing...</span>
            ) : (
              <span className="flex items-center gap-2">
                <Trophy className="h-6 w-6" />
                DRAW {selectedGroupSize} WINNER{selectedGroupSize > 1 ? 'S' : ''}
              </span>
            )}
          </Button>
          {disabledReason && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" /> {disabledReason}
            </div>
          )}
        </div>

        {/* Animating Tickets */}
        {isloading && animatingTickets.length > 0 && (
          <div className="p-4 rounded-lg bg-muted/50 border-2 border-dashed border-primary/30 overflow-x-auto">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {animatingTickets.map((ticket, i) => (
                <div
                  key={i}
                  className="p-3 bg-card rounded-lg text-center font-mono text-2xl font-bold shuffle-animation"
                >
                  {ticket}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Current Results */}
        {!isDrawing && results.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Trophy className="h-5 w-5 text-winner" /> Winners!
              </h3>
              <Button variant="outline" size="sm" onClick={handleClearResults}>
                Draw Save
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {results.map((item, index) => {
                return (
                  <div
                    key={item.id}
                    className="winner-card p-4 rounded-xl bg-gradient-to-r from-winner/10 to-winner/5 border-2 border-winner/30 animate-scale-in"
                    style={{ animationDelay: `${index * 150}ms` }}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <div className="text-3xl font-bold font-mono text-foreground">
                          #{item.ticket_number}
                        </div>
                        {/* {owner && (
                          <div className="flex items-center gap-1 text-sm text-primary mt-1">
                            <User className="h-4 w-4" />
                            <span className="font-medium">{owner.name}</span>
                          </div>
                        )} */}
                        <div className="text-lg font-medium text-muted-foreground mt-1">
                          {item.prize}
                        </div>
                      </div>
                      <Badge>Category {item.category}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
