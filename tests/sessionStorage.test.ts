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
      ({ data }) =>
        useFormAutoSave({
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

    expect(sessionStorage.getItem("test-session")).toBe(
      JSON.stringify({ username: "test_user" })
    );

    rerender({ data: { username: "updated_user" } });

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(sessionStorage.getItem("test-session")).toBe(
      JSON.stringify({ username: "updated_user" })
    );
  });

  it("should restore saved data from sessionStorage", () => {
    sessionStorage.setItem(
      "session-restore",
      JSON.stringify({ email: "test@example.com" })
    );
    const { result } = renderHook(() =>
      useFormAutoSave({
        formData: {},
        formKey: "session-restore",
        debounceTime: 1000,
        storageType: "sessionStorage",
      })
    );
    expect(result.current.restoreFormData()).toEqual({
      email: "test@example.com",
    });
  });
  it("No Re-Save on Unchanged Data: should not trigger save if form data is unchanged", () => {
    const spy = jest.spyOn(Storage.prototype, "setItem");
    const { rerender } = renderHook(
      ({ data }) =>
        useFormAutoSave({
          formData: data,
          formKey: "unchanged-session",
          debounceTime: 1000,
          storageType: "sessionStorage",
        }),
      { initialProps: { data: { value: 123 } } }
    );

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(spy).toHaveBeenCalledTimes(1);

    // Rerender with identical data.
    rerender({ data: { value: 123 } });
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });

  it("should handle storage save failure gracefully for sessionStorage", async () => {
    const setItemMock = jest
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("QuotaExceededError");
      });
    const onError = jest.fn();

    renderHook(() =>
      useFormAutoSave({
        formData: { name: "ErrorTest" },
        formKey: "testSessionError",
        debounceTime: 1000,
        storageType: "sessionStorage",
        onError,
      })
    );

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await Promise.resolve();
    expect(onError).toHaveBeenCalledWith(expect.any(Error));
    setItemMock.mockRestore();
  });
});
