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
});