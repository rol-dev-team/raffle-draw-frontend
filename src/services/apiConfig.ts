import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';

// Create Axios instance
const clientApi: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL as string,
});

// Response interceptor
clientApi.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export default clientApi;