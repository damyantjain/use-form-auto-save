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
          ({ data }) => useFormAutoSave(data, "test-form", 1000),
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
        const { result } = renderHook(() => useFormAutoSave({}, "test-form"));
        expect(result.current.restoreFormData()).toEqual({ email: "test@example.com" });
    });
    
    it("should not save when form data is empty", () => {
        renderHook(() => useFormAutoSave({}, "empty-form"));
  
        act(() => {
          jest.advanceTimersByTime(1000);
        });
  
        expect(localStorage.getItem("empty-form")).toBeNull();
    });

    it("should save form data to sessionStorage when specified", () => {
        const { rerender } = renderHook(
          ({ data }) => useFormAutoSave(data, "test-session", 1000, "sessionStorage"),
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
      it("should call the API save function when storageType is 'api'", async () => {
        const mockApiSave = jest.fn().mockResolvedValue(undefined);
      
        const { rerender } = renderHook(
          ({ data }) => useFormAutoSave(data, "test-api", 1000, "api", mockApiSave),
          { initialProps: { data: { username: "test_user" } } }
        );
      
        expect(mockApiSave).not.toHaveBeenCalled();
      
        act(() => {
          jest.advanceTimersByTime(1000);
        });
      
        expect(mockApiSave).toHaveBeenCalledTimes(1);
        expect(mockApiSave).toHaveBeenCalledWith({ username: "test_user" });
      
        rerender({ data: { username: "updated_user" } });
      
        act(() => {
          jest.advanceTimersByTime(1000);
        });
      
        expect(mockApiSave).toHaveBeenCalledTimes(2);
        expect(mockApiSave).toHaveBeenCalledWith({ username: "updated_user" });
      });
      it("should retry saving when API fails and save only when form data changes", async () => {
        const mockApiSave = jest.fn().mockRejectedValue(new Error("API save failed"));
        const mockOnError = jest.fn();
      
        const { rerender } = renderHook(
          ({ data }) => useFormAutoSave(data, "test-api-error", 1000, "api", mockApiSave, mockOnError),
          { initialProps: { data: { username: "test_user" } } }
        );
      
        await act(async () => {
          jest.advanceTimersByTime(1000);
        });
      
        expect(mockApiSave).toHaveBeenCalledTimes(1);
        expect(mockOnError).toHaveBeenCalledTimes(1);

        rerender({ data: { username: "test_user" } });
      
        await act(async () => {
          jest.advanceTimersByTime(1000);
        });
      
        expect(mockApiSave).toHaveBeenCalledTimes(2);
      
        jest.clearAllMocks();

        rerender({ data: { username: "updated_user" } });
      
        await act(async () => {
          jest.advanceTimersByTime(1000);
        });
      
        expect(mockApiSave).toHaveBeenCalledTimes(1);
      });
      it("should call the API save function only when form data changes", async () => {
        const mockApiSave = jest.fn().mockResolvedValue(undefined);
        const mockOnError = jest.fn();
      
        const { rerender } = renderHook(
          ({ data }) => useFormAutoSave(data, "test-api-change", 1000, "api", mockApiSave, mockOnError),
          { initialProps: { data: { username: "test_user" } } }
        );
      
        await act(async () => {
          jest.advanceTimersByTime(1000);
        });
      
        expect(mockApiSave).toHaveBeenCalledTimes(1);
      
        // Scenario 1: Re-render with SAME data (should NOT call API again)
        rerender({ data: { username: "test_user" } });
      
        await act(async () => {
          jest.advanceTimersByTime(1000);
        });
      
        expect(mockApiSave).toHaveBeenCalledTimes(1);
      
        // Scenario 2: Re-render with UPDATED data (should trigger API call)
        rerender({ data: { username: "updated_user" } });
      
        await act(async () => {
          jest.advanceTimersByTime(1000);
        });
      
        expect(mockApiSave).toHaveBeenCalledTimes(2); 
      
        // Scenario 3: Re-render with previous data (should NOT call API again)
        rerender({ data: { username: "updated_user" } });
      
        await act(async () => {
          jest.advanceTimersByTime(1000);
        });
      
        expect(mockApiSave).toHaveBeenCalledTimes(2);
      });
      it("should update isSaving state correctly during save", async () => {
        const mockApiSave: jest.Mock<Promise<void>> = jest.fn(
          () => new Promise<void>((resolve) => setTimeout(resolve, 500))
        );
        const mockOnError = jest.fn();
      
        const { result } = renderHook(
          ({ data }) => useFormAutoSave(data, "test-isSaving", 1000, "api", mockApiSave, mockOnError),
          { initialProps: { data: { username: "test_user" } } }
        );
      
        expect(result.current.isSaving).toBe(false);
      
        act(() => {
          jest.advanceTimersByTime(1000);
        });
      
        await act(async () => {});
      
        expect(result.current.isSaving).toBe(true);
      
        await act(async () => {
          jest.advanceTimersByTime(500);
        });
      
        await act(async () => {});
      
        expect(result.current.isSaving).toBe(false);
      });
});