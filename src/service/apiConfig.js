import axios from 'axios';

// export const baseURL = 'http://127.0.0.1:8000/api/';
export const baseURL = 'http://182.48.80.240:8080/api/';

export const apiClient = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
    // "Content-Type": "multipart/form-data",
  },
});
