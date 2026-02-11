import { useEffect, useState } from 'react';
import { searchLocations } from '../services';
import { GeoLocation } from '../types';
import { useDebouncedValue } from './useDebouncedValue';

export function useLocationSearch(initialInputValue = '') {
  const [inputValue, setInputValue] = useState(initialInputValue);
  const [options, setOptions] = useState<GeoLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedInput = useDebouncedValue(inputValue, 300);

  useEffect(() => {
    setInputValue(initialInputValue);
  }, [initialInputValue]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadLocations(): Promise<void> {
      if (debouncedInput.trim().length === 0) {
        setOptions([]);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const results = await searchLocations(debouncedInput, controller.signal);
        setOptions(results);
      } catch (requestError) {
        if (controller.signal.aborted) {
          return;
        }

        setOptions([]);
        setError(requestError instanceof Error ? requestError.message : 'Unable to search locations');
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadLocations();

    return () => {
      controller.abort();
    };
  }, [debouncedInput]);

  return {
    inputValue,
    setInputValue,
    options,
    loading,
    error
  };
}
