import { Autocomplete, CircularProgress, TextField } from '@mui/material';
import { useLocationSearch } from '../../../hooks';
import { GeoLocation } from '../../../types';
import { extractCityName } from '../../../utils/format';

interface CitySearchInputProps {
  onCitySelected: (city: string) => void;
  initialValue?: string;
  onInputValueChange?: (value: string) => void;
}

export function CitySearchInput({ onCitySelected, initialValue = '', onInputValueChange }: CitySearchInputProps) {
  const { inputValue, setInputValue, options, loading, error } = useLocationSearch(initialValue);

  return (
    <Autocomplete<GeoLocation | string, false, false, true>
      freeSolo
      options={options}
      inputValue={inputValue}
      onInputChange={(_, value) => {
        setInputValue(value);
        onInputValueChange?.(value);
      }}
      getOptionLabel={(option) => (typeof option === 'string' ? option : option.label)}
      onChange={(_, value) => {
        if (!value) {
          return;
        }

        const label = typeof value === 'string' ? value : value.label;
        onCitySelected(extractCityName(label));
      }}
      noOptionsText={error ?? 'No results'}
      filterOptions={(items) => items}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder="Search a city"
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={18} /> : null}
                {params.InputProps.endAdornment}
              </>
            )
          }}
        />
      )}
    />
  );
}
