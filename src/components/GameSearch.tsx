import { useEffect, useState } from 'react';
import { Autocomplete, Avatar, Box, InputAdornment, TextField } from '@mui/material';
import { Search } from '@mui/icons-material';
import { GameInfo, GetGameBoxArtUrl, SearchCategories } from '../services/twitch';

const SearchDebounceMs = 300;

export interface GameSearchProps {
    addGame(game: GameInfo): void;
}

export const GameSearch = (props: GameSearchProps) => {
    const { addGame } = props;
    const [inputValue, setInputValue] = useState('');
    const [options, setOptions] = useState<GameInfo[]>([]);

    useEffect(() => {
        const query = inputValue.trim();
        if (query === '') {
            setOptions([]);
            return;
        }

        // Debounce, and drop responses that arrive after the input has changed again.
        let active = true;
        const timeout = setTimeout(async () => {
            try {
                const results = await SearchCategories(query);
                if (active) setOptions(results);
            } catch (error) {
                console.error(error);
                if (active) setOptions([]);
            }
        }, SearchDebounceMs);
        return () => {
            active = false;
            clearTimeout(timeout);
        };
    }, [inputValue]);

    return (
        <Autocomplete
            size='small'
            fullWidth
            // The default popup elevation matches the stream list's paper color exactly;
            // lift it so the results stand out (dark mode lightens raised surfaces).
            slotProps={{ paper: { elevation: 8 } }}
            options={options}
            // Options are already filtered by the search API; show them as-is.
            filterOptions={(x) => x}
            getOptionLabel={(option) => option.name}
            // Keep the value empty so the component acts as an "add" command box: selecting
            // an option fires onChange, then MUI resets the input (reason 'reset') below.
            value={null}
            onChange={(_, value) => {
                if (value !== null) addGame(value);
            }}
            inputValue={inputValue}
            onInputChange={(_, value, reason) => setInputValue(reason === 'reset' ? '' : value)}
            noOptionsText='No games found'
            renderOption={(optionProps, option) => {
                // The props include the list key at runtime; React requires it passed
                // directly rather than spread.
                const { key, ...rest } = optionProps as typeof optionProps & { key: string };
                return (
                    <Box component='li' key={key} {...rest}>
                        <Avatar
                            src={GetGameBoxArtUrl(option, 52, 72)}
                            variant='rounded'
                            sx={{ width: '24px', height: '32px', marginRight: '8px' }}
                        />
                        {option.name}
                    </Box>
                );
            }}
            renderInput={(params) => (
                <TextField
                    {...params}
                    placeholder='Add game...'
                    InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                            <InputAdornment position='start'>
                                <Search fontSize='small' />
                            </InputAdornment>
                        ),
                    }}
                />
            )}
        />
    );
};
