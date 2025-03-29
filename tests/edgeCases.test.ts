import { renderHook, act } from "@testing-library/react";
import { useFormAutoSave } from "../src/useFormAutoSave";
import { AutoSaveConfig } from "../src/types";

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
      expect(() => {
          renderHook(() => useFormAutoSave({
              formData: undefined as any,
              formKey: "undefined-test",
              debounceTime: 1000,
          }));
      }).toThrow('[useFormAutoSave]: Either "formData" or "control" must be provided.');

      // Test with an empty object
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

    describe('useFormAutoSave - Configuration Validation', () => {

      it('throws an error if "formKey" is missing', () => {
        const config: AutoSaveConfig = {
          formData: { name: 'John' },
        } as any; // Intentionally incorrect
        expect(() => renderHook(() => useFormAutoSave(config)))
          .toThrow('"formKey" is required');
      });

      it('throws an error if "formKey" is not a string', () => {
        const config: AutoSaveConfig = {
          formKey: 123 as any,
          formData: { name: 'John' },
        };
        expect(() => renderHook(() => useFormAutoSave(config)))
          .toThrow('"formKey" is required and must be a non-empty string.');
      });

      it('throws an error if both "formData" and "control" are missing', () => {
        const config: AutoSaveConfig = {
          formKey: 'userForm',
        } as any;
        expect(() => renderHook(() => useFormAutoSave(config)))
          .toThrow('Either "formData" or "control" must be provided.');
      });

      it('throws an error if "storageType" is "api" and "saveFunction" is missing', () => {
        const config: AutoSaveConfig = {
          formKey: 'userForm',
          formData: { name: 'John' },
          storageType: 'api',
        };
        expect(() => renderHook(() => useFormAutoSave(config)))
          .toThrow('When "storageType" is "api", a valid "saveFunction" must be provided.');
      });

      it('warns if "saveFunction" is provided but "storageType" is not "api"', () => {
        const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

        const config: AutoSaveConfig = {
          formKey: 'userForm',
          formData: { name: 'John' },
          saveFunction: jest.fn(),
          storageType: 'localStorage',
        };

        renderHook(() => useFormAutoSave(config));

        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining('"saveFunction" provided but storageType is not "api"')
        );

        consoleWarnSpy.mockRestore();
      });
    });

});