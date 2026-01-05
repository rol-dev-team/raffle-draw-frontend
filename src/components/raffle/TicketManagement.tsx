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
import {
  importBulkTicketsCsv,
  storeSingleTicket,
  getAllTickets,
  deleteAllTickets,
} from '@/service/employeeApi'; // Assume this API function is defined

import { Loader, Placeholder } from 'rsuite';

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
  const [allTickets, setAllTickets] = useState([]);
  const [bulkInput, setBulkInput] = useState('');
  const [rangeStart, setRangeStart] = useState('');
  const [rangeEnd, setRangeEnd] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showAll, setShowAll] = useState(false);
  const [csvUploading, setCsvUploading] = useState(false);
  const [csvModalOpen, setCsvModalOpen] = useState(false);

  const visibleTickets = showAll ? allTickets : allTickets.slice(0, 10);

  const fetchAllTickets = async () => {
    try {
      const res = await getAllTickets();
      setAllTickets(res.data);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    }
  };

  useEffect(() => {
    fetchAllTickets();
  }, [tickets]);

  const handleBulkAdd = async () => {
    if (!bulkInput.trim()) return;

    try {
      const res = await storeSingleTicket({
        ticket_number: bulkInput.trim(),
      });

      // ✅ Success toast (201)
      toast({
        title: 'Success',
        description: res.message || 'Ticket created successfully',
      });

      setBulkInput('');
      await fetchAllTickets();
    } catch (error: any) {
      // ⚠️ Already exists (409)
      if (error?.response?.status === 409) {
        toast({
          title: 'Already Exists',
          description: error.response.data.message || 'Ticket already exists',
          variant: 'destructive',
        });
      } else {
        // ❌ Other error
        toast({
          title: 'Error',
          description: 'Something went wrong',
          variant: 'destructive',
        });
      }
    }
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast({
        title: 'Invalid File',
        description: 'Please upload a CSV file',
        variant: 'destructive',
      });
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setCsvUploading(true);
      const res = await importBulkTicketsCsv(formData);

      toast({
        title: 'Success',
        description: res.message || 'CSV imported successfully',
      });
      await fetchAllTickets();
      // optional: reload list
      // fetchEmployees();
    } catch (error: any) {
      toast({
        title: 'Import Failed',
        description: error?.response?.data?.message || 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setCsvUploading(false);
      setCsvModalOpen(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClearTickets = async () => {
    try {
      const res = await deleteAllTickets();

      toast({
        title: 'Success',
        description: res.message || 'All tickets deleted successfully',
      });

      setShowAll(false); // optional UX reset
      await fetchAllTickets(); // ✅ refresh list
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to clear tickets',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="h-full w-full">
      <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Ticket className="h-5 w-5 text-primary" />
          Ticket Management
          <Badge variant="secondary" className="ml-auto sm:ml-0">
            {allTickets.length} tickets
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* --- Buttons Row (Single Entry, Range Entry, CSV Import) --- */}
        <div className="flex flex-col sm:flex-row gap-2 w-full">
          {/* Single Entry Modal */}
          <div className="flex-1">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="secondary"
                  className="w-full flex items-center justify-center"
                >
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

          <div className="flex-1">
            {/* <AlertDialog> */}
            <AlertDialog open={csvModalOpen} onOpenChange={setCsvModalOpen}>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full flex items-center justify-center"
                >
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
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleCSVUpload}
                    className="hidden"
                  />
                  {/* <Upload className="h-4 w-4 mr-1" /> Bulk */}
                  {csvUploading ? (
                    <>
                      <Loader size="sm" className="mr-2" />
                      Uploading…
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-1" />
                      Bulk
                    </>
                  )}
                </Button>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={csvUploading}>Cancel</AlertDialogCancel>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* --- Ticket Pool Display --- */}

        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <Label className="text-sm font-medium">Ticket Pool</Label>

            {allTickets.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearTickets}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3 w-3 mr-1" /> Clear All
              </Button>
            )}
          </div>

          <ScrollArea className="h-40 sm:h-52 md:h-64 rounded-md border bg-muted/30 p-2">
            {allTickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <FileSpreadsheet className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">No tickets added yet</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-1">
                {visibleTickets.map((ticket) => (
                  <Badge key={ticket.ticket_number} variant="outline" className="text-xs">
                    {ticket.ticket_number}
                  </Badge>
                ))}

                {/* MORE / LESS TOGGLE */}
                {allTickets.length > 10 && !showAll && (
                  <Badge
                    variant="secondary"
                    className="text-xs cursor-pointer"
                    onClick={() => setShowAll(true)}
                  >
                    +{allTickets.length - 10} more
                  </Badge>
                )}

                {showAll && allTickets.length > 10 && (
                  <Badge
                    variant="secondary"
                    className="text-xs cursor-pointer"
                    onClick={() => setShowAll(false)}
                  >
                    Show less
                  </Badge>
                )}
              </div>
            )}
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
