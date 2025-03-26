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
    it('should warn if neither formData nor control is provided', () => {
        const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

        renderHook(() =>
        useFormAutoSave({
            formKey: 'testForm',
        } as any)
        );

        expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[useFormAutoSave] You must provide either "formData" (manual) or "control" (React Hook Form). Auto-save will not run.'
        );

        consoleWarnSpy.mockRestore();
    });
});