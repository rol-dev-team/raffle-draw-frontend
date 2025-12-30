import * as yup from "yup";

export const validationSchemas = yup.object({
  name: yup
    .string()
    .required("Full Name is required")
    .min(3, "Name is too short"),

  company: yup.string().required("Company name is required"),
  branch: yup.string().required("Branch is required"),
  division: yup.string().required("Division is required"),
  department: yup.string().required("Department is required"),
  designation: yup.string().required("Designation is required"),


  reg_code: yup.string().required("Employee ID is required"),

  gender: yup.string().required("Please select a gender"),

  tickets: yup
    .array()
    .of(
      yup
        .string()
        .trim()
        .required("Ticket cannot be empty")
    )
    .min(1, "At least one ticket is required"),
});