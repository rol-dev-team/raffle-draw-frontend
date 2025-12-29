
import { useState, useRef, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FloatingInput } from "@/components/ui/FloatingInput";
import { FloatingSelect } from "@/components/ui/FloatingSelect";
import IDCard from "@/components/raffle/IDCard";
import {
  Users,
  Plus,
  TableIcon,
  Upload,
  Download,
  Search,
} from "lucide-react";
import Papa from "papaparse";
import { useToast } from "@/hooks/use-toast";
import { SelectItem } from "@/components/ui/select";
  import { importEmployeesCsv } from "@/service/employeeApi";

export interface TicketOwner {
  id: string;
  branch: string;
  division: string;
  reg_code: string;
  name: string;
  department: string;
  designation: string;
  company: string;
  gender: string;
  ticketNumbers: string[];
}

type PageView = "search" | "add" | "table";

export default function TicketOwnersPage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ====== DUMMY DATA ======
  const [owners, setOwners] = useState<TicketOwner[]>([
    {
      id: crypto.randomUUID(),
      name: "Md Ashikur Rahman",
      company: "Race Online Limited",
      branch: "Dhaka",
      division: "IT",
      department: "IT & Billing",
      designation: "Software Developer",
      reg_code: "REG-2210",
      gender: "Male",
      ticketNumbers: ["T001", "T002"],
    },
    {
      id: crypto.randomUUID(),
      name: "Md Abu Rayhan",
      company: "Race Online Limited",
      branch: "Chittagong",
      division: "Marketing",
      department: "Sales",
      designation: "Marketing Executive",
      reg_code: "REG-2211",
      gender: "Male",
      ticketNumbers: ["T003"],
    },
    {
      id: crypto.randomUUID(),
      name: "Farhana Akter",
      company: "Race Online Limited",
      branch: "Dhaka",
      division: "HR",
      department: "Human Resources",
      designation: "HR Manager",
      reg_code: "REG-2212",
      gender: "Female",
      ticketNumbers: ["T004", "T005"],
    },
    {
      id: crypto.randomUUID(),
      name: "Rahim Uddin",
      company: "Race Online Limited",
      branch: "Khulna",
      division: "Finance",
      department: "Accounts",
      designation: "Accountant",
      reg_code: "REG-2213",
      gender: "Male",
      ticketNumbers: ["T006"],
    },
    {
      id: crypto.randomUUID(),
      name: "Sayed Hossain",
      company: "Race Online Limited",
      branch: "Sylhet",
      division: "IT",
      department: "IT & Billing",
      designation: "Frontend Developer",
      reg_code: "REG-2214",
      gender: "Female",
      ticketNumbers: ["T007", "T008"],
    },
  ]);

  const [page, setPage] = useState<PageView>("search");
  const [registrations, setRegistrations] = useState([]);

  /* ================= SEARCH ================= */
  const [searchTicket, setSearchTicket] = useState("");
  const [searchedTicket, setSearchedTicket] = useState("");

  const searchedOwner = searchedTicket
    ? owners.find((o) => o.ticketNumbers.includes(searchedTicket.trim()))
    : null;

  /* ================= ADD OWNER FORM ================= */
  const [branch, setBranch] = useState("");
  const [division, setDivision] = useState("");
  const [regCode, setRegCode] = useState("");
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [designation, setDesignation] = useState("");
  const [company, setCompany] = useState("");
  const [gender, setGender] = useState("");
  const [ticketInputs, setTicketInputs] = useState([""]);

  const handleAddOwner = () => {
    const newEntry = {
      name,
      company,
      branch,
      division,
      department,
      designation,
      regCode,
      gender,
      tickets: [...ticketInputs],
    };

    setRegistrations((prev) => [...prev, newEntry]);

    // Optionally reset form
    setName("");
    setCompany("");
    setBranch("");
    setDivision("");
    setDepartment("");
    setDesignation("");
    setRegCode("");
    setGender("");
    setTicketInputs([]);

    const tickets = ticketInputs.map((t) => t.trim()).filter(Boolean);

    if (!name || tickets.length === 0) {
      return toast({
        title: "Error",
        description: "Name and ticket number required",
        variant: "destructive",
      });
    }

    const allTickets = owners.flatMap((o) => o.ticketNumbers);
    const duplicate = tickets.find((t) => allTickets.includes(t));

    if (duplicate) {
      return toast({
        title: "Duplicate Ticket",
        description: `Ticket ${duplicate} already exists`,
        variant: "destructive",
      });
    }

    setOwners((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        branch,
        division,
        reg_code: regCode,
        name,
        department,
        designation,
        company,
        gender,
        ticketNumbers: tickets,
      },
    ]);

    toast({ title: "Success", description: "Owner added" });
    setPage("table");
  };

  /* ================= CSV EXPORT ================= */
  const handleExport = () => {
    const headers = [
      "Name",
      "Branch",
      "Division",
      "Reg Code",
      "Department",
      "Designation",
      "Company",
      "Gender",
      "Tickets",
    ];

    const rows = owners.map((o) => [
      o.name,
      o.branch,
      o.division,
      o.reg_code,
      o.department,
      o.designation,
      o.company,
      o.gender,
      o.ticketNumbers.join(","),
    ]);

    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${v}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ticket-owners.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  if (!file.name.endsWith(".csv")) {
    toast({
      title: "Invalid File",
      description: "Please upload a CSV file",
      variant: "destructive",
    });
    return;
  }

  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await importEmployeesCsv(formData);

    toast({
      title: "Success",
      description: res.message || "CSV imported successfully",
    });

    // optional: reload list
    // fetchEmployees();

  } catch (error: any) {
    toast({
      title: "Import Failed",
      description:
        error?.response?.data?.message || "Something went wrong",
      variant: "destructive",
    });
  } finally {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }
};



  return (
    <div className="p-4 md:p-6 max-w-full space-y-6">
      {/* HEADER */}
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Tickets</h1>
        </div>

        <div className="flex gap-2">
          {/* <Button onClick={() => setPage("add")}>
            <Plus className="h-4 w-4 mr-1" /> Add Ticket
          </Button> */}

          <Button variant="outline" onClick={() => setPage("table")}>
            <TableIcon className="h-4 w-4" />
          </Button>

          <Button variant="outline" onClick={() => fileInputRef.current?.click()}
            >
            <input ref={fileInputRef} type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" /> 
            <Upload className="h-4 w-4 mr-1" /> Bulk Import
          </Button>

          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" /> Export
          </Button>

          <Button onClick={() => setPage("add")}>
            <Plus className="h-4 w-4 mr-1" /> Add Ticket
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
          />
        </div>
      </div>

      {/* ================= ADD OWNER PAGE ================= */}
      {page === "add" && (
        <Card className="max-w-4xl mx-auto shadow-lg border-t-4 border-t-primary">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="text-xl flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Registration Details
            </CardTitle>
          </CardHeader>

          <CardContent className="pt-6 space-y-6">
            {/* Main Form Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FloatingInput
                label="Full Name"
                onChange={(e) => setName(e.target.value)}
              />
              <FloatingInput
                label="Company"
                onChange={(e) => setCompany(e.target.value)}
              />
              <FloatingInput
                label="Branch"
                onChange={(e) => setBranch(e.target.value)}
              />
              <FloatingInput
                label="Division"
                onChange={(e) => setDivision(e.target.value)}
              />
              <FloatingInput
                label="Department"
                onChange={(e) => setDepartment(e.target.value)}
              />
              <FloatingInput
                label="Designation"
                onChange={(e) => setDesignation(e.target.value)}
              />
              <FloatingInput
                label="Employ Id"
                onChange={(e) => setRegCode(e.target.value)}
              />
              <FloatingSelect
                label="Gender"
                value={gender}
                onValueChange={setGender}
                className="w-full"
              >
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
              </FloatingSelect>
            </div>

            {/* Ticket Section */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="rounded-full h-6 w-6 p-0 flex items-center justify-center bg-primary/10"
                  >
                    {ticketInputs.length}
                  </Badge>
                  Assigned Ticket Numbers
                </h3>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setTicketInputs([...ticketInputs, ""])}
                  className="text-xs border-dashed"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Another Ticket
                </Button>
              </div>

              {/* Dynamic Ticket Inputs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {ticketInputs.map((t, i) => (
                  <FloatingInput
                    key={i}
                    label={`Ticket #${i + 1}`}
                    className="font-mono text-center"
                    value={t}
                    onChange={(e) => {
                      const copy = [...ticketInputs];
                      copy[i] = e.target.value;
                      setTicketInputs(copy);
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 flex gap-3 ">
              <Button
                variant="ghost"
                className="flex-1 bg-transparent shadow-md text-gray-700 hover:bg-gray-100/20"
                onClick={() => setPage("search")}
              >
                Cancel
              </Button>

              <Button
                className="flex-[2] font-bold text-lg h-12 shadow-md hover:shadow-primary/20 transition-all"
                onClick={handleAddOwner}
              >
                Save
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ================= TABLE PAGE ================= */}
      {page === "table" && (
        <div className="overflow-x-auto">
          <table className="table-auto w-full mt-6 border">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-2 py-1">Name</th>
                <th className="border px-2 py-1">Company</th>
                <th className="border px-2 py-1">Branch</th>
                <th className="border px-2 py-1">Division</th>
                <th className="border px-2 py-1">Department</th>
                <th className="border px-2 py-1">Designation</th>
                <th className="border px-2 py-1">Reg Code</th>
                <th className="border px-2 py-1">Gender</th>
                <th className="border px-2 py-1">Tickets</th>
              </tr>
            </thead>
            <tbody>
              {owners.map((o, idx) => (
                <tr key={o.id}>
                  <td className="border px-2 py-1">{o.name}</td>
                  <td className="border px-2 py-1">{o.company}</td>
                  <td className="border px-2 py-1">{o.branch}</td>
                  <td className="border px-2 py-1">{o.division}</td>
                  <td className="border px-2 py-1">{o.department}</td>
                  <td className="border px-2 py-1">{o.designation}</td>
                  <td className="border px-2 py-1">{o.reg_code}</td>
                  <td className="border px-2 py-1">{o.gender}</td>
                  <td className="border px-2 py-1">{o.ticketNumbers.join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 flex justify-end">
            <button
              onClick={() => setPage("search")}
              className="px-4 py-2 bg-primary text-white font-semibold rounded shadow hover:bg-primary/90 transition"
            >
              Go to Search Page
            </button>
          </div>
        </div>
      )}

      {/* ================= SEARCH PAGE ================= */}
      {page === "search" && (
        <>
        <Card>
  <CardContent className="pt-6">
    <div className="flex justify-center">
      <div className="flex border rounded-md overflow-hidden w-full max-w-lg mx-auto">
        <Input
          placeholder="Enter ticket number"
          value={searchTicket}
          onChange={(e) => setSearchTicket(e.target.value)}
          className="border-0 flex-1 rounded-none"
        />
        <Button
          onClick={() => setSearchedTicket(searchTicket)}
          className="flex-none px-3 rounded-none border-l-0 text-lg font-bold"
        >
          Search
        </Button>
      </div>

    </div>
  </CardContent>
</Card>
          {/* <Card>
            <CardContent className="pt-6">
              <div className="flex border rounded-md overflow-hidden">
                <Input
                  placeholder="Enter ticket number"
                  value={searchTicket}
                  onChange={(e) => setSearchTicket(e.target.value)}
                  className="border-0"
                />
                <Button onClick={() => setSearchedTicket(searchTicket)}>
                  <Search className="h-5 w-5" />
                  Search
                </Button>
              </div>
            </CardContent>
          </Card> */}

          {searchedTicket &&
            (searchedOwner ? (
              <div className="flex justify-center items-center bg-gray-50">
                <IDCard
                  name={searchedOwner.name}
                  designation={searchedOwner.designation}
                  regNo={searchedOwner.reg_code}
                  department={searchedOwner.department}
                  company={searchedOwner.company}
                  branch={searchedOwner.branch}
                  gender={searchedOwner.gender}
                  ticket={searchedTicket}
                />
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                No ticket found
              </div>
            ))}
        </>
      )}
    </div>
  );
}
