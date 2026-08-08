import { useEffect, useRef, useState } from 'react';
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
    const [searching, setSearching] = useState(false);

    // Chrome fires a synthetic mousemove after keyboard-driven listbox scrolling, which
    // would yank the highlight to whatever lands under the cursor mid-arrowing; track the
    // pointer position so only real movement is honored.
    const lastMousePosition = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const query = inputValue.trim();
        if (query === '') {
            setOptions([]);
            setSearching(false);
            return;
        }

        // Clear stale results right away: Enter adds the highlighted option, which must
        // never be a leftover from the previous query.
        setOptions([]);
        setSearching(true);

        // Debounce, and drop responses that arrive after the input has changed again.
        let active = true;
        const timeout = setTimeout(async () => {
            try {
                const results = await SearchCategories(query);
                if (active) {
                    setOptions(results);
                    setSearching(false);
                }
            } catch (error) {
                console.error(error);
                if (active) {
                    setOptions([]);
                    setSearching(false);
                }
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
            // No open/close toggle; the popup simply shows whenever there is text.
            open={inputValue.trim() !== ''}
            forcePopupIcon={false}
            // Highlight the first result as results arrive, so Enter adds it directly.
            autoHighlight
            loading={searching}
            loadingText='Searching...'
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
                const { key, onMouseMove, ...rest } = optionProps as typeof optionProps & {
                    key: string;
                };
                return (
                    <Box
                        component='li'
                        key={key}
                        {...rest}
                        onMouseMove={(event) => {
                            const { clientX, clientY } = event;
                            const last = lastMousePosition.current;
                            if (clientX === last.x && clientY === last.y) return;
                            lastMousePosition.current = { x: clientX, y: clientY };
                            onMouseMove?.(event);
                        }}
                    >
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
