import { renderHook, act } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { useFormAutoSave } from "../src/useFormAutoSave";

describe("useFormAutoSave Hook - React Hook Form Integration", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("should watch React Hook Form values and auto-save to localStorage", () => {
    const { result } = renderHook(() => {
      const { control } = useForm({
        defaultValues: { name: "Alice", email: "alice@example.com" },
      });

      return useFormAutoSave({
        formData: null,
        formKey: "test-rhf",
        debounceTime: 1000,
        storageType: "localStorage",
        control,
      });
    });

    expect(localStorage.getItem("test-rhf")).toBeNull();

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(localStorage.getItem("test-rhf")).toBe(
      JSON.stringify({ name: "Alice", email: "alice@example.com" })
    );
  });

  it("should not save if form data has not changed", () => {
    const { result, rerender } = renderHook(({ defaultValues }) => {
      const { control } = useForm({ defaultValues });
      return useFormAutoSave({
        formData: null,
        formKey: "test-rhf-no-change",
        debounceTime: 1000,
        storageType: "localStorage",
        control,
      });
    }, { initialProps: { defaultValues: { name: "Alice", email: "alice@example.com" } } });

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(localStorage.getItem("test-rhf-no-change")).toBe(
      JSON.stringify({ name: "Alice", email: "alice@example.com" })
    );

    jest.clearAllMocks();

    rerender({ defaultValues: { name: "Alice", email: "alice@example.com" } });

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(localStorage.getItem("test-rhf-no-change")).toBe(
      JSON.stringify({ name: "Alice", email: "alice@example.com" })
    );
  });

  it("should update localStorage when form data changes", () => {
    const { result } = renderHook(() => {
      const { control, setValue } = useForm({
        defaultValues: { name: "Alice", email: "alice@example.com" },
      });
  
      return { ...useFormAutoSave({
        formData: null,
        formKey: "test-rhf-update",
        debounceTime: 1000,
        storageType: "localStorage",
        control,
      }), setValue };
    });
  
    act(() => {
      jest.advanceTimersByTime(1000);
    });
  
    expect(localStorage.getItem("test-rhf-update")).toBe(
      JSON.stringify({ name: "Alice", email: "alice@example.com" })
    );
  
    act(() => {
      result.current.setValue("name", "Bob");
      result.current.setValue("email", "bob@example.com");
    });
  
    act(() => {
      jest.advanceTimersByTime(1000);
    });
  
    expect(localStorage.getItem("test-rhf-update")).toBe(
      JSON.stringify({ name: "Bob", email: "bob@example.com" })
    );
  });
  
});
