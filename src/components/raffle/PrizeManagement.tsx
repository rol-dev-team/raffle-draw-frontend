import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FloatingInput } from '@/components/ui/FloatingInput';
import { FloatingSelect } from '@/components/ui/FloatingSelect';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Gift, Plus, Trash2, Edit2, Check, X, Upload, Tags } from 'lucide-react';
import { Prize, Category } from '@/types/raffle';
import { toast } from 'sonner';
import Papa from 'papaparse';

interface PrizeManagementProps {
  prizes: Prize[];
  categories: Category[];
  onAddPrize: (name: string, category: Category) => void;
  onAddBulkPrizes: (prizes: Array<{ name: string; category: Category }>) => number;
  onUpdatePrize: (id: string, name: string, category: Category) => void;
  onDeletePrize: (id: string) => void;
  onAddCategory: (name: string) => boolean;
  onDeleteCategory: (name: string) => boolean;
  getPrizesByCategory: (category: Category) => Prize[];
}

const CATEGORY_COLORS: Record<string, { bg: string; fg: string }> = {
  A: { bg: 'bg-category-a/20', fg: 'text-category-a' },
  B: { bg: 'bg-category-b/20', fg: 'text-category-b' },
  C: { bg: 'bg-category-c/20', fg: 'text-category-c' },
};

const getColorForCategory = (category: string) => {
  if (CATEGORY_COLORS[category]) return CATEGORY_COLORS[category];
  const hue = (category.charCodeAt(0) * 137) % 360;
  return { bg: `bg-[hsl(${hue},70%,50%)]/20`, fg: `text-[hsl(${hue},70%,40%)]` };
};

export function PrizeManagement({
  prizes, categories, onAddPrize, onAddBulkPrizes, onUpdatePrize, onDeletePrize,
  onAddCategory, onDeleteCategory, getPrizesByCategory,
}: PrizeManagementProps) {
  const [newPrizeName, setNewPrizeName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | undefined>(undefined);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState<Category>('A');
  const [isCategoryDrawerOpen, setIsCategoryDrawerOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddPrize = () => {
    if (!newPrizeName.trim() || !selectedCategory) return;
    onAddPrize(newPrizeName.trim(), selectedCategory);
    setNewPrizeName('');
    toast.success('Prize added');
  };

  const handleBulkImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      complete: (results) => {
        const prizesData: Array<{ name: string; category: Category }> = [];
        results.data.forEach((row: unknown) => {
          const rowArray = row as string[];
          if (rowArray.length >= 1) {
            const name = rowArray[0]?.trim();
            const category = (rowArray[1]?.trim().toUpperCase() as Category) || selectedCategory;
            if (name && category) {
              if (!categories.includes(category)) onAddCategory(category);
              prizesData.push({ name, category });
            }
          }
        });
        if (prizesData.length > 0) {
          const added = onAddBulkPrizes(prizesData);
          toast.success(`Imported ${added} prizes`);
        } else {
          toast.error('No valid prizes found');
        }
      },
      error: () => toast.error('Failed to parse CSV'),
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    const success = onAddCategory(newCategoryName.trim());
    if (success) {
      toast.success('Category added');
      setNewCategoryName('');
    } else toast.error('Category already exists');
  };

  const getCategoryCount = (category: Category) => {
    const categoryPrizes = getPrizesByCategory(category);
    return { total: categoryPrizes.length, available: categoryPrizes.filter(p => !p.isAssigned).length };
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Gift className="h-5 w-5 text-primary" /> Category & Prize Management
        </CardTitle>
        <Button
          className="bg-primary text-white hover:bg-primary/90 flex items-center gap-1"
          size="sm"
          onClick={() => setIsCategoryDrawerOpen(true)}
        >
          <Tags className="h-4 w-4" /> Add Categories
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Add Prize */}
        <div className="flex flex-col sm:flex-row gap-2 w-full">
          {/* Prize Name Input */}
          {/* <Input
            placeholder="Prize name"
            value={newPrizeName}
            onChange={(e) => setNewPrizeName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddPrize()}
            className="flex-1 min-w-0"
          /> */}
          <FloatingInput
            label="Prize name"
            value={newPrizeName}
            onChange={(e) => setNewPrizeName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddPrize()}
            className="flex-1 min-w-0"
          />


          {/* Category Select */}
          <FloatingSelect
            label="Category"
            value={selectedCategory}
            onValueChange={setSelectedCategory}
            className="w-full sm:w-36 flex-shrink-0"
          >
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </FloatingSelect>

          {/* Add Button */}
          <Button
            onClick={handleAddPrize}
            size="icon"
            className="self-stretch flex-shrink-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>


        {/* Bulk Import */}
        <div>
          <input ref={fileInputRef} type="file" accept=".csv,.txt" onChange={handleBulkImport} className="hidden" />
          <Button variant="outline" className="w-full flex items-center justify-center gap-2" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4" /> Import Prizes from CSV
          </Button>
          <p className="text-xs text-muted-foreground mt-1">CSV format: prize_name, category</p>
        </div>

        <hr className="my-4" />
        <CardTitle className="text-sm">Categories and Prizes</CardTitle>

        {/* Tabs */}
        <Tabs defaultValue={categories[0]} className="w-full">
          <TabsList className="flex flex-wrap gap-1 mb-2">
            {categories.map((cat) => {
              const count = getCategoryCount(cat);
              return (
                <TabsTrigger key={cat} value={cat} className="flex-1 text-sm">
                  {cat} ({count.available}/{count.total})
                </TabsTrigger>
              );
            })}
          </TabsList>

          {categories.map((cat) => (
            <TabsContent key={cat} value={cat} className="mt-2">
              <ScrollArea className="h-[250px] sm:h-[300px] md:h-[400px]">
                <div className="space-y-2 pr-2">
                  {getPrizesByCategory(cat).length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No prizes</div>
                  ) : (
                    getPrizesByCategory(cat).map((prize) => (
                      <div
                        key={prize.id}
                        className={`flex flex-col sm:flex-row sm:items-center justify-between p-2 rounded-lg border ${prize.isAssigned ? 'bg-muted/50 opacity-60' : 'bg-card'} gap-2`}
                      >
                        {editingId === prize.id ? (
                          <div className="flex flex-col sm:flex-row items-center gap-2 flex-1 w-full">
                            <FloatingInput
                              label="Prize name"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="h-10 flex-1 min-w-0"
                            />
                            <Select value={editCategory} onValueChange={setEditCategory}>
                              <SelectTrigger className="w-28 h-8"><SelectValue /></SelectTrigger>
                              <SelectContent>{categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                            </Select>
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { onUpdatePrize(editingId, editName.trim(), editCategory); setEditingId(null); }}><Check className="h-4 w-4 text-green-500" /></Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingId(null)}><X className="h-4 w-4 text-destructive" /></Button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge className={`${getColorForCategory(cat).bg} ${getColorForCategory(cat).fg} border-0`}>{cat}</Badge>
                              <span className={prize.isAssigned ? 'line-through' : ''}>{prize.name}</span>
                              {prize.isAssigned && <Badge variant="outline" className="text-xs">→ #{prize.assignedTo}</Badge>}
                            </div>
                            {!prize.isAssigned && (
                              <div className="flex gap-1 mt-1 sm:mt-0">
                                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditingId(prize.id); setEditName(prize.name); setEditCategory(prize.category); }}><Edit2 className="h-4 w-4" /></Button>
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => onDeletePrize(prize.id)}><Trash2 className="h-4 w-4" /></Button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          ))}

          {/* Overlay */}
          {isCategoryDrawerOpen && <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setIsCategoryDrawerOpen(false)} />}

          {/* Drawer */}
          <div
            className={`fixed top-0 right-0 z-50 h-full w-full sm:w-80 bg-white shadow-xl transform transition-transform duration-300 ${isCategoryDrawerOpen ? "translate-x-0" : "translate-x-full"}`}
          >
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="font-semibold text-lg">Manage Categories</h2>
              <Button size="icon" variant="ghost" onClick={() => setIsCategoryDrawerOpen(false)}><X /></Button>
            </div>
            <div className="p-4 space-y-4 overflow-y-auto">
              <div className="flex gap-2 flex-col sm:flex-row">
                <FloatingInput
                  label="New category"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
                  className="flex-1 min-w-0"
                />

                <Button size="icon" onClick={handleAddCategory}><Plus className="h-4 w-4" /></Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => {
                  const colors = getColorForCategory(cat);
                  const count = getCategoryCount(cat);
                  return (
                    <Badge key={cat} className={`${colors.bg} ${colors.fg} border-0 pr-1`}>
                      {cat} ({count.total})
                      {count.total === 0 && (
                        <Button size="icon" variant="ghost" className="h-4 w-4 ml-1" onClick={() => onDeleteCategory(cat)}>
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </Badge>
                  );
                })}
              </div>
            </div>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}
