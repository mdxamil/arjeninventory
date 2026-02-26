interface ApiError {
  message: string;
  statusCode: number;
  type: "error" | "warning" | "info";
}

export function handleApiError(response: Response, fallbackMessage: string = "An error occurred"): ApiError {
  const statusCode = response.status;

  switch (statusCode) {
    case 400:
      return {
        message: "Invalid request. Please check your input.",
        statusCode,
        type: "warning",
      };
    case 401:
      return {
        message: "You are not authenticated. Please log in.",
        statusCode,
        type: "error",
      };
    case 403:
      return {
        message: "You don't have permission to perform this action.",
        statusCode,
        type: "error",
      };
    case 404:
      return {
        message: "The requested resource was not found.",
        statusCode,
        type: "warning",
      };
    case 409:
      return {
        message: "This resource already exists or conflicts with existing data.",
        statusCode,
        type: "warning",
      };
    case 422:
      return {
        message: "The data provided is invalid or incomplete.",
        statusCode,
        type: "warning",
      };
    case 429:
      return {
        message: "Too many requests. Please try again later.",
        statusCode,
        type: "warning",
      };
    case 500:
      return {
        message: "Server error. Please try again later.",
        statusCode,
        type: "error",
      };
    case 502:
    case 503:
      return {
        message: "Service temporarily unavailable. Please try again later.",
        statusCode,
        type: "error",
      };
    default:
      return {
        message: fallbackMessage,
        statusCode,
        type: "error",
      };
  }
}

export async function handleApiResponse<T>(
  response: Response,
  fallbackErrorMessage?: string
): Promise<{ data?: T; error?: ApiError }> {
  if (response.ok) {
    try {
      const data = await response.json();
      return { data };
    } catch {
      return {
        error: {
          message: "Failed to parse response",
          statusCode: response.status,
          type: "error",
        },
      };
    }
  }

  // Handle error responses
  const apiError = handleApiError(response, fallbackErrorMessage);

  // Try to get more specific error message from response body
  try {
    const errorData = await response.json();
    if (errorData.error || errorData.message) {
      apiError.message = errorData.error || errorData.message;
    }
  } catch {
    // If parsing fails, use the default error message
  }

  return { error: apiError };
}

// Hook for showing toast notifications
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "An unexpected error occurred";
}
