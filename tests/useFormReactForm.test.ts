import { renderHook, act } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { useFormAutoSave } from "../src/useFormAutoSave";

describe("useFormAutoSave (React Hook Form)", () => {
  beforeEach(() => {
    sessionStorage.clear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("should auto-save form data to sessionStorage", () => {
    renderHook(() => {
      const { control } = useForm({ defaultValues: { name: "Alice" } });
      return useFormAutoSave({
        control,
        formKey: "rhf-form-test",
        debounceTime: 1000,
        storageType: "sessionStorage",
        skipInitialSave: false,
      });
    });

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(sessionStorage.getItem("rhf-form-test")).toBe(
      JSON.stringify({ name: "Alice" })
    );
  });

  it("should not save when data has not changed", () => {
    const { rerender } = renderHook(({ values }) => {
      const { control } = useForm({ defaultValues: values });
      return useFormAutoSave({
        control,
        formKey: "rhf-form-skip",
        debounceTime: 1000,
        storageType: "sessionStorage",
        skipInitialSave: false,
      });
    }, { initialProps: { values: { name: "Alice" } } });

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Same values
    rerender({ values: { name: "Alice" } });

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Should only be saved once
    expect(sessionStorage.getItem("rhf-form-skip")).toBe(
      JSON.stringify({ name: "Alice" })
    );
  });

  it("should restore data from sessionStorage", () => {
    sessionStorage.setItem("rhf-form-restore", JSON.stringify({ email: "test@example.com" }));

    const { result } = renderHook(() => {
      const { control } = useForm({ defaultValues: { email: "" } });
      return useFormAutoSave({
        control,
        formKey: "rhf-form-restore",
        debounceTime: 1000,
        storageType: "sessionStorage",
        skipInitialSave: true,
      });
    });

    const restored = result.current.restoreFormData();
    expect(restored).toEqual({ email: "test@example.com" });
  });

  it("should save data from RHF control to sessionStorage", () => {
    renderHook(() => {
      const { control } = useForm({ defaultValues: { name: "", email: "" } });
      return useFormAutoSave({
        control,
        formKey: "rhf-save-test",
        debounceTime: 1000,
        storageType: "sessionStorage",
      });
    });

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(sessionStorage.getItem("rhf-save-test")).toBe(JSON.stringify({ name: "", email: "" }));
  });

  it("should restore and set last saved data on mount", () => {
    sessionStorage.setItem("rhf-save-test", JSON.stringify({ name: "Bob", email: "bob@example.com" }));
  
    const { result } = renderHook(() => {
      const { control, reset } = useForm({ defaultValues: { name: "", email: "" } });
      const hook = useFormAutoSave({
        control,
        formKey: "rhf-save-test",
        debounceTime: 1000,
        storageType: "sessionStorage",
        skipInitialSave: true,
      });
  
      return { control, reset, ...hook };
    });
  
    act(() => {
      const saved = result.current.restoreFormData();
      if (saved) {
        result.current.reset(saved);
        result.current.setLastSavedData(saved);
      }
    });
  
    expect(result.current.restoreFormData()).toEqual({ name: "Bob", email: "bob@example.com" });
  });


  it("Using React Hook Form Control: should react to control value changes", () => {
    // Set up a minimal form using react-hook-form
    const { result: formResult } = renderHook(() => {
        const { control, setValue } = useForm({ defaultValues: { username: "initial_user" } });
        return { control, setValue };
    });

    // Pass the control to useFormAutoSave
    const { rerender } = renderHook(
        ({ ctrl }) => useFormAutoSave({
          control: ctrl,
          formKey: "control-test",
          debounceTime: 1000,
        }),
        { initialProps: { ctrl: formResult.current.control } }
    );

    // Initially, waiting for timer
    act(() => { 
      jest.advanceTimersByTime(1000);
    });
    // Data from control should be saved
    expect(localStorage.getItem("control-test")).toBe(JSON.stringify({ username: "initial_user" }));

    // Simulate a value change by updating the control via setValue
    act(() => {
        formResult.current.setValue("username", "updated_user");
    });

    // Rerender manually to trigger watch updates
    rerender({ ctrl: formResult.current.control });
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(localStorage.getItem("control-test")).toBe(JSON.stringify({ username: "updated_user" }));
});
  
});
