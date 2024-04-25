export function ApiResponse(status, message, error, data) {
  return {
    status: status,
    message: message,
    error: error,
    data: data,
  };
}
