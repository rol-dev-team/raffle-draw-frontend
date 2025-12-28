// // TicketOwnersPage.tsx
// import { useState, useRef } from "react";
// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import { Badge } from "@/components/ui/badge";
// import { Separator } from "@/components/ui/separator";
// import { Users, Plus, Upload, Download, Search, Edit, Trash } from "lucide-react";
// import Papa from "papaparse";
// import { useToast } from "@/hooks/use-toast";

// export interface TicketOwner {
//   id: string;
//   name: string;
//   department: string;
//   designation: string;
//   ticketNumbers: string[];
// }

// export default function TicketOwnersPage() {
//   const { toast } = useToast();
//   const fileInputRef = useRef<HTMLInputElement>(null);

//   const [owners, setOwners] = useState<TicketOwner[]>([]);
//   const [searchTicket, setSearchTicket] = useState("");
//   const [viewMode, setViewMode] = useState<"card" | "table">("card");

//   const [openAddModal, setOpenAddModal] = useState(false);
//   const [editOwner, setEditOwner] = useState<TicketOwner | null>(null);

//   const [newName, setNewName] = useState("");
//   const [department, setDepartment] = useState("");
//   const [designation, setDesignation] = useState("");
//   const [ticketInputs, setTicketInputs] = useState([""]);

//   /* ================= TICKET HANDLERS ================= */
//   const handleAddTicketField = () => setTicketInputs([...ticketInputs, ""]);
//   const handleTicketChange = (index: number, value: string) => {
//     const newTickets = [...ticketInputs];
//     newTickets[index] = value;
//     setTicketInputs(newTickets);
//   };
//   const handleRemoveTicketField = (index: number) => {
//     setTicketInputs(ticketInputs.filter((_, i) => i !== index));
//   };

//   /* ================= ADD OWNER ================= */
//   const handleAddOwner = () => {
//     const tickets = ticketInputs.map((t) => t.trim()).filter(Boolean);

//     if (!newName.trim() || !department.trim() || !designation.trim() || tickets.length === 0) {
//       return toast({
//         title: "Error",
//         description: "All fields and at least one ticket are required",
//         variant: "destructive",
//       });
//     }

//     const allTickets = owners.flatMap((o) => o.ticketNumbers);
//     const duplicate = tickets.find((t) => allTickets.includes(t));
//     if (duplicate) {
//       return toast({
//         title: "Duplicate Ticket",
//         description: `Ticket "${duplicate}" is already taken by another user.`,
//         variant: "destructive",
//       });
//     }

//     const newOwner: TicketOwner = {
//       id: crypto.randomUUID(),
//       name: newName.trim(),
//       department: department.trim(),
//       designation: designation.trim(),
//       ticketNumbers: tickets,
//     };

//     setOwners((prev) => [...prev, newOwner]);
//     setNewName("");
//     setDepartment("");
//     setDesignation("");
//     setTicketInputs([""]);
//     setOpenAddModal(false);
//     toast({ title: "Success", description: "Owner added successfully" });
//   };

//   /* ================= UPDATE OWNER ================= */
//   const handleUpdateOwner = () => {
//     if (!editOwner) return;

//     const tickets = editOwner.ticketNumbers.map((t) => t.trim()).filter(Boolean);
//     const otherTickets = owners.filter((o) => o.id !== editOwner.id).flatMap((o) => o.ticketNumbers);
//     const duplicate = tickets.find((t) => otherTickets.includes(t));
//     if (duplicate) {
//       return toast({
//         title: "Duplicate Ticket",
//         description: `Ticket "${duplicate}" is already taken by another user.`,
//         variant: "destructive",
//       });
//     }

//     setOwners((prev) => prev.map((o) => (o.id === editOwner.id ? editOwner : o)));
//     setEditOwner(null);
//     toast({ title: "Updated", description: "Owner updated successfully" });
//   };

//   /* ================= DELETE OWNER ================= */
//   const handleDelete = (id: string) => {
//     setOwners((prev) => prev.filter((o) => o.id !== id));
//     toast({ title: "Deleted", description: "Owner removed" });
//   };

//   /* ================= SEARCH ================= */
//   // Only filter when searchTicket has value
//   const filteredOwners = searchTicket
//     ? owners.filter((o) => o.ticketNumbers.some((t) => t.includes(searchTicket)))
//     : [];

//   /* ================= CSV IMPORT ================= */
//   const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;

//     Papa.parse(file, {
//       header: true,
//       skipEmptyLines: true,
//       complete: (result) => {
//         const imported: TicketOwner[] = [];

//         result.data.forEach((row: any) => {
//           if (!row.Name || !row.Tickets) return;
//           const tickets = row.Tickets.split(",").map((t: string) => t.trim()).filter(Boolean);

//           const existingTickets = owners.flatMap((o) => o.ticketNumbers).concat(
//             imported.flatMap((o) => o.ticketNumbers)
//           );
//           const duplicate = tickets.find((t) => existingTickets.includes(t));
//           if (duplicate) {
//             toast({
//               title: "Duplicate Ticket",
//               description: `Ticket "${duplicate}" in CSV is already taken`,
//               variant: "destructive",
//             });
//             return;
//           }

//           imported.push({
//             id: crypto.randomUUID(),
//             name: row.Name,
//             department: row.Department || "",
//             designation: row.Designation || "",
//             ticketNumbers: tickets,
//           });
//         });

//         if (imported.length > 0) {
//           setOwners((prev) => [...prev, ...imported]);
//           toast({ title: "Imported", description: `${imported.length} owners imported` });
//         }
//       },
//       error: () => toast({ title: "Error", description: "Failed to parse CSV", variant: "destructive" }),
//     });

//     if (fileInputRef.current) fileInputRef.current.value = "";
//   };

//   /* ================= CSV EXPORT ================= */
//   const handleExport = () => {
//     const headers = ["Name", "Department", "Designation", "Tickets"];
//     const rows = owners.map((o) => [o.name, o.department, o.designation, o.ticketNumbers.join(",")]);
//     const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");

//     const blob = new Blob([csv], { type: "text/csv" });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement("a");
//     a.href = url;
//     a.download = "ticket-owners.csv";
//     a.click();
//     URL.revokeObjectURL(url);
//   };

//   return (
//     <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
//       {/* HEADER + VIEW TOGGLE + ADD */}
//       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
//         <div className="flex items-center gap-2">
//           <Users className="h-6 w-6" />
//           <h1 className="text-2xl font-bold">Ticket Owners</h1>
//         </div>

//         <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
//           <Button size="sm" variant={viewMode === "card" ? "default" : "outline"} onClick={() => setViewMode("card")}>Owner Cards</Button>
//           <Button size="sm" variant={viewMode === "table" ? "default" : "outline"} onClick={() => setViewMode("table")}>Table View</Button>

//           {/* Add Owner Modal */}
//           <Dialog open={openAddModal} onOpenChange={setOpenAddModal}>
//             <DialogTrigger asChild>
//               <Button className="ml-0 sm:ml-4 flex items-center gap-1"><Plus className="h-4 w-4" /> Add Owner</Button>
//             </DialogTrigger>
//             <DialogContent className="max-w-md space-y-4">
//               <DialogHeader><DialogTitle>Add Owner</DialogTitle></DialogHeader>

//               <Input placeholder="Name" value={newName} onChange={(e) => setNewName(e.target.value)} />
//               <Input placeholder="Department" value={department} onChange={(e) => setDepartment(e.target.value)} />
//               <Input placeholder="Designation" value={designation} onChange={(e) => setDesignation(e.target.value)} />

//               <div className="space-y-2">
//                 <label className="text-sm font-medium">Tickets</label>
//                 {ticketInputs.map((ticket, index) => (
//                   <div key={index} className="flex gap-2 items-center">
//                     <Input
//                       placeholder={`Ticket #${index + 1}`}
//                       value={ticket}
//                       onChange={(e) => handleTicketChange(index, e.target.value)}
//                       className="flex-1"
//                     />
//                     {index === ticketInputs.length - 1 && (
//                       <Button size="icon" onClick={handleAddTicketField}><Plus className="h-4 w-4" /></Button>
//                     )}
//                     {ticketInputs.length > 1 && (
//                       <Button size="icon" variant="destructive" onClick={() => handleRemoveTicketField(index)}>×</Button>
//                     )}
//                   </div>
//                 ))}
//               </div>

//               <Button className="w-full" onClick={handleAddOwner}>Save Owner</Button>

//               <Separator />

//               <div className="space-y-2">
//                 <h4 className="text-sm font-medium">Bulk Import / Export</h4>
//                 <div className="flex flex-col sm:flex-row gap-2">
//                   <Button variant="outline" className="flex-1" onClick={() => fileInputRef.current?.click()}><Upload className="h-4 w-4 mr-1" /> Import</Button>
//                   <Button variant="outline" className="flex-1" onClick={handleExport}><Download className="h-4 w-4 mr-1" /> Export</Button>
//                 </div>
//                 <input ref={fileInputRef} type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" />
//               </div>
//             </DialogContent>
//           </Dialog>
//         </div>
//       </div>

//       {/* SEARCH */}
//       <Card>
//         <CardContent className="mt-4">
//           <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 border rounded-md overflow-hidden">
//             <Input
//               className="flex-1 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-3 py-2"
//               placeholder="Enter ticket number"
//               value={searchTicket}
//               onChange={(e) => setSearchTicket(e.target.value)}
//             />
//             <Button className="bg-[hsl(220,70%,50%)] text-white hover:bg-[hsl(220,70%,40%)] flex items-center justify-center px-4 py-2">
//               <Search className="h-6 w-6" />
//             </Button>
//           </div>
//         </CardContent>
//       </Card>

//       {/* RESULTS */}
//       {searchTicket ? (
//         filteredOwners.length > 0 ? (
//           viewMode === "card" ? (
//             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
//               {filteredOwners.map((owner) => (
//                 <Card key={owner.id} className="p-4 flex flex-col justify-between">
//                   <CardHeader>
//                     <CardTitle className="text-lg">{owner.name}</CardTitle>
//                     <div className="text-sm text-muted-foreground">{owner.department} - {owner.designation}</div>
//                   </CardHeader>
//                   <CardContent className="flex flex-wrap gap-1">
//                     {owner.ticketNumbers.map((ticket) => (
//                       <Badge key={ticket} variant="secondary">{ticket}</Badge>
//                     ))}
//                   </CardContent>
//                   <div className="mt-2 flex gap-2 justify-end">
//                     <Button size="icon" variant="ghost" onClick={() => setEditOwner(owner)}>
//                       <Edit className="h-4 w-4" />
//                     </Button>
//                     <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(owner.id)}>
//                       <Trash className="h-4 w-4" />
//                     </Button>
//                   </div>
//                 </Card>
//               ))}
//             </div>
//           ) : (
//             <Card>
//               <CardContent>
//                 <Table className="overflow-x-auto">
//                   <TableHeader>
//                     <TableRow>
//                       <TableHead>Name</TableHead>
//                       <TableHead>Department</TableHead>
//                       <TableHead>Designation</TableHead>
//                       <TableHead>Tickets</TableHead>
//                       <TableHead className="text-center w-[120px]">Action</TableHead>
//                     </TableRow>
//                   </TableHeader>
//                   <TableBody>
//                     {filteredOwners.map((o) => (
//                       <TableRow key={o.id}>
//                         <TableCell>{o.name}</TableCell>
//                         <TableCell>{o.department}</TableCell>
//                         <TableCell>{o.designation}</TableCell>
//                         <TableCell className="overflow-x-auto">
//                           <div className="flex flex-wrap gap-1">
//                             {o.ticketNumbers.map((t) => (
//                               <Badge key={t} variant="secondary">{t}</Badge>
//                             ))}
//                           </div>
//                         </TableCell>
//                         <TableCell className="text-center">
//                           <div className="flex justify-center gap-2">
//                             <Button size="icon" variant="ghost" onClick={() => setEditOwner(o)}>
//                               <Edit className="h-4 w-4" />
//                             </Button>
//                             <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(o.id)}>
//                               <Trash className="h-4 w-4" />
//                             </Button>
//                           </div>
//                         </TableCell>
//                       </TableRow>
//                     ))}
//                   </TableBody>
//                 </Table>
//               </CardContent>
//             </Card>
//           )
//         ) : (
//           <div className="text-center text-muted-foreground mt-6">No tickets found</div>
//         )
//       ) : null}

//       {/* EDIT MODAL */}
//       <Dialog open={!!editOwner} onOpenChange={() => setEditOwner(null)}>
//         <DialogContent className="max-w-md space-y-3">
//           <DialogHeader><DialogTitle>Edit Owner</DialogTitle></DialogHeader>
//           {editOwner && (
//             <>
//               <Input value={editOwner.name} onChange={(e) => setEditOwner({ ...editOwner, name: e.target.value })} />
//               <Input value={editOwner.department} onChange={(e) => setEditOwner({ ...editOwner, department: e.target.value })} />
//               <Input value={editOwner.designation} onChange={(e) => setEditOwner({ ...editOwner, designation: e.target.value })} />
//               <Input
//                 value={editOwner.ticketNumbers.join(",")}
//                 onChange={(e) =>
//                   setEditOwner({ ...editOwner, ticketNumbers: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })
//                 }
//               />
//               <Button className="w-full" onClick={handleUpdateOwner}>Update Owner</Button>
//             </>
//           )}
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// }


// TicketOwnersPage.tsx
// import { useState, useRef } from "react";
// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import { Badge } from "@/components/ui/badge";
// import { FloatingInput } from "@/components/ui/FloatingInput";
// import { FloatingSelect } from "@/components/ui/FloatingSelect";
// import IDCard from "@/components/raffle/IDCard";
// import {
//   Users,
//   Plus,
//   TableIcon,
//   Upload,
//   Download,
//   Search,
// } from "lucide-react";
// import Papa from "papaparse";
// import { useToast } from "@/hooks/use-toast";
// import { SelectItem } from "@/components/ui/select";

// export interface TicketOwner {
//   id: string;
//   branch: string;
//   division: string;
//   reg_code: string;
//   name: string;
//   department: string;
//   designation: string;
//   company: string;
//   gender: string;
//   ticketNumbers: string[];
// }

// type PageView = "search" | "add" | "table";

// export default function TicketOwnersPage() {
//   const { toast } = useToast();
//   const fileInputRef = useRef<HTMLInputElement>(null);

//   const [owners, setOwners] = useState<TicketOwner[]>([]);
//   const [page, setPage] = useState<PageView>("search");
//   // Create state for registrations
//   const [registrations, setRegistrations] = useState([]);


//   /* ================= SEARCH ================= */
//   const [searchTicket, setSearchTicket] = useState("");
//   const [searchedTicket, setSearchedTicket] = useState("");

//   const searchedOwner = searchedTicket
//     ? owners.find((o) => o.ticketNumbers.includes(searchedTicket.trim()))
//     : null;

//   /* ================= ADD OWNER FORM ================= */
//   const [branch, setBranch] = useState("");
//   const [division, setDivision] = useState("");
//   const [regCode, setRegCode] = useState("");
//   const [name, setName] = useState("");
//   const [department, setDepartment] = useState("");
//   const [designation, setDesignation] = useState("");
//   const [company, setCompany] = useState("");
//   const [gender, setGender] = useState("");
//   const [ticketInputs, setTicketInputs] = useState([""]);



//   const handleAddOwner = () => {
//     const newEntry = {
//     name,
//     company,
//     branch,
//     division,
//     department,
//     designation,
//     regCode,
//     gender,
//     tickets: [...ticketInputs],
//   };

//   setRegistrations((prev) => [...prev, newEntry]);

//   // Optionally reset form
//   setName("");
//   setCompany("");
//   setBranch("");
//   setDivision("");
//   setDepartment("");
//   setDesignation("");
//   setRegCode("");
//   setGender("");
//   setTicketInputs([]);

//     const tickets = ticketInputs.map(t => t.trim()).filter(Boolean);

//     if (!name || tickets.length === 0) {
//       return toast({
//         title: "Error",
//         description: "Name and ticket number required",
//         variant: "destructive",
//       });
//     }
//     // const [page, setPage] = useState("table");
//     const allTickets = owners.flatMap(o => o.ticketNumbers);
//     const duplicate = tickets.find(t => allTickets.includes(t));

//     if (duplicate) {
//       return toast({
//         title: "Duplicate Ticket",
//         description: `Ticket ${duplicate} already exists`,
//         variant: "destructive",
//       });
//     }

//     setOwners(prev => [
//       ...prev,
//       {
//         id: crypto.randomUUID(),
//         branch,
//         division,
//         reg_code: regCode,
//         name,
//         department,
//         designation,
//         company,
//         gender,
//         ticketNumbers: tickets,
//       },
//     ]);

//     toast({ title: "Success", description: "Owner added" });
//     setPage("table");
//   };

//   /* ================= CSV EXPORT ================= */
//   const handleExport = () => {
//     const headers = [
//       "Name",
//       "Branch",
//       "Division",
//       "Reg Code",
//       "Department",
//       "Designation",
//       "Company",
//       "Gender",
//       "Tickets",
//     ];

//     const rows = owners.map(o => [
//       o.name,
//       o.branch,
//       o.division,
//       o.reg_code,
//       o.department,
//       o.designation,
//       o.company,
//       o.gender,
//       o.ticketNumbers.join(","),
//     ]);

//     const csv = [headers, ...rows]
//       .map(r => r.map(v => `"${v}"`).join(","))
//       .join("\n");

//     const blob = new Blob([csv], { type: "text/csv" });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement("a");
//     a.href = url;
//     a.download = "ticket-owners.csv";
//     a.click();
//     URL.revokeObjectURL(url);
//   };

//   return (
//     <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
//       {/* HEADER */}
//       <div className="flex flex-wrap gap-2 items-center justify-between">
//         <div className="flex items-center gap-2">
//           <Users className="h-6 w-6" />
//           <h1 className="text-2xl font-bold">Ticket Owners</h1>
//         </div>

//         <div className="flex gap-2">
//           <Button onClick={() => setPage("add")}>
//             <Plus className="h-4 w-4 mr-1" /> Add Owner
//           </Button>

//           <Button variant="outline" onClick={() => setPage("table")}>
//             <TableIcon className="h-4 w-4" />
//           </Button>

//           <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
//             <Upload className="h-4 w-4 mr-1" /> Bulk Import
//           </Button>

//           <Button variant="outline" onClick={handleExport}>
//             <Download className="h-4 w-4 mr-1" /> Bulk Export
//           </Button>

//           <input
//             ref={fileInputRef}
//             type="file"
//             accept=".csv"
//             className="hidden"
//           />
//         </div>
//       </div>

//       {/* ================= ADD OWNER PAGE ================= */}
//       {page === "add" && (
//         <Card className="max-w-4xl mx-auto shadow-lg border-t-4 border-t-primary">
//           <CardHeader className="border-b bg-muted/30">
//             <CardTitle className="text-xl flex items-center gap-2">
//               <Plus className="h-5 w-5 text-primary" />
//               Registration Details
//             </CardTitle>
//           </CardHeader>

//           <CardContent className="pt-6 space-y-6">
//             {/* Main Form Grid */}
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <FloatingInput
//                 label="Full Name"
//                 onChange={(e) => setName(e.target.value)}
//               />

//               <FloatingInput
//                 label="Company"
//                 onChange={(e) => setCompany(e.target.value)}
//               />

//               <FloatingInput
//                 label="Branch"
//                 onChange={(e) => setBranch(e.target.value)}
//               />

//               <FloatingInput
//                 label="Division"
//                 onChange={(e) => setDivision(e.target.value)}
//               />

//               <FloatingInput
//                 label="Department"
//                 onChange={(e) => setDepartment(e.target.value)}
//               />

//               <FloatingInput
//                 label="Designation"
//                 onChange={(e) => setDesignation(e.target.value)}
//               />

//               <FloatingInput
//                 label="Reg Code"
//                 onChange={(e) => setRegCode(e.target.value)}
//               />

//               {/* <FloatingInput
//                 label="Gender"
//                 onChange={(e) => setGender(e.target.value)}
//               /> */}
//               <FloatingSelect
//                 label="Gender"
//                 value={gender}
//                 onValueChange={setGender}
//                 className="w-full"
//               >
//                 <SelectItem value="Male">Male</SelectItem>
//                 <SelectItem value="Female">Female</SelectItem>
//               </FloatingSelect>
//             </div>

//             {/* Ticket Section */}
//             <div className="border-t pt-4">
//               <div className="flex items-center justify-between mb-4">
//                 <h3 className="text-sm font-bold flex items-center gap-2">
//                   <Badge
//                     variant="outline"
//                     className="rounded-full h-6 w-6 p-0 flex items-center justify-center bg-primary/10"
//                   >
//                     {ticketInputs.length}
//                   </Badge>
//                   Assigned Ticket Numbers
//                 </h3>

//                 <Button
//                   type="button"
//                   variant="outline"
//                   size="sm"
//                   onClick={() => setTicketInputs([...ticketInputs, ""])}
//                   className="text-xs border-dashed"
//                 >
//                   <Plus className="h-3 w-3 mr-1" />
//                   Add Another Ticket
//                 </Button>
//               </div>

//               {/* Dynamic Ticket Inputs Grid */}
//               <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
//                 {ticketInputs.map((t, i) => (
//                   <FloatingInput
//                     key={i}
//                     label={`Ticket #${i + 1}`}
//                     className="font-mono text-center"
//                     value={t}
//                     onChange={(e) => {
//                       const copy = [...ticketInputs];
//                       copy[i] = e.target.value;
//                       setTicketInputs(copy);
//                     }}
//                   />
//                 ))}
//               </div>
//             </div>

//             {/* Actions */}
//             <div className="pt-4 flex gap-3">
//               <Button
//                 variant="ghost"
//                 className="flex-1"
//                 onClick={() => setPage("search")}
//               >
//                 Cancel
//               </Button>

//               <Button
//                 className="flex-[2] font-bold text-lg h-12 shadow-lg hover:shadow-primary/20 transition-all"
//                 onClick={handleAddOwner}
//               >
//                 Save Registry & View Table
//               </Button>
//             </div>
//           </CardContent>
//         </Card>

//       )}

//       {/* ================= TABLE PAGE ================= */}
//       {page === "table" && (
//         // <Card>
//         //   <CardContent>
//         //     <Table>
//         //       <TableHeader>
//         //         <TableRow>
//         //           <TableHead className="w-12 text-center">SL</TableHead>
//         //           <TableHead>Name</TableHead>
//         //           <TableHead>Company</TableHead>
//         //           <TableHead>Branch</TableHead>
//         //           <TableHead>Division</TableHead>
//         //           <TableHead>Reg Code</TableHead>
//         //           <TableHead>Department</TableHead>
//         //           <TableHead>Designation</TableHead>
//         //           <TableHead>Gender</TableHead>
//         //           <TableHead>Tickets</TableHead>
//         //           <TableHead className="text-center w-24">Actions</TableHead>
//         //         </TableRow>
//         //       </TableHeader>

//         //       <TableBody>
//         //         {owners.map((o, index) => (
//         //           <TableRow key={o.id}>
//         //             <TableCell className="text-center font-medium">
//         //               {index + 1}
//         //             </TableCell>

//         //             <TableCell>{o.name}</TableCell>
//         //             <TableCell>{o.company}</TableCell>
//         //             <TableCell>{o.branch}</TableCell>
//         //             <TableCell>{o.division}</TableCell>
//         //             <TableCell>{o.reg_code}</TableCell>
//         //             <TableCell>{o.department}</TableCell>
//         //             <TableCell>{o.designation}</TableCell>
//         //             <TableCell>{o.gender}</TableCell>

//         //             <TableCell>
//         //               <div className="flex flex-wrap gap-1">
//         //                 {o.ticketNumbers.map((t) => (
//         //                   <Badge key={t} variant="secondary">
//         //                     {t}
//         //                   </Badge>
//         //                 ))}
//         //               </div>
//         //             </TableCell>

//         //             {/* ACTIONS */}
//         //             <TableCell className="text-center">
//         //               <div className="flex justify-center gap-2">
//         //                 <Button
//         //                   size="icon"
//         //                   variant="ghost"
//         //                   onClick={() => onEditOwner(o)}
//         //                 >
//         //                   <Edit className="h-4 w-4" />
//         //                 </Button>

//         //                 <Button
//         //                   size="icon"
//         //                   variant="ghost"
//         //                   className="text-destructive"
//         //                   onClick={() => handleDeleteOwner(o.id)}
//         //                 >
//         //                   <Trash className="h-4 w-4" />
//         //                 </Button>
//         //               </div>
//         //             </TableCell>
//         //           </TableRow>
//         //         ))}
//         //       </TableBody>
//         //     </Table>
//         //   </CardContent>
//         // </Card>
//         <div className="overflow-x-auto">
//           <table className="table-auto w-full mt-6 border">
//             <thead>
//               <tr className="bg-gray-100">
//                 <th className="border px-2 py-1">Name</th>
//                 <th className="border px-2 py-1">Company</th>
//                 <th className="border px-2 py-1">Branch</th>
//                 <th className="border px-2 py-1">Division</th>
//                 <th className="border px-2 py-1">Department</th>
//                 <th className="border px-2 py-1">Designation</th>
//                 <th className="border px-2 py-1">Reg Code</th>
//                 <th className="border px-2 py-1">Gender</th>
//                 <th className="border px-2 py-1">Tickets</th>
//               </tr>
//             </thead>
//             <tbody>
//               {registrations.map((r, idx) => (
//                 <tr key={idx}>
//                   <td className="border px-2 py-1">{r.name}</td>
//                   <td className="border px-2 py-1">{r.company}</td>
//                   <td className="border px-2 py-1">{r.branch}</td>
//                   <td className="border px-2 py-1">{r.division}</td>
//                   <td className="border px-2 py-1">{r.department}</td>
//                   <td className="border px-2 py-1">{r.designation}</td>
//                   <td className="border px-2 py-1">{r.regCode}</td>
//                   <td className="border px-2 py-1">{r.gender}</td>
//                   <td className="border px-2 py-1">{r.tickets.join(", ")}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>

//           <div className="mt-4 flex justify-end">
//             <button
//               onClick={() => setPage("search")}
//               className="px-4 py-2 bg-primary text-white font-semibold rounded shadow hover:bg-primary/90 transition"
//             >
//               Go to Search Page
//             </button>
//           </div>
//         </div>



//       )}

//       {/* ================= SEARCH PAGE ================= */}
//       {page === "search" && (
//         <>
//           <Card>
//             <CardContent className="pt-6">
//               <div className="flex border rounded-md overflow-hidden">
//                 <Input
//                   placeholder="Enter ticket number"
//                   value={searchTicket}
//                   onChange={e => setSearchTicket(e.target.value)}
//                   className="border-0"
//                 />
//                 <Button onClick={() => setSearchedTicket(searchTicket)}>
//                   <Search className="h-5 w-5" />
//                 </Button>
//               </div>
//             </CardContent>
//           </Card>

//           {searchedTicket && (
//             searchedOwner ? (
//               // <Card>
//               //   <CardContent className="space-y-2 text-sm">
//               //     <div><b>Name:</b> {searchedOwner.name}</div>
//               //     <div><b>Branch:</b> {searchedOwner.branch}</div>
//               //     <div><b>Division:</b> {searchedOwner.division}</div>
//               //     <div><b>Reg Code:</b> {searchedOwner.reg_code}</div>
//               //     <div><b>Department:</b> {searchedOwner.department}</div>
//               //     <div><b>Designation:</b> {searchedOwner.designation}</div>
//               //     <div><b>Company:</b> {searchedOwner.company}</div>
//               //     <div><b>Gender:</b> {searchedOwner.gender}</div>
//               //     <Badge>{searchedTicket}</Badge>
//               //   </CardContent>
//               // </Card>
//               <div className="flex justify-center items-center bg-gray-50">
//                 <IDCard
//                   name={searchedOwner.name}
//                   designation={searchedOwner.designation}
//                   regNo={searchedOwner.reg_code}
//                   department={searchedOwner.department}
//                   company={searchedOwner.company}
//                   branch={searchedOwner.branch}
//                   gender={searchedOwner.gender}
//                   ticket={searchedTicket} // if your IDCard supports it
//                 />
//               </div>
//             ) : (
//               <div className="text-center text-muted-foreground">
//                 No ticket found
//               </div>
//             )
//           )}
//         </>
//       )}
//     </div>
//   );
// }

// TicketOwnersPage.tsx
import { useState, useRef } from "react";
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

          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
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
