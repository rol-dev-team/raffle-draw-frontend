
import { useState, useRef, useEffect } from "react";
import { Formik, Form, useFormik } from "formik";
import { validationSchemas } from "@/schema/validationSchemas";
// store import api
import { getEmployees, storeEmployee } from "@/service/employeeApi";
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
  StepBack,
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
  tickets: string[];
}

type PageView = "search" | "add" | "table";

export default function TicketOwnersPage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ====== DUMMY DATA ======
  const [owners, setOwners] = useState<TicketOwner[]>([
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
  // const [ticketInputs, setTicketInputs] = useState([""]);
  const [ticketInputs, setTicketInputs] = useState<string[]>([""]);

  const initialValues: Omit<TicketOwner, "id"> = {
    name: "",
    company: "",
    branch: "",
    division: "",
    department: "",
    designation: "",
    reg_code: "",
    gender: "",
    tickets: [""],
  };
  const formik = useFormik({
    initialValues: {
      name: "",
      company: "",
      branch: "",
      division: "",
      department: "",
      designation: "",
      reg_code: "",
      gender: "",
      tickets: [""],
    },
    validationSchema: validationSchemas,
    validateOnBlur: true,   // ✅ REQUIRED
    validateOnChange: false, // ✅ avoids noisy errors
    onSubmit: (values) => {
      console.log(values);
    },
  });

  const handleAddOwner = async (values: any, { resetForm }: any) => {

    try {
      const tickets = values.tickets.map((t: string) => t.trim()).filter(Boolean);

      if (!values.name || tickets.length === 0) {
        toast({
          title: "Error",
          description: "Name and ticket number required",
          variant: "destructive",
        });
        return;
      }

      const payload = {
        name: values.name,
        company: values.company,
        branch: values.branch,
        division: values.division,
        department: values.department,
        designation: values.designation,
        reg_code: values.reg_code,
        gender: values.gender,
        tickets: tickets, // 👈 IMPORTANT
      };

      console.log("API Payload:", payload);

      const savedOwner = await storeEmployee(payload);
      setOwners((prev) => [...prev, savedOwner]);

      toast({ title: "Success", description: "Owner added successfully" });

      resetForm();
      setPage("table");
    } 
    catch (err: any) {
      toast({
        title: "Error",
        description: err?.response?.data?.message || "Failed to add owner",
        variant: "destructive",
      });
    }
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
      o.tickets.join(","),
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

  useEffect(() => {
    getEmployees()
    .then(res => {
      setOwners(res.data);
      console.log("Employees fetched:", res);
    })
    .catch(error => {
      console.error("Error fetching employees:", error);
    });
  },[]);

  return (
    <div className="p-4 md:p-6 max-w-full space-y-6">
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
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchemas}
          onSubmit={handleAddOwner}
        >
          {({
            values, errors, touched, handleChange, handleBlur, setFieldValue, setFieldTouched
          }) => (
            <Form>
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
                    {/* Full Name */}
                    <FloatingInput
                      label="Full Name"
                      name="name"
                      value={values.name}
                      onBlur={handleBlur}
                      onChange={handleChange}
                      error={touched.name && errors.name ? String(errors.name) : undefined}
                    />

                    {/* Company */}
                    <FloatingInput
                      label="Company"
                      name="company"
                      value={values.company}
                      onBlur={handleBlur}
                      onChange={handleChange}
                      error={touched.company && errors.company ? String(errors.company) : undefined}
                    />

                    {/* Branch */}
                    <FloatingInput
                      label="Branch"
                      name="branch"
                      value={values.branch}
                      onBlur={handleBlur}
                      onChange={handleChange}
                      error={touched.branch && errors.branch ? String(errors.branch) : undefined}
                    />

                    {/* Division */}
                    <FloatingInput
                      label="Division"
                      name="division"
                      value={values.division}
                      onBlur={handleBlur}
                      onChange={handleChange}
                      error={touched.division && errors.division ? String(errors.division) : undefined}
                    />

                    {/* Department */}
                    <FloatingInput
                      label="Department"
                      name="department"
                      value={values.department}
                      onBlur={handleBlur}
                      onChange={handleChange}
                      error={touched.department && errors.department ? String(errors.department) : undefined}
                    />

                    {/* Designation */}
                    <FloatingInput
                      label="Designation"
                      name="designation"
                      value={values.designation}
                      onBlur={handleBlur}
                      onChange={handleChange}
                      error={touched.designation && errors.designation ? String(errors.designation) : undefined}
                    />

                    {/* Employee ID */}
                    <FloatingInput
                      label="Employ Id"
                      name="reg_code"
                      value={values.reg_code}
                      onBlur={handleBlur}
                      onChange={handleChange}
                      error={touched.reg_code && errors.reg_code ? String(errors.reg_code) : undefined}
                    />

                    {/* Select Gender */}
                    <FloatingSelect
                      label="Gender"
                      value={values.gender}
                      onValueChange={(v) => setFieldValue("gender", v)}
                      onTouched={() => setFieldTouched("gender", true)}
                      error={touched.gender && errors.gender ? String(errors.gender) : undefined}
                    >
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                    </FloatingSelect>
                  </div>

                  {/* Ticket Numbers Section */}
                  <div className="border-t pt-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                      <h3 className="text-sm font-bold flex items-center gap-2">
                        <Badge className="rounded-full h-6 w-6 p-0 flex items-center justify-center bg-gray-500">
                          {values.tickets.length}
                        </Badge>
                        Ticket Numbers
                      </h3>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-xs border-dashed w-full sm:w-auto"
                        onClick={() =>
                          setFieldValue("tickets", [...values.tickets, ""])
                        }
                      >
                        <Plus className="h-3 w-3 mr-1" /> Add Another
                      </Button>
                    </div>

                    {/* Ticket Inputs */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {values.tickets.map((ticket, i) => (
                        <div key={i} className="relative">
                          <FloatingInput
                            label={`#${i + 1}`}
                            value={ticket}
                            onChange={(e) => {
                              const copy = [...values.tickets];
                              copy[i] = e.target.value;
                              setFieldValue("tickets", copy);
                            }}
                            error={
                              touched.tickets?.[i] &&
                              errors.tickets?.[i]
                            }
                          />

                          {values.tickets.length > 1 && (
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="absolute top-1 right-1 h-5 w-5 p-0"
                              onClick={() =>
                                setFieldValue(
                                  "tickets",
                                  values.tickets.filter((_, idx) => idx !== i)
                                )
                              }
                            >
                              ✕
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Ticket array error */}
                    {typeof errors.tickets === "string" && (
                      <p className="text-sm text-destructive mt-2">
                        {errors.tickets}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-4 flex gap-3">
                    <Button
                      type="button"
                      variant="ghost"
                      className="flex-1"
                      onClick={() => setPage("search")}
                    >
                      Cancel
                    </Button>

                    <Button
                      type="submit"
                      className="flex-[2] font-bold text-lg h-12"
                    >
                      Save
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Form>
          )}
        </Formik>
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
                  <td className="border px-2 py-1">
                  <div className="flex flex-wrap gap-1">
                    {o.tickets 
                      ? o.tickets.split(",").map((t, index) => (
                          <Badge key={index} variant="secondary" className="text-[10px]">
                            {t.trim()}
                          </Badge>
                        ))
                      : "No Tickets"}
                  </div>
                </td>
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