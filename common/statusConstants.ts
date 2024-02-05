export const statusConst = {
  // Other predefined response statuses
  error: { status: 400, message: 'Error' },
  success: { status: 200, message: 'Success' },
  unauthorized: { status: 401, message: 'Invalide username or password' }, // Unauthorized status
  status: ["sent", "delivered"],
  // Other predefined response statuses
};


// Example response with a list of records
export const recordsResponse = (data: any[]) => ({
  status: 200,
  message: 'Success',
  data: data,
});

// Example response with a single record
export const recordResponse = (record: any) => ({
  status: 200,
  message: 'Success',
  data: record,
});

// Example response with a custom message
export const customResponse = (message: string, data?: any) => ({
  status: 200,
  message: message,
  data: data,
});

export  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_+=<>?';
export const baseUrl = "http://localhost:8000/";

export const messageStatus = {
  status: ["sent", "delivered"],
}