import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FloatingInput } from '@/components/ui/FloatingInput';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Ticket, Upload, Plus, Trash2, FileSpreadsheet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Papa from 'papaparse';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';

interface TicketManagementProps {
  tickets: string[];
  onAddTickets: (tickets: string[]) => void;
  onAddRange: (start: number, end: number) => void;
  onClearTickets: () => void;
  onImportFromOwners?: () => string[];
}

export function TicketManagement({
  tickets,
  onAddTickets,
  onAddRange,
  onClearTickets,
  onImportFromOwners,
}: TicketManagementProps) {
  const { toast } = useToast();
  const [bulkInput, setBulkInput] = useState('');
  const [rangeStart, setRangeStart] = useState('');
  const [rangeEnd, setRangeEnd] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Local storage persistence ---
  useEffect(() => {
    const storedTickets = localStorage.getItem('ticketPool');
    if (storedTickets) {
      const parsed: string[] = JSON.parse(storedTickets);
      onAddTickets(parsed);
    }
  }, []);

  const updateLocalStorage = (newTickets: string[]) => {
    localStorage.setItem('ticketPool', JSON.stringify(newTickets));
  };

  // --- Handlers ---
  const handleBulkAdd = () => {
    if (!bulkInput.trim()) return;

    const newTickets = bulkInput
      .split(/[,\n\s]+/)
      .map(t => t.trim())
      .filter(t => t.length > 0);

    if (newTickets.length === 0) {
      toast({ title: 'No tickets found', description: 'Please enter valid ticket numbers', variant: 'destructive' });
      return;
    }

    const existingSet = new Set(tickets);
    const duplicates = newTickets.filter(t => existingSet.has(t));
    const unique = newTickets.filter(t => !existingSet.has(t));

    onAddTickets(unique);
    updateLocalStorage([...tickets, ...unique]);
    setBulkInput('');

    toast({
      title: 'Tickets added',
      description: `Added ${unique.length} tickets${duplicates.length > 0 ? ` (${duplicates.length} duplicates skipped)` : ''}`,
    });
  };

  const handleRangeAdd = () => {
    const start = parseInt(rangeStart);
    const end = parseInt(rangeEnd);

    if (isNaN(start) || isNaN(end)) {
      toast({ title: 'Invalid range', description: 'Please enter valid numbers', variant: 'destructive' });
      return;
    }

    if (start > end) {
      toast({ title: 'Invalid range', description: 'Start must be less than or equal to end', variant: 'destructive' });
      return;
    }

    if (end - start > 10000) {
      toast({ title: 'Range too large', description: 'Maximum 10,000 tickets at once', variant: 'destructive' });
      return;
    }

    const rangeTickets = Array.from({ length: end - start + 1 }, (_, i) => String(start + i));
    const existingSet = new Set(tickets);
    const unique = rangeTickets.filter(t => !existingSet.has(t));

    onAddRange(start, end);
    updateLocalStorage([...tickets, ...unique]);
    setRangeStart('');
    setRangeEnd('');

    toast({ title: 'Tickets added', description: `Added range ${start} to ${end}` });
  };

  const handleCSVImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      complete: (results) => {
        const csvTickets = results.data
          .flat()
          .map((v: any) => String(v).trim())
          .filter((v: string) => v.length > 0 && !['ticket', 'number'].includes(v.toLowerCase()));

        if (csvTickets.length === 0) {
          toast({ title: 'No tickets found', description: 'CSV file is empty or invalid', variant: 'destructive' });
          return;
        }

        onAddTickets(csvTickets);
        updateLocalStorage([...tickets, ...csvTickets]);
        toast({ title: 'CSV imported', description: `Imported ${csvTickets.length} tickets` });
      },
      error: () => {
        toast({ title: 'Import failed', description: 'Could not parse CSV file', variant: 'destructive' });
      },
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClearTickets = () => {
    onClearTickets();
    localStorage.removeItem('ticketPool');
  };

  return (
    <Card className="h-full w-full">
      <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Ticket className="h-5 w-5 text-primary" />
          Ticket Management
          <Badge variant="secondary" className="ml-auto sm:ml-0">{tickets.length} tickets</Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* --- Buttons Row (Single Entry, Range Entry, CSV Import) --- */}
        <div className="flex flex-col sm:flex-row gap-2 w-full">
          {/* Single Entry Modal */}
          <div className="flex-1">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="secondary" className="w-full flex items-center justify-center">
                  <Plus className="h-4 w-4 mr-2" /> Single Entry
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Add Single Tickets</AlertDialogTitle>
                  <AlertDialogDescription>
                    Enter ticket numbers separated by comma, space, or newline.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <FloatingInput
                  label="Ticket"
                  value={bulkInput}
                  onChange={(e) => setBulkInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleBulkAdd()}
                />
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleBulkAdd}>Add Tickets</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {/* Range Entry Modal */}
          <div className="flex-1">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="secondary" className="w-full">
                  Range Entry
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Add Ticket Range</AlertDialogTitle>
                  <AlertDialogDescription>
                    Enter the start and end numbers of the ticket range.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="flex gap-2 items-center mt-2">
                  <FloatingInput label="Start" type="number" value={rangeStart} onChange={(e) => setRangeStart(e.target.value)} />
                  <span className="text-muted-foreground">to</span>
                  <FloatingInput label="End" type="number" value={rangeEnd} onChange={(e) => setRangeEnd(e.target.value)} />
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleRangeAdd}>Add Range</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {/* CSV Import Modal */}
          <input type="file" accept=".csv" onChange={handleCSVImport} ref={fileInputRef} className="hidden" />
          <div className="flex-1">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="outline" className="w-full flex items-center justify-center">
                  <Upload className="h-4 w-4 mr-2" /> Bulk Import CSV
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Import Tickets from CSV</AlertDialogTitle>
                  <AlertDialogDescription>
                    Upload a CSV file containing ticket numbers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <Button onClick={() => fileInputRef.current?.click()} className="w-full mt-2">
                  Choose CSV File
                </Button>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* --- Ticket Pool Display --- */}
        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <Label className="text-sm font-medium">Ticket Pool</Label>
            {tickets.length > 0 && (
              <Button variant="ghost" size="sm" onClick={handleClearTickets} className="text-destructive hover:text-destructive">
                <Trash2 className="h-3 w-3 mr-1" /> Clear All
              </Button>
            )}
          </div>
          <ScrollArea className="h-40 sm:h-52 md:h-64 rounded-md border bg-muted/30 p-2">
            {tickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <FileSpreadsheet className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">No tickets added yet</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-1">
                {tickets.slice(0, 100).map((ticket) => (
                  <Badge key={ticket} variant="outline" className="text-xs">{ticket}</Badge>
                ))}
                {tickets.length > 100 && (
                  <Badge variant="secondary" className="text-xs">+{tickets.length - 100} more</Badge>
                )}
              </div>
            )}
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}