import { renderHook, act } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { useFormAutoSave } from "../src/useFormAutoSave";
import { useSaveHandler } from '../src/useSaveHandler';

describe("useFormAutoSave (React Hook Form)", () => {
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    sessionStorage.clear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("should auto-save form data to sessionStorage", () => {
    const { result } = renderHook(() => {
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
    const { result, rerender } = renderHook(({ values }) => {
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
    const { result } = renderHook(() => {
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

  it('logs messages when debug is true', () => {
    const { result: formResult } = renderHook(() => useForm({ defaultValues: { name: '' } }));
    const mockSaveFunction = jest.fn();

    const { result } = renderHook(() =>
      useFormAutoSave({
        control: formResult.current.control,
        formKey: 'testForm',
        debug: true,
        debounceTime: 1000,
        storageType: 'api',
        saveFunction: mockSaveFunction,
      })
    );

    result.current.restoreFormData();

    expect(consoleLogSpy).toHaveBeenCalledWith(
      '[useFormAutoSave]',
      'Restore functionality is unavailable for API storage.'
    );
  });

  it("Using React Hook Form Control: should react to control value changes", () => {
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

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(localStorage.getItem("control-test")).toBe(JSON.stringify({ username: "initial_user" }));

    act(() => {
        formResult.current.setValue("username", "updated_user");
    });

    rerender({ ctrl: formResult.current.control });
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(localStorage.getItem("control-test")).toBe(JSON.stringify({ username: "updated_user" }));
  });

  it('pauses auto-save after exceeding maxRetries', async () => {
    const mockLogDebug = jest.fn();
    const mockSetIsAutoSavePaused = jest.fn();
    const mockSetShouldRetry = jest.fn();
    const mockSetRetryCount = jest.fn();
    const mockOnError = jest.fn();

    const { result } = renderHook(() =>
      useSaveHandler({
        formKey: 'testForm',
        storageType: 'api',
        saveFunction: jest.fn().mockRejectedValue(new Error('Save failed')),
        onError: mockOnError,
        maxRetries: 3,
        logDebug: mockLogDebug,
        retryCount: 3,
        setRetryCount: mockSetRetryCount,
        setShouldRetry: mockSetShouldRetry,
        setIsAutoSavePaused: mockSetIsAutoSavePaused,
        setIsSaving: jest.fn(),
        setIsSaveSuccessful: jest.fn(),
        setLastSavedData: jest.fn(),
      })
    );

    await act(async () => {
      await result.current.performSave({ test: 'data' });
    });

    expect(mockSetIsAutoSavePaused).toHaveBeenCalledWith(true);
    expect(mockLogDebug).toHaveBeenCalledWith('Auto-save paused after 3 retries.');
  });

  it('pauses auto-save after exceeding maxRetries for local/session storage', async () => {
    const mockLogDebug = jest.fn();
    const mockSetIsAutoSavePaused = jest.fn();
    const mockSetShouldRetry = jest.fn();
    const mockSetRetryCount = jest.fn();
    const mockOnError = jest.fn();

    const mockStorage = {
      setItem: jest.fn(() => {
        throw new Error('Storage failed');
      }),
    };
    Object.defineProperty(global, 'localStorage', { value: mockStorage });

    const { result } = renderHook(() =>
      useSaveHandler({
        formKey: 'testForm',
        storageType: 'localStorage',
        maxRetries: 3,
        retryCount: 3,
        logDebug: mockLogDebug,
        setRetryCount: mockSetRetryCount,
        setShouldRetry: mockSetShouldRetry,
        setIsAutoSavePaused: mockSetIsAutoSavePaused,
        setIsSaving: jest.fn(),
        setIsSaveSuccessful: jest.fn(),
        setLastSavedData: jest.fn(),
        onError: mockOnError,
      })
    );

    await act(async () => {
      await result.current.performSave({ test: 'data' });
    });

    expect(mockSetIsAutoSavePaused).toHaveBeenCalledWith(true);

    expect(mockLogDebug).toHaveBeenCalledWith('Storage save failed:', expect.any(Error));
  });
});
