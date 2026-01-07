import { useState, useRef, useEffect } from 'react';
import { Formik, Form, useFormik } from 'formik';
import { Loader, Placeholder } from 'rsuite';
import { validationSchemas } from '@/schema/validationSchemas';
// store import api
import { getEmployees, storeEmployee, getEmployeeByTicket } from '@/service/employeeApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FloatingInput } from '@/components/ui/FloatingInput';
import { FloatingSelect } from '@/components/ui/FloatingSelect';
import IDCard from '@/components/raffle/IDCard';
import {
  Users,
  ArrowLeft,
  Plus,
  TableIcon,
  Upload,
  Download,
  StepBack,
  Search,
} from 'lucide-react';
import Papa from 'papaparse';
import { useToast } from '@/hooks/use-toast';
import { SelectItem } from '@/components/ui/select';
import { importEmployeesCsv } from '@/service/employeeApi';

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

type PageView = 'search' | 'add' | 'table';

export default function TicketOwnersPage() {
  const { toast } = useToast();
  const fileEmployeesInputRef = useRef<HTMLInputElement>(null);

  // ====== DUMMY DATA ======
  const [owners, setOwners] = useState<TicketOwner[]>([]);

  const [page, setPage] = useState<PageView>('search');
  const [registrations, setRegistrations] = useState([]);

  /* ================= SEARCH ================= */
  const [searchTicket, setSearchTicket] = useState('');
  const [searchedTicket, setSearchedTicket] = useState('');
  const [ticketOwner, setTicketOwner] = useState<TicketOwner | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');

  /* ================= ADD OWNER FORM ================= */
  const [branch, setBranch] = useState('');
  const [division, setDivision] = useState('');
  const [regCode, setRegCode] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [designation, setDesignation] = useState('');
  const [company, setCompany] = useState('');
  const [gender, setGender] = useState('');
  // const [ticketInputs, setTicketInputs] = useState([""]);
  const [ticketInputs, setTicketInputs] = useState<string[]>(['']);
  const [csvUploading, setCsvUploading] = useState(false);

  const initialValues: Omit<TicketOwner, 'id'> = {
    name: '',
    company: '',
    branch: '',
    division: '',
    department: '',
    designation: '',
    reg_code: '',
    tickets: [''],
  };
  const formik = useFormik({
    initialValues: {
      name: '',
      company: '',
      branch: '',
      division: '',
      department: '',
      designation: '',
      reg_code: '',
      tickets: [''],
    },
    validationSchema: validationSchemas,
    validateOnBlur: true, // ✅ REQUIRED
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
          title: 'Error',
          description: 'Name and ticket number required',
          variant: 'destructive',
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
        tickets: tickets, // 👈 IMPORTANT
      };

      console.log('API Payload:', payload);

      const savedOwner = await storeEmployee(payload);
      setOwners((prev) => [...prev, savedOwner]);

      toast({ title: 'Success', description: 'Owner added successfully' });

      resetForm();
      setPage('table');
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.response?.data?.message || 'Failed to add owner',
        variant: 'destructive',
      });
    }
  };

  /* ================= CSV EXPORT ================= */
  // const handleExport = () => {
  //   const headers = [
  //     'Name',
  //     'Branch',
  //     'Division',
  //     'Reg Code',
  //     'Department',
  //     'Designation',
  //     'Company',
  //     'Gender',
  //     'Tickets',
  //   ];

  //   const rows = owners.map((o) => [
  //     o.name,
  //     o.branch,
  //     o.division,
  //     o.reg_code,
  //     o.department,
  //     o.designation,
  //     o.company,
  //     o.gender,
  //     o.tickets.join(','),
  //   ]);

  //   const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');

  //   const blob = new Blob([csv], { type: 'text/csv' });
  //   const url = URL.createObjectURL(blob);
  //   const a = document.createElement('a');
  //   a.href = url;
  //   a.download = 'ticket-owners.csv';
  //   a.click();
  //   URL.revokeObjectURL(url);
  // };

  const handleExport = () => {
    const headers = [
      'Name',
      'Branch',
      'Division',
      'Reg Code',
      'Department',
      'Designation',
      'Company',
      'Tickets',
    ];

    const rows = owners.map((o) => [
      o.name,
      o.branch,
      o.division,
      o.reg_code,
      o.department,
      o.designation,
      o.company,
      // safely handle tickets
      Array.isArray(o.tickets) ? o.tickets.join(',') : o.tickets ?? '',
    ]);

    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ticket-owners.csv';
    a.click();
    URL.revokeObjectURL(url);
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
      const res = await importEmployeesCsv(formData);

      toast({
        title: 'Success',
        description: res.message || 'CSV imported successfully',
      });

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
      if (fileEmployeesInputRef.current) {
        fileEmployeesInputRef.current.value = '';
      }
    }
  };

  /* ================= SEARCH FUNCTION ================= */
  const handleSearchTicket = async () => {
    if (!searchTicket) return;

    // Start everything
    setLoading(true);
    setError(null);
    setTicketOwner(null);
    setSearchedTicket(searchTicket);

    // Start the minimum 1-second timer
    const timer = new Promise((resolve) => setTimeout(resolve, 1000));

    try {
      // Run API call and Timer at the same time
      const [response] = await Promise.all([
        getEmployeeByTicket(searchTicket),
        timer, // This forces the "await" to take at least 1 second
      ]);

      setTicketOwner(response.data);
    } catch (err) {
      setError('Ticket not found');
    } finally {
      setLoading(false); // Only stops after both API and 1s timer are done
    }
  };

  useEffect(() => {
    getEmployees()
      .then((res) => {
        setOwners(res.data);
      })
      .catch((error) => {
        console.error('Error fetching employees:', error);
      });
  }, [csvUploading]);

  return (
    <div className="p-3 md:p-3 max-w-full space-y-6">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between px-1">
        <div className="flex items-center gap-2 min-w-0">
          {page === 'table' && (
            <button
              onClick={() => setPage('search')}
              className="col-span-1 font-bold bg-gray-200 hover:bg-gray-300 rounded-md p-2"
            >
              <ArrowLeft className="w-5 h-5 text-xl" />
            </button>
          )}

          <h1 className="text-xl sm:text-2xl font-bold truncate">Tickets</h1>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-row flex-wrap gap-2 w-full lg:w-auto">
          <div className="flex gap-2 col-span-2 sm:col-auto">
            <Button variant="outline" onClick={() => setPage('table')} className="flex-1 sm:w-12">
              <TableIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() => fileEmployeesInputRef.current?.click()}
              className="flex-1"
            >
              <input
                ref={fileEmployeesInputRef}
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
          </div>

          {page === 'table' && (
            <>
              <Button variant="outline" onClick={handleExport} className="col-span-1">
                <Download className="h-4 w-4 mr-1" /> Export
              </Button>
              {/* <Button onClick={() => setPage("search")} className="col-span-1 bg-black text-white">
                <StepBack className="w-4 h-4" /> Back
              </Button> */}
            </>
          )}

          <Button onClick={() => setPage('add')} className="col-span-2 sm:col-auto">
            <Plus className="h-4 w-4 mr-1" /> Add Ticket
          </Button>
          {/* <input ref={fileInputRef} type="file" accept=".csv" className="hidden" /> */}
        </div>
      </div>

      {/* ================= ADD OWNER PAGE ================= */}
      {page === 'add' && (
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchemas}
          onSubmit={handleAddOwner}
        >
          {({
            values,
            errors,
            touched,
            handleChange,
            handleBlur,
            setFieldValue,
            setFieldTouched,
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
                      error={
                        touched.division && errors.division ? String(errors.division) : undefined
                      }
                    />

                    {/* Department */}
                    <FloatingInput
                      label="Department"
                      name="department"
                      value={values.department}
                      onBlur={handleBlur}
                      onChange={handleChange}
                      error={
                        touched.department && errors.department
                          ? String(errors.department)
                          : undefined
                      }
                    />

                    {/* Designation */}
                    <FloatingInput
                      label="Designation"
                      name="designation"
                      value={values.designation}
                      onBlur={handleBlur}
                      onChange={handleChange}
                      error={
                        touched.designation && errors.designation
                          ? String(errors.designation)
                          : undefined
                      }
                    />

                    {/* Employee ID */}
                    <FloatingInput
                      label="Employ Id"
                      name="reg_code"
                      value={values.reg_code}
                      onBlur={handleBlur}
                      onChange={handleChange}
                      error={
                        touched.reg_code && errors.reg_code ? String(errors.reg_code) : undefined
                      }
                    />

                    {/* Select Gender */}
                    {/* <FloatingSelect
                      label="Gender"
                      value={values.gender}
                      onValueChange={(v) => setFieldValue('gender', v)}
                      onTouched={() => setFieldTouched('gender', true)}
                      error={touched.gender && errors.gender ? String(errors.gender) : undefined}
                    >
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                    </FloatingSelect> */}
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
                        onClick={() => setFieldValue('tickets', [...values.tickets, ''])}
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
                              setFieldValue('tickets', copy);
                            }}
                            error={touched.tickets?.[i] && errors.tickets?.[i]}
                          />

                          {values.tickets.length > 1 && (
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="absolute top-1 right-1 h-5 w-5 p-0"
                              onClick={() =>
                                setFieldValue(
                                  'tickets',
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
                    {typeof errors.tickets === 'string' && (
                      <p className="text-sm text-destructive mt-2">{errors.tickets}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-4 flex gap-3">
                    <Button
                      type="button"
                      variant="ghost"
                      className="flex-1"
                      onClick={() => setPage('search')}
                    >
                      Cancel
                    </Button>

                    <Button type="submit" className="flex-[2] font-bold text-lg h-12">
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
      {page === 'table' && (
        <div className="mt-8 rounded-xl border border-gray-200 bg-white shadow-md">
          {/* ================= SEARCH BAR ================= */}
          <div className="flex items-center p-4 border-b border-gray-200">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or ticket number"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          {/* Horizontal scroll */}
          <div className="overflow-x-auto">
            {/* Fixed height + vertical scroll */}
            <div className="max-h-[500px] overflow-y-auto">
              <table className="w-full border-collapse text-left">
                <thead className="sticky top-0 z-20 bg-gray-100">
                  <tr className="bg-gray-100 border-b border-gray-200">
                    <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">
                      Name
                    </th>
                    <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">
                      Company
                    </th>
                    <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">
                      Branch
                    </th>
                    <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">
                      Division
                    </th>
                    <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">
                      Department
                    </th>
                    <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">
                      Designation
                    </th>
                    <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">
                      Reg Code
                    </th>
                    {/* <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">
                      Gender
                    </th> */}
                    {/* Added min-width here to make header match the body column */}
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 min-w-[300px]">
                      Tickets
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {owners
                    .filter((o) => {
                      if (!searchText.trim()) return true;

                      const keyword = searchText.toLowerCase();
                      const nameMatch = o.name?.toLowerCase().includes(keyword);
                      const ticketMatch = o.tickets?.toLowerCase().includes(keyword);

                      return nameMatch || ticketMatch;
                    })
                    .map((o) => (
                      <tr
                        key={o.id}
                        /* Changed hover behavior to a cleaner full-row gray/blue tint */
                        className="group hover:bg-slate-50 transition-colors duration-200 ease-in-out cursor-default"
                      >
                        <td className="px-4 py-4 text-sm font-semibold text-gray-900 whitespace-nowrap">
                          {o.name}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600 whitespace-nowrap">
                          {o.company}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600">{o.branch}</td>
                        <td className="px-4 py-4 text-sm text-gray-600">{o.division}</td>
                        <td className="px-4 py-4 text-sm text-gray-600">{o.department}</td>
                        <td className="px-4 py-4 text-sm text-gray-600">{o.designation}</td>
                        <td className="px-4 py-4 text-sm font-mono text-gray-500 bg-gray-50/50">
                          {o.reg_code}
                        </td>
                        {/* <td className="px-4 py-4 text-sm text-gray-600">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight ${
                              o.gender === 'Male'
                                ? 'bg-blue-50 text-blue-600 border border-blue-100'
                                : 'bg-pink-50 text-pink-600 border border-pink-100'
                            }`}
                          >
                            {o.gender}
                          </span>
                        </td> */}

                        {/* Wider Ticket Column with min-width and better padding */}
                        <td className="px-6 py-4 min-w-[300px] border-l border-gray-50">
                          <div className="flex flex-wrap gap-2">
                            {o.tickets ? (
                              o.tickets.split(',').map((t, index) => (
                                <Badge
                                  key={index}
                                  variant="secondary"
                                  className="bg-white text-slate-700 border border-slate-200 text-[11px] font-medium shadow-sm px-2 py-0.5"
                                >
                                  {t.trim()}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-xs italic text-gray-400">
                                No active tickets
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= SEARCH PAGE ================= */}
      {page === 'search' && (
        <>
          <Card>
            <CardContent className="pt-6 px-4 sm:px-6">
              {/* <div className="flex justify-center w-full">
                <div className="flex w-full max-w-lg border rounded-md overflow-hidden shadow-sm">
                  <Input
                    placeholder="Enter ticket number"
                    value={searchTicket}
                    onChange={(e) => setSearchTicket(e.target.value)}
                    className="font-bold text-2xl border-0 flex-1 rounded-none focus-visible:ring-0 placeholder:font-bold placeholder:text-xl focus:font-bold focus:text-2xl transition-all duration-200"
                  />
                  <Button onClick={handleSearchTicket} className="rounded-none px-6">
                    Search
                  </Button>
                </div>
              </div> */}
              <div className="flex justify-center w-full">
                <div className="relative w-full max-w-2xl">
                  {/* Subtle background (NO glow heavy) */}
                  <div className="absolute inset-0 rounded-2xl bg-blue-500/5 blur-sm" />

                  {/* Wrapper */}
                  <div
                    className="
        relative flex items-center w-full
        bg-white
        rounded-2xl
        shadow-lg
        border border-transparent
        transition-all duration-300
        focus-within:border-transparent
      "
                  >
                    {/* Search Icon (FIXED) */}
                    <div className="flex items-center justify-center pl-6 pr-4 text-gray-400 shrink-0">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-6 h-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-4.35-4.35m1.1-5.65a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>

                    {/* Input */}
                    <Input
                      placeholder="Enter ticket number"
                      // value={searchTicket}
                      // onChange={(e) => setSearchTicket(e.target.value)}
                      value={searchTicket}
                      onChange={(e) => {
                        const value = e.target.value;
                        setSearchTicket(value);

                        // 👇 Input If empty, all clear
                        if (!value) {
                          setSearchedTicket('');
                          setTicketOwner(null);
                          setLoading(false);
                          setError(null);
                        }
                      }}
                      className="
          flex-1
          h-16
          bg-transparent
          border-0
          text-2xl
          font-semibold
          text-gray-800
          placeholder:text-gray-400
          placeholder:text-lg
          focus:outline-none
          focus:ring-0
          focus-visible:ring-0
          
        "
                    />

                    {/* Divider */}
                    <div className="h-8 w-px bg-gray-200 mx-3" />

                    {/* Button */}
                    <Button
                      onClick={handleSearchTicket}
                      className="
          mr-3
          h-12
          px-10
          rounded-xl
          text-lg
          font-semibold
          bg-indigo-600
          hover:bg-indigo-700
          text-white
          shadow-md
          transition-all
        "
                    >
                      Search
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* This block is now visible as soon as you click search */}
          {searchedTicket && (
            <div className="flex justify-center items-center min-h-[200px] w-full">
              {/* 1. Show loader if loading is true */}
              {loading && (
                <div>
                  <Placeholder.Paragraph rows={8} />
                  <Loader
                    className="loader w-10 h-10 text-3xl"
                    backdrop
                    content="Loading..."
                    vertical
                  />
                </div>
              )}

              {/* 2. Show Results only when loading is finished */}
              {!loading && (
                <>
                  {ticketOwner ? (
                    <div className="flex justify-center items-center bg-gray-50 w-full animate-in fade-in duration-500">
                      <IDCard
                        name={ticketOwner.name}
                        designation={ticketOwner.designation}
                        regNo={ticketOwner.reg_code}
                        department={ticketOwner.department}
                        company={ticketOwner.company}
                        branch={ticketOwner.branch}
                        // gender={ticketOwner.gender}
                        ticket={searchedTicket}
                      />
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground">
                      {error || 'No ticket found'}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
