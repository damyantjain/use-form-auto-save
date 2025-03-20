/**
 * @module useFormAutoSaveTests
 * 
 * @description
 * This module contains a comprehensive suite of tests for the useFormAutoSave hook.
 *
 * @remarks
 * Prior to each test, localStorage is cleared and fake timers are set up to simulate debounce
 * delays. After each test, pending timers are run, and real timers are restored.
 *
 * @packageDocumentation
 */

import { renderHook, act } from "@testing-library/react";
import { useFormAutoSave } from "../src/useFormAutoSave";

describe("useFormAutoSave Hook", () => {
    beforeEach(() => {
        localStorage.clear();
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
    });

    it("should save form data to localStorage after debounce", () => {
      const { rerender } = renderHook(
        ({ data }) => useFormAutoSave({
          formData: data,
          formKey: "test-form",
          debounceTime: 1000,
        }),
        { initialProps: { data: { name: "Alice" } } }
      );
  
      expect(localStorage.getItem("test-form")).toBeNull();
  
      act(() => {
        jest.advanceTimersByTime(1000);
      });
  
      expect(localStorage.getItem("test-form")).toBe(JSON.stringify({ name: "Alice" }));
  
      rerender({ data: { name: "Bob" } });
  
      act(() => {
        jest.advanceTimersByTime(1000);
      });
  
      expect(localStorage.getItem("test-form")).toBe(JSON.stringify({ name: "Bob" }));
    });
  
    it("should restore saved data from localStorage", () => {
      localStorage.setItem("test-form", JSON.stringify({ email: "test@example.com" }));
      const { result } = renderHook(() => useFormAutoSave({
        formData: {},
        formKey: "test-form",
      }));
      expect(result.current.restoreFormData()).toEqual({ email: "test@example.com" });
    });
  
    it("should not save when form data is empty", () => {
      renderHook(() => useFormAutoSave({
        formData: {},
        formKey: "empty-form",
      }));
  
      act(() => {
        jest.advanceTimersByTime(1000);
      });
  
      expect(localStorage.getItem("empty-form")).toBeNull();
    });
  
    it("should save form data to sessionStorage when specified", () => {
      const { rerender } = renderHook(
        ({ data }) => useFormAutoSave({
          formData: data,
          formKey: "test-session",
          debounceTime: 1000,
          storageType: "sessionStorage",
        }),
        { initialProps: { data: { username: "test_user" } } }
      );
  
      expect(sessionStorage.getItem("test-session")).toBeNull();
  
      act(() => {
        jest.advanceTimersByTime(1000);
      });
  
      expect(sessionStorage.getItem("test-session")).toBe(JSON.stringify({ username: "test_user" }));
  
      rerender({ data: { username: "updated_user" } });
  
      act(() => {
        jest.advanceTimersByTime(1000);
      });
  
      expect(sessionStorage.getItem("test-session")).toBe(JSON.stringify({ username: "updated_user" }));
    });
  
    it("should handle API save with retries on failure", async () => {
      const mockApiSave = jest.fn().mockRejectedValueOnce(new Error("API save failed")).mockResolvedValueOnce(undefined);
      const mockOnError = jest.fn();
  
      const { rerender } = renderHook(
        ({ data }) => useFormAutoSave({
          formData: data,
          formKey: "test-api-retry",
          debounceTime: 1000,
          storageType: "api",
          saveFunction: mockApiSave,
          onError: mockOnError,
        }),
        { initialProps: { data: { username: "test_user" } } }
      );
  
      act(() => {
        jest.advanceTimersByTime(1000);
      });
  
      await act(async () => {});
  
      expect(mockApiSave).toHaveBeenCalledTimes(1);
      expect(mockOnError).toHaveBeenCalledTimes(1);
  
      rerender({ data: { username: "test_user_updated" } });
  
      act(() => {
        jest.advanceTimersByTime(1000);
      });
  
      await act(async () => {});
  
      expect(mockApiSave).toHaveBeenCalledTimes(2);
    });
  
    it("should call the API save function when storageType is 'api'", async () => {
      const mockApiSave = jest.fn().mockResolvedValue(undefined);
  
      const { rerender } = renderHook(
        ({ data }) => useFormAutoSave({
          formData: data,
          formKey: "test-api",
          debounceTime: 1000,
          storageType: "api",
          saveFunction: mockApiSave,
        }),
        { initialProps: { data: { username: "test_user" } } }
      );
  
      expect(mockApiSave).not.toHaveBeenCalled();
  
      act(() => {
        jest.advanceTimersByTime(1000);
      });
  
      await act(async () => {});
  
      expect(mockApiSave).toHaveBeenCalledTimes(1);
      expect(mockApiSave).toHaveBeenCalledWith({ username: "test_user" });
  
      rerender({ data: { username: "updated_user" } });
  
      act(() => {
        jest.advanceTimersByTime(1000);
      });
  
      await act(async () => {});
  
      expect(mockApiSave).toHaveBeenCalledTimes(2);
      expect(mockApiSave).toHaveBeenCalledWith({ username: "updated_user" });
    });
  
    it("should retry saving when API fails and save only when form data changes", async () => {
      const mockApiSave = jest.fn().mockRejectedValue(new Error("API save failed"));
      const mockOnError = jest.fn();
  
      const { rerender } = renderHook(
        ({ data }) => useFormAutoSave({
          formData: data,
          formKey: "test-api-error",
          debounceTime: 1000,
          storageType: "api",
          saveFunction: mockApiSave,
          onError: mockOnError,
        }),
        { initialProps: { data: { username: "test_user" } } }
      );
  
      act(() => {
        jest.advanceTimersByTime(1000);
      });
  
      await act(async () => {});
  
      expect(mockApiSave).toHaveBeenCalledTimes(1);
      expect(mockOnError).toHaveBeenCalledTimes(1);
  
      rerender({ data: { username: "test_user" } });
  
      act(() => {
        jest.advanceTimersByTime(1000);
      });
  
      await act(async () => {});
  
      expect(mockApiSave).toHaveBeenCalledTimes(2);
    });
  
    it("should update isSaving state correctly during API save", async () => {
      const mockApiSave: jest.Mock<Promise<void>, []> = jest.fn(() => new Promise<void>((resolve) => setTimeout(resolve, 500)));
      const mockOnError = jest.fn();
  
      const { result } = renderHook(() => useFormAutoSave({
        formData: { username: "test_user" },
        formKey: "test-isSaving",
        debounceTime: 1000,
        storageType: "api",
        saveFunction: mockApiSave,
        onError: mockOnError,
      }));
  
      expect(result.current.isSaving).toBe(false);
  
      act(() => {
        jest.advanceTimersByTime(1000);
      });
  
      await act(async () => {});
  
      expect(result.current.isSaving).toBe(true);
  
      act(() => {
        jest.advanceTimersByTime(500);
      });
  
      await act(async () => {});
  
      expect(result.current.isSaving).toBe(false);
    });

    it("should call the API save function only when form data changes", async () => {
      const mockApiSave = jest.fn().mockResolvedValue(undefined);
      const mockOnError = jest.fn();
  
      const { rerender } = renderHook(
        ({ data }) => useFormAutoSave({
          formData: data,
          formKey: "test-api-change",
          debounceTime: 1000,
          storageType: "api",
          saveFunction: mockApiSave,
          onError: mockOnError,
        }),
        { initialProps: { data: { username: "test_user" } } }
      );
  
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });
  
      await act(async () => {});
  
      expect(mockApiSave).toHaveBeenCalledTimes(1);
  
      rerender({ data: { username: "test_user" } });
  
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });
  
      await act(async () => {});
  
      expect(mockApiSave).toHaveBeenCalledTimes(1);
  
      rerender({ data: { username: "updated_user" } });
  
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });
  
      await act(async () => {});
  
      expect(mockApiSave).toHaveBeenCalledTimes(2);
  
      rerender({ data: { username: "updated_user" } });
  
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });
  
      await act(async () => {});
  
      expect(mockApiSave).toHaveBeenCalledTimes(2);
    });
  
    it("should update isSaving state correctly during save", async () => {
      const mockApiSave: jest.Mock<Promise<void>, []> = jest.fn(() => new Promise<void>((resolve) => setTimeout(resolve, 500)));
      const mockOnError = jest.fn();
  
      const { result } = renderHook(() => useFormAutoSave({
        formData: { username: "test_user" },
        formKey: "test-isSaving",
        debounceTime: 1000,
        storageType: "api",
        saveFunction: mockApiSave,
        onError: mockOnError,
      }));
  
      expect(result.current.isSaving).toBe(false);
  
      act(() => {
        jest.advanceTimersByTime(1000);
      });
  
      await act(async () => {});
  
      expect(result.current.isSaving).toBe(true);
  
      act(() => {
        jest.advanceTimersByTime(500);
      });
  
      await act(async () => {});
  
      expect(result.current.isSaving).toBe(false);
    });
  
    it("should reset isSaving to false when API save fails", async () => {
      const mockApiSave = jest.fn(() => Promise.reject(new Error("API save failed")));
      const mockOnError = jest.fn();
  
      const { result } = renderHook(() => useFormAutoSave({
        formData: { username: "test_user" },
        formKey: "test-isSaving-fail",
        debounceTime: 1000,
        storageType: "api",
        saveFunction: mockApiSave,
        onError: mockOnError,
      }));
  
      expect(result.current.isSaving).toBe(false);
  
      act(() => {
        jest.advanceTimersByTime(1000);
      });
  
      expect(result.current.isSaving).toBe(true);
  
      await act(async () => {});
  
      expect(result.current.isSaving).toBe(false);
      expect(mockOnError).toHaveBeenCalledTimes(1);
    });
  
    it("should update isSaveSuccessful correctly on successful save", async () => {
      const mockApiSave = jest.fn().mockResolvedValue(undefined);
      const mockOnError = jest.fn();
  
      const { rerender, result } = renderHook(
        ({ data }) => useFormAutoSave({
          formData: data,
          formKey: "test-save-success",
          debounceTime: 1000,
          storageType: "api",
          saveFunction: mockApiSave,
          onError: mockOnError,
        }),
        { initialProps: { data: { username: "test_user" } } }
      );
  
      expect(result.current.isSaveSuccessful).toBe(false);
  
      act(() => {
        jest.advanceTimersByTime(1000);
      });
  
      expect(result.current.isSaving).toBe(true);
      expect(result.current.isSaveSuccessful).toBe(false);
  
      await act(async () => {});
  
      expect(result.current.isSaveSuccessful).toBe(true);
      expect(result.current.isSaving).toBe(false);
  
      rerender({ data: { username: "updated_user" } });
  
      act(() => {
        jest.advanceTimersByTime(1000);
      });
  
      expect(result.current.isSaveSuccessful).toBe(false);
    });
  
    it("should set isSaveSuccessful to false when saving fails", async () => {
      const mockApiSave = jest.fn().mockRejectedValue(new Error("API save failed"));
      const mockOnError = jest.fn();
  
      const { rerender, result } = renderHook(
        ({ data }) => useFormAutoSave({
          formData: data,
          formKey: "test-save-fail",
          debounceTime: 1000,
          storageType: "api",
          saveFunction: mockApiSave,
          onError: mockOnError,
        }),
        { initialProps: { data: { username: "test_user" } } }
      );
  
      expect(result.current.isSaveSuccessful).toBe(false);
  
      act(() => {
        jest.advanceTimersByTime(1000);
      });
  
      expect(result.current.isSaving).toBe(true);
  
      await act(async () => {});
  
      expect(result.current.isSaving).toBe(false);
      expect(result.current.isSaveSuccessful).toBe(false);
      expect(mockOnError).toHaveBeenCalledTimes(1);
  
      rerender({ data: { username: "updated_user" } });
  
      act(() => {
        jest.advanceTimersByTime(1000);
      });
  
      await act(async () => {});
  
      expect(result.current.isSaveSuccessful).toBe(false);
      expect(mockOnError).toHaveBeenCalledTimes(2);
    });   
    
    it("Skip Initial Save: should not save the initial form data when skipInitialSave is true", () => {
      renderHook(() => useFormAutoSave({
        formData: { name: "Initial" },
        formKey: "skip-initial",
        debounceTime: 1000,
        skipInitialSave: true,
      }));

      act(() => {
          jest.advanceTimersByTime(1000);
      });

      expect(localStorage.getItem("skip-initial")).toBeNull();
  });

  it("No Re-Save on Unchanged Data: should not trigger save if form data is unchanged", () => {
      const spy = jest.spyOn(Storage.prototype, "setItem");
      const { rerender } = renderHook(
        ({ data }) => useFormAutoSave({
          formData: data,
          formKey: "unchanged-test",
          debounceTime: 1000,
        }),
        { initialProps: { data: { value: 123 } } }
      );

      act(() => {
          jest.advanceTimersByTime(1000);
      });
      expect(spy).toHaveBeenCalledTimes(1);

      // Rerender with exactly the same data
      rerender({ data: { value: 123 } });
      act(() => {
          jest.advanceTimersByTime(1000);
      });

      // No new save should happen when the data is deeply equal.
      expect(spy).toHaveBeenCalledTimes(1);
      spy.mockRestore();
  });

  it("Debounce Cancellation on Unmount: should cancel pending save when unmounted before debounce elapses", () => {
      const { unmount } = renderHook(() => useFormAutoSave({
        formData: { name: "CancelTest" },
        formKey: "cancel-test",
        debounceTime: 1000,
      }));

      // Unmount before advancing timers
      unmount();

      act(() => {
          jest.advanceTimersByTime(1000);
      });

      expect(localStorage.getItem("cancel-test")).toBeNull();
  });

  it("Resume Auto Save After Failure: should resume auto-save after invoking resumeAutoSave", async () => {
      // Setup mock API save that fails initially then succeeds.
      const mockApiSave = jest
        .fn()
        // First attempt fails.
        .mockRejectedValueOnce(new Error("API failure"))
        // Second attempt (after resume) succeeds.
        .mockResolvedValue(undefined);

      const { result, rerender } = renderHook(
        ({ data }) => useFormAutoSave({
          formData: data,
          formKey: "resume-test",
          debounceTime: 1000,
          storageType: "api",
          saveFunction: mockApiSave,
          maxRetries: 0, // Immediately pause on failure
        }),
        { initialProps: { data: { username: "fail_user" } } }
      );

      // Trigger a save which fails and should pause auto-save.
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      await act(async () => {});

      // Auto Save should be paused due to failure.
      expect(result.current.isAutoSavePaused).toBe(true);
      expect(mockApiSave).toHaveBeenCalledTimes(1);

      // Invoke resumeAutoSave, update form data and trigger a save again.
      act(() => {
        result.current.resumeAutoSave();
      });

      // Re-render with updated data.
      rerender({ data: { username: "recovered_user" } });
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      await act(async () => {});

      // Now save should resume
      expect(result.current.isAutoSavePaused).toBe(false);
      expect(mockApiSave).toHaveBeenCalledTimes(2);
      // Check that API was called with the recovered data.
      expect(mockApiSave).toHaveBeenLastCalledWith({ username: "recovered_user" });
  });

  it("API Storage Without Save Function: should not crash if storageType is 'api' and saveFunction is not provided", () => {
      renderHook(() => useFormAutoSave({
        formData: { test: "noApiFunc" },
        formKey: "no-api-saveFunc",
        debounceTime: 1000,
        storageType: "api",
      }));

      act(() => {
          jest.advanceTimersByTime(1000);
      });
      // Since saveFunction is not provided, nothing should be saved or thrown.
      expect(true).toBe(true);
  });

  it("Handling Undefined or Null Form Data: should do nothing if form data is undefined or an empty object", () => {
      // Test with undefined
      const { result: undefinedResult } = renderHook(() => useFormAutoSave({
        formData: undefined as any,
        formKey: "undefined-test",
        debounceTime: 1000,
      }));

      act(() => {
          jest.advanceTimersByTime(1000);
      });
      expect(undefinedResult.current.restoreFormData()).toBeNull();

      // Test with empty object (should not trigger save as Object.keys returns empty array)
      const { result: emptyResult } = renderHook(() => useFormAutoSave({
        formData: {},
        formKey: "empty-test",
        debounceTime: 1000,
      }));

      act(() => {
          jest.advanceTimersByTime(1000);
      });
      expect(emptyResult.current.restoreFormData()).toBeNull();
  });

  it("Timer Cleanup on Rapid State Changes: should cancel pending timeouts on rapid data changes", () => {
      const spy = jest.spyOn(Storage.prototype, "setItem");
      const { rerender } = renderHook(
        ({ data }) => useFormAutoSave({
          formData: data,
          formKey: "rapid-test",
          debounceTime: 1000,
        }),
        { initialProps: { data: { counter: 1 } } }
      );

      // Rapid changes before timer expires.
      rerender({ data: { counter: 2 } });
      rerender({ data: { counter: 3 } });
      rerender({ data: { counter: 4 } });

      act(() => {
          jest.advanceTimersByTime(1000);
      });

      expect(spy).toHaveBeenCalledTimes(1);
      expect(localStorage.getItem("rapid-test")).toBe(JSON.stringify({ counter: 4 }));
      spy.mockRestore();
  });

  it("No Error Callback Provided: should handle API failure gracefully when onError is not provided", async () => {
      const mockApiSave = jest.fn().mockRejectedValue(new Error("API error"));
      const { result } = renderHook(() => useFormAutoSave({
        formData: { username: "error_user" },
        formKey: "no-error-callback",
        debounceTime: 1000,
        storageType: "api",
        saveFunction: mockApiSave,
      }));

      act(() => {
          jest.advanceTimersByTime(1000);
      });
      await act(async () => {});

      // Should not crash. isSaving resets to false.
      expect(result.current.isSaving).toBe(false);
      // Since maxRetries default is 3, auto-save is not paused yet.
      expect(result.current.isAutoSavePaused).toBe(false);
  });
});