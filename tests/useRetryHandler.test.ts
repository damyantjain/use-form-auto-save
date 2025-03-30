import { renderHook } from "@testing-library/react";
import { useRetryHandler } from "../src/useRetryHandler";

// filepath: /Users/damyant/Developer/use-form-auto-save/src/useRetryHandler.test.ts

describe("useRetryHandler", () => {
  jest.useFakeTimers();

  const mockLogDebug = jest.fn();
  const mockOnRetry = jest.fn();
  const mockOnRetryExhausted = jest.fn();

  afterEach(() => {
    jest.clearAllTimers();
    jest.clearAllMocks();
  });

  it("should call onRetryExhausted when retryCount reaches maxRetries", () => {
    renderHook(() =>
      useRetryHandler({
        shouldRetry: true,
        retryCount: 3,
        maxRetries: 3,
        logDebug: mockLogDebug,
        onRetry: mockOnRetry,
        onRetryExhausted: mockOnRetryExhausted,
      })
    );

    expect(mockLogDebug).toHaveBeenCalledWith(
      "Max retry limit (3) reached. Auto-save will not retry."
    );
    expect(mockOnRetryExhausted).toHaveBeenCalledTimes(1);
    expect(mockOnRetry).not.toHaveBeenCalled();
  });

  it("should log the correct debug message when retryCount reaches maxRetries", () => {
    renderHook(() =>
      useRetryHandler({
        shouldRetry: true,
        retryCount: 5,
        maxRetries: 5,
        logDebug: mockLogDebug,
        onRetry: mockOnRetry,
        onRetryExhausted: mockOnRetryExhausted,
      })
    );

    expect(mockLogDebug).toHaveBeenCalledWith(
      "Max retry limit (5) reached. Auto-save will not retry."
    );
    expect(mockOnRetryExhausted).toHaveBeenCalledTimes(1);
  });

  it("should not retry when retryCount exceeds maxRetries", () => {
    renderHook(() =>
      useRetryHandler({
        shouldRetry: true,
        retryCount: 4,
        maxRetries: 3,
        logDebug: mockLogDebug,
        onRetry: mockOnRetry,
        onRetryExhausted: mockOnRetryExhausted,
      })
    );

    expect(mockOnRetry).not.toHaveBeenCalled();
    expect(mockOnRetryExhausted).toHaveBeenCalledTimes(1);
  });

  it("should not call onRetry when retryCount reaches maxRetries", () => {
    renderHook(() =>
      useRetryHandler({
        shouldRetry: true,
        retryCount: 2,
        maxRetries: 2,
        logDebug: mockLogDebug,
        onRetry: mockOnRetry,
        onRetryExhausted: mockOnRetryExhausted,
      })
    );

    expect(mockOnRetry).not.toHaveBeenCalled();
    expect(mockOnRetryExhausted).toHaveBeenCalledTimes(1);
  });
});