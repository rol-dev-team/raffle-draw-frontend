// TicketOwnersPage.tsx
import { useState, useRef, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SelectItem } from "@/components/ui/select";
import { StepBack, Pencil } from 'lucide-react';
// fetch api functions
import { getOwners, addOwner, updateOwner, deleteOwner } from "@/api/ticketOwnersApi";

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
  // const [owners, setOwners] = useState<TicketOwner[]>([]);
  const [owners, setOwners] = useState<TicketOwner[]>([]);



  const [page, setPage] = useState<PageView>("search");
  const [, setRegistrations] = useState([]);

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
  // For Table Data Editing
  const [editingOwnerId, setEditingOwnerId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<Partial<TicketOwner>>({});

  // Fetch owners from API on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await getOwners();

        // এপিআই রেসপন্স থেকে ডেটা নেওয়া
        const rawData = response?.data || [];
        
        const sanitizedData = rawData.map((owner: any) => ({
          ...owner,
          // ✅ এপিআই দিচ্ছে 'tickets' (String), আমরা সেটাকে 'ticketNumbers' (Array) করছি
          ticketNumbers: owner.tickets 
            ? owner.tickets.split(",").map((t: string) => t.trim()) 
            : []
        }));

        setOwners(sanitizedData);
      } catch (err) {
        console.error("Fetch error:", err);
      }
    };
    loadData();
  }, []);
  // useEffect(() => {
  //   const loadData = async () => {
  //     try {
  //       const response = await getOwners(); // আপনার API কল
        
  //       // ডেটা সেফলি হ্যান্ডেল করা যাতে map error না আসে
  //       // const data = Array.isArray(response) ? response : response?.data || [];
  //       const data = (response as any).data;
        
  //       // নিশ্চিত করা যে ticketNumbers সবসময় একটি array
  //       const sanitizedData = data.map((owner: any) => ({
  //         ...owner,
  //         ticketNumbers: Array.isArray(owner.ticketNumbers) ? owner.ticketNumbers : []
  //       }));

  //       setOwners(sanitizedData);
  //     } catch (err) {
  //       console.error("Fetch error:", err);
  //       toast({ title: "Error", description: "ডেটা লোড করতে ব্যর্থ হয়েছে", variant: "destructive" });
  //     }
  //   };

  //   loadData();
  // }, []); // [] মানে শুধু পেজ লোড হওয়ার সময় একবার কল হবে

  const handleAddOwner = async () => {
    try {
      const tickets = ticketInputs.map((t) => t.trim()).filter(Boolean);

      if (!name || tickets.length === 0) {
        return toast({
          title: "Error",
          description: "Name and ticket number required",
          variant: "destructive",
        });
      }

      // ডুপ্লিকেট চেক (এডিট করার সময় নিজের টিকিট বাদ দিয়ে চেক করতে হয়)
      const allTickets = owners
        .filter(o => o.id !== editingOwnerId) // এডিট করলে নিজের টিকিট বাদ দিন
        .flatMap((o) => o.ticketNumbers || []); // undefined হলে খালি অ্যারে ধরবে

      const duplicate = tickets.find((t) => allTickets.includes(t));
      if (duplicate) {
        return toast({
          title: "Duplicate Ticket",
          description: `Ticket ${duplicate} already exists`,
          variant: "destructive",
        });
      }

      const payload = {
        name,
        company,
        branch,
        division,
        department,
        designation,
        reg_code: regCode,
        gender,
        ticketNumbers: tickets,
      };

      if (editingOwnerId) {
        // এডিট লজিক (যদি এডিট API থাকে)
        // const updated = await updateOwner(editingOwnerId, payload);
        // setOwners(prev => prev.map(o => o.id === editingOwnerId ? updated : o));
      } else {
        const savedOwner = await addOwner(payload);
        
        // ✅ গুরুত্বপূর্ণ: API থেকে আসা ডেটাতে ticketNumbers না থাকলে খালি অ্যারে দিন
        const safeOwner = {
          ...savedOwner,
          ticketNumbers: savedOwner.ticketNumbers || [] 
        };

        setOwners((prev) => [...prev, safeOwner]);
      }

      toast({ title: "Success", description: "Operation successful" });

      // ফর্ম রিসেট
      resetForm();
      setPage("table");
    } catch (err: any) {
      // ... আপনার ক্যাচ ব্লক
    }
  };

  // একটি আলাদা ফাংশনে রিসেট লজিক রাখা ভালো
  const resetForm = () => {
    setName("");
    setCompany("");
    setBranch("");
    setDivision("");
    setDepartment("");
    setDesignation("");
    setRegCode("");
    setGender("");
    setTicketInputs([""]);
    setEditingOwnerId(null);
  };

  /* ================= CSV EXPORT ================= */
  const handleExport = () => {
    const headers = ["Name", "Branch", "Division", "Reg Code", "Department", "Designation", "Company", "Gender", "Tickets"];
    const rows = owners.map((o) => [o.name, o.branch, o.division, o.reg_code, o.department, o.designation, o.company, o.gender, o.ticketNumbers.join(",")]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "ticket-owners.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-2 sm:p-4 md:p-6 max-w-full space-y-4 sm:space-y-6">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between px-1">
        <div className="flex items-center gap-2 min-w-0">
          <Users className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
          <h1 className="text-xl sm:text-2xl font-bold truncate">Tickets</h1>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-row flex-wrap gap-2 w-full lg:w-auto">
          <div className="flex gap-2 col-span-2 sm:col-auto">
            <Button variant="outline" onClick={() => setPage("table")} className="flex-1 sm:w-12">
              <TableIcon className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="flex-1">
              <Upload className="h-4 w-4 mr-1" /> Bulk
            </Button>
          </div>
          
          {page === "table" && (
            <>
              <Button variant="outline" onClick={handleExport} className="col-span-1">
                <Download className="h-4 w-4 mr-1" /> Export
              </Button>
              <Button onClick={() => setPage("search")} className="col-span-1 bg-black text-white">
                <StepBack className="w-4 h-4" /> Back
              </Button>
            </>
          )}

          <Button onClick={() => setPage("add")} className="col-span-2 sm:col-auto">
            <Plus className="h-4 w-4 mr-1" /> Add Ticket
          </Button>
          <input ref={fileInputRef} type="file" accept=".csv" className="hidden" />
        </div>
      </div>

      {/* ================= ADD OWNER PAGE ================= */}
      {page === "add" && (
        <Card className="max-w-4xl mx-auto shadow-lg border-t-4 border-t-primary">
          <CardHeader className="border-b bg-muted/30 p-4">
            <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" /> Registration Details
            </CardTitle>
          </CardHeader>

          <CardContent className="pt-6 space-y-6 p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FloatingInput label="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
              <FloatingInput label="Company" value={company} onChange={(e) => setCompany(e.target.value)} />
              <FloatingInput label="Branch" value={branch} onChange={(e) => setBranch(e.target.value)} />
              <FloatingInput label="Division" value={division} onChange={(e) => setDivision(e.target.value)} />
              <FloatingInput label="Department" value={department} onChange={(e) => setDepartment(e.target.value)} />
              <FloatingInput label="Designation" value={designation} onChange={(e) => setDesignation(e.target.value)} />
              <FloatingInput label="Employ Id" value={regCode} onChange={(e) => setRegCode(e.target.value)} />
              <FloatingSelect label="Gender" value={gender} onValueChange={setGender} className="w-full">
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
              </FloatingSelect>
            </div>

            {/* Ticket Numbers Section */}
            <div className="border-t pt-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Badge variant="outline" className="rounded-full h-6 w-6 p-0 flex items-center justify-center bg-primary/10">
                    {ticketInputs.length}
                  </Badge>
                  Ticket Numbers
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setTicketInputs([...ticketInputs, ""])}
                  className="text-xs border-dashed w-full sm:w-auto"
                >
                  <Plus className="h-3 w-3 mr-1" /> Add Another
                </Button>
              </div>

              {/* Dynamic Ticket Inputs */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {ticketInputs.map((t, i) => (
                  <div key={i} className="relative">
                    <FloatingInput
                      label={`#${i + 1}`}
                      value={t}
                      onChange={(e) => {
                        const copy = [...ticketInputs];
                        copy[i] = e.target.value;
                        setTicketInputs(copy);
                      }}
                    />
                    {ticketInputs.length > 1 && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="absolute top-1 right-1 h-5 w-5 p-0"
                        onClick={() => {
                          const copy = ticketInputs.filter((_, idx) => idx !== i);
                          setTicketInputs(copy);
                        }}
                      >
                        ✕
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 flex flex-col sm:flex-row gap-3">
              <Button variant="ghost" className="order-2 sm:order-1 flex-1 shadow-sm" onClick={() => setPage("search")}>
                Cancel
              </Button>

              <Button
                className="order-1 sm:order-2 flex-[2] font-bold h-12"
                onClick={async () => {
                  // ১. টিকিট ডাটা ক্লিন করা
                  const tickets = ticketInputs.map(t => t.trim()).filter(Boolean);

                  // ২. ভ্যালিডেশন
                  if (!name || tickets.length === 0) {
                    return toast({
                      title: "Error",
                      description: "Name and at least one ticket are required",
                      variant: "destructive",
                    });
                  }

                  try {
                    // ৩. এপিআই এর জন্য পেলোড তৈরি (পেলোডে 'id' পাঠানো যাবে না)
                    const payload = {
                      name,
                      company,
                      branch,
                      division,
                      department,
                      designation,
                      reg_code: regCode,
                      gender,
                      ticketNumbers: tickets,
                    };

                    // ৪. এপিআই কল করে ডাটাবেসে সেভ করা
                    const savedOwner = await addOwner(payload);

                    // ৫. লোকাল স্টেট আপডেট করা যাতে রিফ্রেশ ছাড়াই টেবিলে ডাটা দেখা যায়
                    setOwners(prev => [...prev, savedOwner]);

                    // ৬. সাকসেস মেসেজ ও ফর্ম রিসেট
                    toast({
                      title: "Success",
                      description: "Data saved to database successfully!",
                    });

                    // ফর্ম রিসেট করার ফাংশন কল
                    resetForm();
                    setPage("table");

                  } catch (err: any) {
                    console.error("Database Save Error:", err);
                    toast({
                      title: "Save Failed",
                      description: err.response?.data?.message || "Could not save to database",
                      variant: "destructive",
                    });
                  }
                }}
              >
                Save
              </Button>
            </div>
          </CardContent>
        </Card>

      )}

      {/* ================= TABLE PAGE (Optimized for Mobile) ================= */}
      {page === "table" && (
        <>
        <div className="w-full">
          {/* Desktop Table: Hidden on Mobile */}
          <div className="hidden md:block overflow-x-auto border rounded-lg">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 border-b">Name</th>
                  <th className="px-4 py-3 border-b">Company</th>
                  <th className="px-4 py-3 border-b">Branch/Dept</th>
                  <th className="px-4 py-3 border-b">Employ Id</th>
                  <th className="px-4 py-3 border-b">Tickets</th>
                  <th className="px-4 py-3 border-b text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {Array.isArray(owners) && owners.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{o.name}</td>
                    <td className="px-4 py-3">
                      {editingOwnerId === o.id ? (
                        <Input
                          value={editingData.company}
                          onChange={(e) =>
                            setEditingData((prev) => ({ ...prev, company: e.target.value }))
                          }
                          className="text-sm"
                        />
                      ) : (
                        o.company
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {editingOwnerId === o.id ? (
                        <div className="space-y-1">
                          <Input
                            value={editingData.branch}
                            onChange={(e) =>
                              setEditingData((prev) => ({ ...prev, branch: e.target.value }))
                            }
                            className="text-sm"
                          />
                          <Input
                            value={editingData.department}
                            onChange={(e) =>
                              setEditingData((prev) => ({ ...prev, department: e.target.value }))
                            }
                            className="text-sm"
                          />
                        </div>
                      ) : (
                        <>
                          <div className="font-semibold">{o.branch}</div>
                          <div className="text-gray-500">{o.department}</div>
                        </>
                      )}
                    </td>
                    <td className="px-4 py-3">{o.reg_code}</td>
                    <td className="px-4 py-3">
                      {editingOwnerId === o.id ? (
                        <Input
                          // এডিট করার সময় অ্যারে কে আবার স্ট্রিং করে দেখানো
                          value={editingData.ticketNumbers?.join(", ") || ""}
                          onChange={(e) =>
                            setEditingData((prev) => ({
                              ...prev,
                              // ইউজার টাইপ করলে সেটাকে আবার অ্যারেতে রূপান্তর
                              ticketNumbers: e.target.value.split(",").map((t) => t.trim())
                            }))
                          }
                          className="text-sm"
                        />
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {/* ম্যাপিং এর পর টিকিটগুলো এখানে দেখা যাবে */}
                          {o.ticketNumbers?.map((t) => (
                            <Badge key={t} variant="secondary" className="text-[10px]">
                              {t}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center space-x-1">
                      {editingOwnerId === o.id ? (
                        <>
                          <Button
                            size="sm"
                            onClick={async () => {
                              try {
                                // Call API to update owner
                                await updateOwner(o.id, editingData);
                                // Update local state
                                setOwners((prev) =>
                                  prev.map((owner) =>
                                    owner.id === o.id ? { ...owner, ...editingData } : owner
                                  )
                                );
                                setEditingOwnerId(null);
                                toast({ title: "Success", description: "Owner updated" });
                              } catch (err: any) {
                                toast({
                                  title: "Error",
                                  description: err?.response?.data?.message || "Failed to update owner",
                                  variant: "destructive",
                                });
                              }
                            }}
                          >
                            Save
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingOwnerId(null)}>
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => {
                            setEditingOwnerId(o.id);
                            setEditingData({ ...o });
                          }}
                        >
                          <Pencil className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile List: Visible only on small screens */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {owners.map((o) => (
              <Card
                key={o.id}
                className="p-4 space-y-2 border-l-4 border-l-primary relative"
              >
                {editingOwnerId === o.id && (
                  <div className="absolute top-2 right-2 flex gap-1">
                    <Button
                      size="sm"
                      onClick={() => {
                        setOwners((prev) =>
                          prev.map((owner) =>
                            owner.id === o.id ? { ...owner, ...editingData } : owner
                          )
                        );
                        setEditingOwnerId(null);
                      }}
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingOwnerId(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                )}

                {/* Edit / Display Mode */}
                {editingOwnerId === o.id ? (
                  <div className="space-y-2">
                    <FloatingInput
                      label="Full Name"
                      value={editingData.name}
                      onChange={(e) =>
                        setEditingData((prev) => ({ ...prev, name: e.target.value }))
                      }
                    />
                    <FloatingInput
                      label="Company"
                      value={editingData.company}
                      onChange={(e) =>
                        setEditingData((prev) => ({ ...prev, company: e.target.value }))
                      }
                    />
                    <FloatingInput
                      label="Branch"
                      value={editingData.branch}
                      onChange={(e) =>
                        setEditingData((prev) => ({ ...prev, branch: e.target.value }))
                      }
                    />
                    <FloatingInput
                      label="Department"
                      value={editingData.department}
                      onChange={(e) =>
                        setEditingData((prev) => ({ ...prev, department: e.target.value }))
                      }
                    />
                    <FloatingInput
                      label="Designation"
                      value={editingData.designation}
                      onChange={(e) =>
                        setEditingData((prev) => ({ ...prev, designation: e.target.value }))
                      }
                    />
                    <FloatingSelect
                      label="Gender"
                      value={editingData.gender}
                      onValueChange={(v) =>
                        setEditingData((prev) => ({ ...prev, gender: v }))
                      }
                    >
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                    </FloatingSelect>
                    <FloatingInput
                      label="Tickets (comma separated)"
                      value={editingData.ticketNumbers.join(", ")}
                      onChange={(e) =>
                        setEditingData((prev) => ({
                          ...prev,
                          ticketNumbers: e.target.value.split(",").map((t) => t.trim()),
                        }))
                      }
                    />
                    <p className="text-xs text-gray-500">Employ Id: {o.reg_code}</p>
                  </div>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 h-8 w-8 p-0"
                      onClick={() => {
                        setEditingOwnerId(o.id);
                        setEditingData({ ...o });
                      }}
                    >
                      <Pencil className="h-4 w-4 text-muted-foreground" />
                    </Button>

                    <div className="flex justify-between items-start pr-8">
                      <div>
                        <h4 className="font-bold text-lg">{o.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          {o.designation} • {o.reg_code}
                        </p>
                      </div>
                      <Badge>{o.gender[0]}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs border-t pt-2">
                      <div>
                        <span className="text-gray-400">Branch:</span> {o.branch}
                      </div>
                      <div>
                        <span className="text-gray-400">Dept:</span> {o.department}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {o.ticketNumbers?.map((t) => (
                        <Badge key={t} variant="outline" className="bg-blue-50">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </>
                )}
              </Card>
            ))}
          </div>
        </div>

        </>
      )}

      {/* ================= SEARCH PAGE ================= */}
      {page === "search" && (
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6 px-4 sm:px-6">
              <div className="flex justify-center w-full">
                <div className="flex w-full max-w-lg border rounded-md overflow-hidden shadow-sm">
                  <Input
                    placeholder="Enter ticket number"
                    value={searchTicket}
                    onChange={(e) => setSearchTicket(e.target.value)}
                    className="font-bold text-2xl border-0 flex-1 rounded-none focus-visible:ring-0 placeholder:font-bold placeholder:text-xl focus:font-bold focus:text-2xl transition-all duration-200"
                  />
                  <Button onClick={() => setSearchedTicket(searchTicket)} className="rounded-none px-6">Search</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {searchedTicket && (
            <div className="flex justify-center p-2">
              {searchedOwner ? (
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
                <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-xl w-full">
                  No ticket found for "{searchedTicket}"
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}