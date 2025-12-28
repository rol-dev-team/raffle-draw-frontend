import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";

export interface NewOwner {
  branch: string;
  division: string;
  regCode: string;
  name: string;
  department: string;
  designation: string;
  company: string;
  gender: string;
  ticketNumbers: string[];
}

interface AddOwnerModalProps {
  open: boolean;
  onClose: () => void;
  existingTickets: string[];
  onSave: (owner: NewOwner) => void;
}

export function AddOwnerModal({
  open,
  onClose,
  existingTickets,
  onSave,
}: AddOwnerModalProps) {
  const [form, setForm] = useState<NewOwner>({
    branch: "",
    division: "",
    regCode: "",
    name: "",
    department: "",
    designation: "",
    company: "",
    gender: "",
    ticketNumbers: [],
  });

  const [ticketInput, setTicketInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    const tickets = ticketInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const duplicateInInput = tickets.filter(
      (t, i) => tickets.indexOf(t) !== i
    );

    const duplicateExisting = tickets.filter((t) =>
      existingTickets.includes(t)
    );

    const duplicates = [...new Set([...duplicateInInput, ...duplicateExisting])];

    if (duplicates.length > 0) {
      setError(`Duplicate ticket number(s): ${duplicates.join(", ")}`);
      return;
    }

    if (!form.name || tickets.length === 0) {
      setError("Name and Ticket Number are required");
      return;
    }

    onSave({ ...form, ticketNumbers: tickets });
    setTicketInput("");
    setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Ticket Owner</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            ["branch", "Branch"],
            ["division", "Division"],
            ["regCode", "Reg Code"],
            ["name", "Name"],
            ["department", "Department"],
            ["designation", "Designation"],
            ["company", "Company"],
            ["gender", "Gender"],
          ].map(([key, label]) => (
            <div key={key} className="space-y-1">
              <Label>{label}</Label>
              <Input
                value={(form as any)[key]}
                onChange={(e) =>
                  setForm({ ...form, [key]: e.target.value })
                }
              />
            </div>
          ))}

          <div className="sm:col-span-2 space-y-1">
            <Label>Ticket Numbers (comma separated)</Label>
            <Input
              placeholder="e.g. 1001, 1002, 1003"
              value={ticketInput}
              onChange={(e) => setTicketInput(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive mt-2">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Owner</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
