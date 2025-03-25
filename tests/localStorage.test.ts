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
      ({ data }) =>
        useFormAutoSave({
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

    expect(localStorage.getItem("test-form")).toBe(
      JSON.stringify({ name: "Alice" })
    );

    rerender({ data: { name: "Bob" } });

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(localStorage.getItem("test-form")).toBe(
      JSON.stringify({ name: "Bob" })
    );
  });

  it("should restore saved data from localStorage", () => {
    localStorage.setItem(
      "test-form",
      JSON.stringify({ email: "test@example.com" })
    );
    const { result } = renderHook(() =>
      useFormAutoSave({
        formData: {},
        formKey: "test-form",
      })
    );
    expect(result.current.restoreFormData()).toEqual({
      email: "test@example.com",
    });
  });

  it("should not save when form data is empty", () => {
    renderHook(() =>
      useFormAutoSave({
        formData: {},
        formKey: "empty-form",
      })
    );

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(localStorage.getItem("empty-form")).toBeNull();
  });

  it("Debounce Cancellation on Unmount: should cancel pending save when unmounted before debounce elapses", () => {
    const { unmount } = renderHook(() =>
      useFormAutoSave({
        formData: { name: "CancelTest" },
        formKey: "cancel-test",
        debounceTime: 1000,
      })
    );

    // Unmount before advancing timers
    unmount();

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(localStorage.getItem("cancel-test")).toBeNull();
  });

  it("should handle storage save failure gracefully", async () => {
    const setItemMock = jest
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("QuotaExceededError");
      });

    const onError = jest.fn();

    const formData = { name: "John" };

    renderHook(() =>
      useFormAutoSave({
        formKey: "testForm",
        formData,
        onError,
        debounceTime: 1000,
      })
    );

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    await Promise.resolve();

    expect(onError).toHaveBeenCalledWith(expect.any(Error));
    setItemMock.mockRestore();
  });

  it("No Re-Save on Unchanged Data: should not trigger save if form data is unchanged", () => {
    const spy = jest.spyOn(Storage.prototype, "setItem");
    const { rerender } = renderHook(
      ({ data }) =>
        useFormAutoSave({
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

  it("Timer Cleanup on Rapid State Changes: should cancel pending timeouts on rapid data changes", () => {
    const spy = jest.spyOn(Storage.prototype, "setItem");
    const { rerender } = renderHook(
      ({ data }) =>
        useFormAutoSave({
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
    expect(localStorage.getItem("rapid-test")).toBe(
      JSON.stringify({ counter: 4 })
    );
    spy.mockRestore();
  });
});
