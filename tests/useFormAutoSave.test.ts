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
});