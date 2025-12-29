import { apiClient } from "./apiConfig";

/**
 * Get all employees
 * GET /employees
 */
export const getEmployees = async () => {
  try {
    const response = await apiClient.get("/employees");
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Store new employee
 * POST /employees
 */
export const storeEmployee = async (data) => {
  try {
    const response = await apiClient.post("/employees", data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Get employee by ID
 * GET /employees/{id}
 */
export const getEmployeeById = async (id) => {
  try {
    const response = await apiClient.get(`/employees/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Update employee
 * PUT /employees/{id}
 */
export const updateEmployee = async (id, data) => {
  try {
    const response = await apiClient.put(`/employees/${id}`, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Delete employee
 * DELETE /employees/{id}
 */
export const deleteEmployee = async (id) => {
  try {
    const response = await apiClient.delete(`/employees/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Import employees via CSV
 * POST /employees/import-csv
 */
export const importEmployeesCsv = async (data) => {
  try {
    const response = await apiClient.post("/employees/import-csv", data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};
