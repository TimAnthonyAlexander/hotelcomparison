import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Container,
    Typography,
    TextField,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Alert,
    Pagination,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Paper,
    Divider,
    Stack,
    InputAdornment,
    Toolbar,
} from '@mui/material';
import {
    Search as SearchIcon,
    LocationOn as LocationIcon,
    Star as StarIcon,
    ArrowForward as ArrowForwardIcon,
    CalendarMonth as CalendarIcon,
    Sort as SortIcon,
} from '@mui/icons-material';
import { alpha, useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { ApiService } from '../services/api';
import type { Hotel, SearchResponse } from '../services/api';

function SearchPage() {
    const theme = useTheme();
    const navigate = useNavigate();

    const [location, setLocation] = useState('');
    const [checkInDate, setCheckInDate] = useState('');
    const [checkOutDate, setCheckOutDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [sortBy, setSortBy] = useState('price');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    const handleSearch = useCallback(
        async (page = 1) => {
            if (!location.trim()) {
                setError('Please enter a location');
                return;
            }
            if (!checkInDate || !checkOutDate) {
                setError('Please select check-in and check-out dates');
                return;
            }
            if (new Date(checkInDate) >= new Date(checkOutDate)) {
                setError('Check-out date must be after check-in date');
                return;
            }

            setLoading(true);
            setError(null);
            try {
                const response = await ApiService.searchHotels({
                    location: location.trim(),
                    check_in_date: checkInDate,
                    check_out_date: checkOutDate,
                    page,
                    per_page: 12,
                    sort: sortBy,
                    order: sortOrder,
                });
                setSearchResults(response.data);
                setCurrentPage(page);
            } catch (err) {
                console.error('Search error:', err);
                setError('Failed to search hotels. Please try again.');
            } finally {
                setLoading(false);
            }
        },
        [location, checkInDate, checkOutDate, sortBy, sortOrder]
    );

    useEffect(() => {
        if (searchResults) handleSearch(currentPage);
    }, [sortBy, sortOrder]);

    const handlePageChange = (_: React.ChangeEvent<unknown>, page: number) => {
        handleSearch(page);
    };

    function ResultItem({ hotel }: { hotel: Hotel }) {
        const accent =
            hotel.rating >= 4.5
                ? theme.palette.success.main
                : hotel.rating >= 4
                    ? theme.palette.warning.main
                    : theme.palette.primary.main;

        return (
            <Card
                onClick={() => navigate(`/hotel/${hotel.id}`)}
                sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    gap: 0,
                    overflow: 'hidden',
                    borderRadius: 3,
                    border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                    background: theme.palette.background.paper,
                    transition: 'transform .2s ease, box-shadow .2s ease, border-color .2s ease',
                    cursor: 'pointer',
                    '&:hover': {
                        transform: { md: 'translateY(-2px)' },
                        borderColor: alpha(accent, 0.5),
                        boxShadow: '0 16px 40px rgba(0,0,0,.10)',
                    },
                }}
            >
                {/* Visual rail / thumbnail */}
                <Box
                    sx={{
                        position: 'relative',
                        width: { md: 260 },
                        minHeight: { xs: 150, md: 180 },
                        flexShrink: 0,
                        bgcolor: alpha(accent, 0.08),
                        background: `linear-gradient(140deg, ${alpha(accent, 0.22)} 0%, ${alpha(
                            theme.palette.primary.light,
                            0.18
                        )} 60%, transparent 100%)`,
                        display: 'grid',
                        placeItems: 'center',
                    }}
                >
                    <Typography
                        variant="h3"
                        sx={{
                            color: 'common.white',
                            textShadow: '0 8px 24px rgba(0,0,0,.35)',
                            fontWeight: 300,
                            letterSpacing: 1.5,
                            userSelect: 'none',
                        }}
                    >
                        {hotel.title?.charAt(0)?.toUpperCase() || 'H'}
                    </Typography>

                    <Box
                        sx={{
                            position: 'absolute',
                            top: 12,
                            right: 12,
                            px: 1,
                            py: 0.5,
                            borderRadius: 2,
                            bgcolor: alpha('#fff', 0.95),
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 0.5,
                            boxShadow: '0 8px 20px rgba(0,0,0,.15)',
                        }}
                    >
                        <StarIcon sx={{ fontSize: 16, color: '#ffd700' }} />
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {hotel.rating.toFixed(1)}
                        </Typography>
                    </Box>
                </Box>

                {/* Content */}
                <CardContent
                    sx={{
                        flex: 1,
                        p: { xs: 2.5, md: 3 },
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', md: '1fr auto' },
                        alignItems: { md: 'center' },
                        gap: { xs: 1.5, md: 2 },
                    }}
                >
                    {/* Left: Title, meta, description, chips */}
                    <Stack spacing={1.25} sx={{ minWidth: 0 }}>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
                            <Typography
                                variant="h6"
                                sx={{
                                    fontWeight: 700,
                                    letterSpacing: 0.2,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {hotel.title}
                            </Typography>
                            <Chip
                                label={hotel.source}
                                size="small"
                                sx={{
                                    ml: 0.5,
                                    bgcolor: alpha(theme.palette.primary.main, 0.12),
                                    color: theme.palette.primary.main,
                                    fontWeight: 600,
                                    borderRadius: 2,
                                }}
                            />
                            {hotel.best_price && (
                                <Chip
                                    label="Available"
                                    size="small"
                                    sx={{
                                        bgcolor: alpha(theme.palette.success.main, 0.14),
                                        color: theme.palette.success.main,
                                        fontWeight: 700,
                                        borderRadius: 2,
                                    }}
                                />
                            )}
                        </Stack>

                        <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                            <LocationIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {hotel.address}
                            </Typography>
                        </Stack>

                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                minHeight: 40,
                            }}
                        >
                            {hotel.description || 'Discover this hotel with solid amenities and service.'}
                        </Typography>
                    </Stack>

                    {/* Right: Price + meta */}
                    <Stack
                        spacing={0.5}
                        alignItems={{ xs: 'flex-start', md: 'flex-end' }}
                        sx={{ textAlign: { md: 'right' } }}
                    >
                        {hotel.best_price && (
                            <Typography variant="h6" sx={{ fontWeight: 800, color: 'success.main' }}>
                                From €{hotel.best_price.toFixed(0)} / night
                            </Typography>
                        )}
                        <Typography variant="body2" color="text.secondary">
                            {hotel.available_rooms} room{hotel.available_rooms !== 1 ? 's' : ''} • {hotel.total_offers}{' '}
                            offer{hotel.total_offers !== 1 ? 's' : ''}
                        </Typography>
                        <ArrowForwardIcon sx={{ mt: { xs: 0.5, md: 1 }, color: 'text.disabled' }} />
                    </Stack>
                </CardContent>
            </Card>
        );
    }

    return (
        <Box sx={{ bgcolor: 'background.default' }}>
            {/* Header */}
            <Box
                sx={{
                    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                    background: `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, transparent 100%)`,
                }}
            >
                <Container maxWidth="lg">
                    <Box sx={{ py: { xs: 3, md: 4 } }}>
                        <Typography
                            variant="h3"
                            sx={{
                                fontWeight: 900,
                                letterSpacing: 0.2,
                                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}
                        >
                            {location}
                        </Typography>
                    </Box>
                </Container>
            </Box>

            {/* Sticky controls bar */}
            <Paper
                elevation={0}
                sx={{
                    position: 'sticky',
                    zIndex: 5,
                    borderRadius: 0,
                    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                    bgcolor: alpha(theme.palette.background.paper, 0.9),
                    backdropFilter: 'blur(6px)',
                    top: { xs: 56, md: 'calc(64px + env(safe-area-inset-top, 0px))' },
                }}
            >
                <Container maxWidth="lg">
                    <Toolbar disableGutters sx={{ py: 1.5, gap: 1.5, flexWrap: 'wrap' }}>
                        <TextField
                            placeholder="Destination"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            fullWidth
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <LocationIcon sx={{ color: 'text.secondary' }} />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{
                                maxWidth: { xs: '100%', md: 320 },
                                '& .MuiOutlinedInput-root': { borderRadius: 2 },
                            }}
                        />
                        <TextField
                            type="date"
                            label="Check-in"
                            value={checkInDate}
                            onChange={(e) => setCheckInDate(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{ min: new Date().toISOString().split('T')[0] }}
                            sx={{ minWidth: 170 }}
                        />
                        <TextField
                            type="date"
                            label="Check-out"
                            value={checkOutDate}
                            onChange={(e) => setCheckOutDate(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{ min: checkInDate || new Date().toISOString().split('T')[0] }}
                            sx={{ minWidth: 170 }}
                        />
                        <Button
                            onClick={() => handleSearch()}
                            variant="contained"
                            startIcon={!loading ? <SearchIcon /> : undefined}
                            disabled={loading}
                            sx={{
                                minWidth: 140,
                                borderRadius: 2,
                                fontWeight: 700,
                                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                                '&:hover': { filter: 'brightness(0.95)' },
                            }}
                        >
                            {loading ? <CircularProgress size={20} color="inherit" /> : 'Search'}
                        </Button>

                        <Box sx={{ flexGrow: 1 }} />

                        {searchResults && (
                            <Stack direction="row" spacing={1.5} alignItems="center">
                                <SortIcon sx={{ color: 'text.secondary' }} />
                                <FormControl size="small" sx={{ minWidth: 160 }}>
                                    <InputLabel>Sort by</InputLabel>
                                    <Select value={sortBy} label="Sort by" onChange={(e) => setSortBy(e.target.value)}>
                                        <MenuItem value="best_price">Price</MenuItem>
                                        <MenuItem value="rating">Rating</MenuItem>
                                        <MenuItem value="title">Name</MenuItem>
                                        <MenuItem value="available_rooms">Availability</MenuItem>
                                    </Select>
                                </FormControl>
                                <FormControl size="small" sx={{ minWidth: 140 }}>
                                    <InputLabel>Order</InputLabel>
                                    <Select
                                        value={sortOrder}
                                        label="Order"
                                        onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                                    >
                                        <MenuItem value="desc">High to Low</MenuItem>
                                        <MenuItem value="asc">Low to High</MenuItem>
                                    </Select>
                                </FormControl>
                            </Stack>
                        )}
                    </Toolbar>
                </Container>
            </Paper>

            <Container maxWidth="lg" sx={{ py: 3 }}>
                {error && (
                    <Alert
                        severity="error"
                        sx={{
                            mb: 3,
                            borderRadius: 2,
                            border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`,
                        }}
                    >
                        {error}
                    </Alert>
                )}

                {searchResults && (
                    <Box>
                        <Stack
                            direction={{ xs: 'column', md: 'row' }}
                            spacing={1.5}
                            alignItems={{ md: 'center' }}
                            justifyContent="space-between"
                            sx={{ mb: 2 }}
                        >
                            <Stack spacing={0.25}>
                                <Typography variant="h5" sx={{ fontWeight: 800 }}>
                                    Hotels in {searchResults.search.location}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                    <CalendarIcon sx={{ fontSize: 18 }} />
                                    {new Date(searchResults.search.check_in_date).toLocaleDateString('en-US', {
                                        weekday: 'short',
                                        month: 'short',
                                        day: 'numeric',
                                    })}{' '}
                                    –{' '}
                                    {new Date(searchResults.search.check_out_date).toLocaleDateString('en-US', {
                                        weekday: 'short',
                                        month: 'short',
                                        day: 'numeric',
                                    })}
                                    <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
                                    {searchResults.pagination.total_count} result
                                    {searchResults.pagination.total_count !== 1 ? 's' : ''}
                                </Typography>
                            </Stack>
                        </Stack>

                        <Stack spacing={2.5}>
                            {searchResults.hotels.map((h, i) => (
                                <React.Fragment key={h.id}>
                                    <ResultItem hotel={h} />
                                    {i < searchResults.hotels.length - 1 && <Divider sx={{ opacity: 0.6 }} />}
                                </React.Fragment>
                            ))}
                        </Stack>

                        {searchResults.pagination.total_pages > 1 && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                                <Pagination
                                    count={searchResults.pagination.total_pages}
                                    page={searchResults.pagination.current_page}
                                    onChange={handlePageChange}
                                    color="primary"
                                    size="large"
                                    sx={{ '& .MuiPaginationItem-root': { borderRadius: 2 } }}
                                />
                            </Box>
                        )}
                    </Box>
                )}

                {!loading && !searchResults && (
                    <Paper
                        variant="outlined"
                        sx={{
                            mt: 3,
                            p: 3,
                            borderRadius: 3,
                            textAlign: 'center',
                            borderStyle: 'dashed',
                        }}
                    >
                        <Typography variant="body1" color="text.secondary">
                            Enter a destination and dates to see results.
                        </Typography>
                    </Paper>
                )}
            </Container>
        </Box>
    );
}

export default SearchPage;
