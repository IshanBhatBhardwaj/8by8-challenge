interface ErrorWithMessage {
  message: string;
}

export function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    !!error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof error.message === 'string' &&
    !!error.message.length
  );
}
