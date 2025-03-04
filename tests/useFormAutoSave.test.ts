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
      
        // Update form data
        rerender({ data: { name: "Bob" } });
      
        act(() => {
          jest.advanceTimersByTime(1000);
        });
    
        expect(localStorage.getItem("test-form")).toBe(JSON.stringify({ name: "Bob" }));
        
    });
    
});