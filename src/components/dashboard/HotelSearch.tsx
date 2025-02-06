import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  List,
  ListItem,
  ListItemText,
  Popper,
  ClickAwayListener,
  Grow,
  Button,
  Menu,
} from '@mui/material';
import { Hotel } from '../../types/api';
import { useDebounce } from '../../hooks/useDebounce';
import { componentStyles } from '../../theme';
import { useTheme } from '@mui/material/styles';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

interface HotelSearchProps {
  hotels: Hotel[];
  selectedHotel: string | null;
  onHotelChange: (hotelId: string) => void;
  isMobile?: boolean;
  variant: 'dropdown' | 'search';
}

const HotelSearch: React.FC<HotelSearchProps> = ({
  hotels,
  selectedHotel,
  onHotelChange,
  isMobile = false,
  variant,
}) => {
  const theme = useTheme();
  const currentMode = theme.palette.mode as 'light' | 'dark';

  // State for search functionality (only used in "search" variant)
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Filtered hotels (used in both variants)
  const filteredHotels = React.useMemo(
    () =>
      hotels.filter((hotel) =>
        hotel.hotelname.toLowerCase().includes(
          variant === 'search'
            ? debouncedSearch.toLowerCase()
            : '' // for dropdown, show all
        )
      ),
    [hotels, debouncedSearch, variant]
  );

  // Dropdown variant handlers
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleMenuItemClick = (hotelId: string) => {
    onHotelChange(hotelId);
    handleMenuClose();
  };

  // For the search variant, control the popper open/close
  useEffect(() => {
    if (variant === 'search') {
      if (debouncedSearch) {
        setIsSearchOpen(true);
      } else {
        setIsSearchOpen(false);
      }
    }
  }, [debouncedSearch, variant]);

  if (variant === 'dropdown') {
    const selectedHotelName =
      hotels.find((hotel) => hotel.id === selectedHotel)?.hotelname ||
      'Select Hotel';
    return (
      <Box>
        <Button
          onClick={handleMenuOpen}
          endIcon={<ArrowDropDownIcon />}
          variant="text"
          sx={{ color: 'inherit' }}
        >
          {selectedHotelName}
        </Button>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          {hotels.map((hotel) => (
            <MenuItem
              key={hotel.id}
              onClick={() => handleMenuItemClick(hotel.id)}
            >
              {hotel.hotelname}
            </MenuItem>
          ))}
        </Menu>
      </Box>
    );
  } else if (variant === 'search') {
    return (
      <Box
        ref={searchRef}
        sx={{ position: 'relative', width: isMobile ? '100%' : 400 }}
      >
        <TextField
          size="small"
          placeholder="Search hotels..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={componentStyles.hotelSearch.textField(isMobile, currentMode)}
          aria-label="Search hotels"
        />
        <Popper
          open={isSearchOpen && filteredHotels.length > 0}
          anchorEl={searchRef.current}
          placement="bottom-start"
          transition
          style={{ zIndex: 1300, width: searchRef.current?.offsetWidth }}
        >
          {({ TransitionProps }) => (
            <Grow {...TransitionProps}>
              <Paper
                elevation={8}
                sx={componentStyles.hotelSearch.popperPaper}
              >
                <ClickAwayListener onClickAway={() => setIsSearchOpen(false)}>
                  <List dense>
                    {filteredHotels.map((hotel) => (
                      <ListItem
                        key={hotel.id}
                        onClick={() => {
                          onHotelChange(hotel.id);
                          setSearchTerm('');
                          setIsSearchOpen(false);
                        }}
                        sx={{
                          cursor: 'pointer',
                          '&:hover': { backgroundColor: 'action.hover' },
                        }}
                      >
                        <ListItemText primary={hotel.hotelname} />
                      </ListItem>
                    ))}
                  </List>
                </ClickAwayListener>
              </Paper>
            </Grow>
          )}
        </Popper>
      </Box>
    );
  } else {
    // Fallback (should not occur)
    return null;
  }
};

export default HotelSearch;
