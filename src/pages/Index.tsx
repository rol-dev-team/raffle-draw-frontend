import { TicketManagement } from '@/components/raffle/TicketManagement';
import { PrizeManagement } from '@/components/raffle/PrizeManagement';
import { DrawExecution } from '@/components/raffle/DrawExecution';
import { DrawHistory } from '@/components/raffle/DrawHistory';
import { useRaffleState } from '@/hooks/useRaffleState';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { RotateCcw } from 'lucide-react';
import { TicketOwner } from '@/types/raffle';

interface IndexProps {
  getOwnerByTicket: (ticketNumber: string) => TicketOwner | undefined;
  getAllTicketsFromOwners: () => string[];
}

const Index = ({ getOwnerByTicket, getAllTicketsFromOwners }: IndexProps) => {
  const {
    tickets,
    prizes,
    categories,
    currentResults,
    history,
    isDrawing,
    addTickets,
    addTicketRange,
    clearTickets,
    addPrize,
    addBulkPrizes,
    updatePrize,
    deletePrize,
    addCategory,
    deleteCategory,
    getAvailablePrizes,
    getPrizesByCategory,
    executeDraw,
    resetAll,
    clearCurrentResults,
  } = useRaffleState();

  return (
    <div className="bg-background p-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Raffle Draw</h1>
          <p className="text-sm text-muted-foreground">
            Fair • Transparent • Exciting
          </p>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm">
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset All
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset Everything?</AlertDialogTitle>
              <AlertDialogDescription>
                This will clear all tickets, prizes, and draw history. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={resetAll}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Reset All
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[56%_42%]">
          {/* Top Row */}
          <DrawExecution
            tickets={tickets}
            categories={categories}
            getAvailablePrizes={getAvailablePrizes}
            isDrawing={isDrawing}
            currentResults={currentResults}
            onExecuteDraw={executeDraw}
            onClearResults={clearCurrentResults}
            getOwnerByTicket={getOwnerByTicket}
          />

          <DrawHistory
            history={history}
            onReset={resetAll}
            getOwnerByTicket={getOwnerByTicket}
          />

          {/* Bottom Row */}
          <TicketManagement
            tickets={tickets}
            onAddTickets={addTickets}
            onAddRange={addTicketRange}
            onClearTickets={clearTickets}
            onImportFromOwners={getAllTicketsFromOwners}
          />

          <PrizeManagement
            prizes={prizes}
            categories={categories}
            onAddPrize={addPrize}
            onAddBulkPrizes={addBulkPrizes}
            onUpdatePrize={updatePrize}
            onDeletePrize={deletePrize}
            onAddCategory={addCategory}
            onDeleteCategory={deleteCategory}
            getPrizesByCategory={getPrizesByCategory}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;