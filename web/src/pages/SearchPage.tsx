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
    Grid,
    Stack,
    InputAdornment,
} from '@mui/material';
import {
    Search as SearchIcon,
    LocationOn as LocationIcon,
    Star as StarIcon,
    ArrowForward as ArrowForwardIcon,
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
    const [sortOrder, setSortOrder] = useState('asc');

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
                setError('Failed to search hotels. Please try again.');
                console.error('Search error:', err);
            } finally {
                setLoading(false);
            }
        },
        [location, checkInDate, checkOutDate, sortBy, sortOrder]
    );

    const handlePageChange = (_e: React.ChangeEvent<unknown>, page: number) => {
        handleSearch(page);
    };

    useEffect(() => {
        if (searchResults) handleSearch(currentPage);
    }, [sortBy, sortOrder]);

    function HotelCard({ hotel }: { hotel: Hotel }) {
        const accent =
            hotel.rating >= 4.5 ? theme.palette.success.main : hotel.rating >= 4 ? theme.palette.warning.main : theme.palette.primary.main;

        return (
            <Card
                onClick={() => navigate(`/hotel/${hotel.id}`)}
                sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 3,
                    border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                    background: `linear-gradient(180deg, ${alpha(theme.palette.background.paper, 1)} 0%, ${alpha(
                        theme.palette.background.paper,
                        0.9
                    )} 100%)`,
                    boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
                    cursor: 'pointer',
                    transition: 'transform .25s ease, box-shadow .25s ease, border-color .25s ease',
                    '&:hover': {
                        transform: 'translateY(-6px)',
                        boxShadow: '0 18px 50px rgba(0,0,0,0.12)',
                        borderColor: alpha(accent, 0.4),
                    },
                }}
            >
                <Box
                    sx={{
                        position: 'relative',
                        height: 180,
                        overflow: 'hidden',
                        borderTopLeftRadius: 12,
                        borderTopRightRadius: 12,
                        background: `radial-gradient(1200px 300px at 20% -10%, ${alpha(accent, 0.25)} 0%, transparent 60%),
                         radial-gradient(1000px 300px at 90% 0%, ${alpha(accent, 0.35)} 0%, transparent 70%),
                         linear-gradient(135deg, ${alpha(accent, 0.28)}, ${alpha(theme.palette.primary.light, 0.18)})`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Typography
                        variant="h3"
                        sx={{
                            color: 'common.white',
                            fontWeight: 300,
                            letterSpacing: 2,
                            textShadow: '0 10px 30px rgba(0,0,0,.35)',
                            userSelect: 'none',
                        }}
                    >
                        {hotel.title?.charAt(0)?.toUpperCase() || 'H'}
                    </Typography>

                    <Stack
                        spacing={1}
                        sx={{ position: 'absolute', top: 12, right: 12, alignItems: 'flex-end' }}
                    >
                        <Box
                            sx={{
                                px: 1,
                                py: 0.5,
                                borderRadius: 2,
                                bgcolor: alpha('#fff', 0.9),
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 0.5,
                                boxShadow: '0 6px 18px rgba(0,0,0,0.12)',
                            }}
                        >
                            <StarIcon sx={{ fontSize: 16, color: '#ffd700' }} />
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                {hotel.rating.toFixed(1)}
                            </Typography>
                        </Box>
                        {hotel.best_price && (
                            <Box
                                sx={{
                                    px: 1,
                                    py: 0.5,
                                    borderRadius: 2,
                                    bgcolor: alpha(accent, 0.95),
                                    color: 'common.white',
                                    boxShadow: '0 8px 22px rgba(0,0,0,0.18)',
                                }}
                            >
                                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                    €{hotel.best_price.toFixed(0)}
                                </Typography>
                            </Box>
                        )}
                    </Stack>
                </Box>

                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                    <Stack spacing={1.5}>
                        <Typography
                            variant="h6"
                            sx={{
                                fontWeight: 600,
                                letterSpacing: 0.2,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {hotel.title}
                        </Typography>

                        <Stack direction="row" spacing={1} alignItems="center">
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
                            {hotel.description || 'Discover this amazing hotel with great amenities and service.'}
                        </Typography>

                        {hotel.best_price && (
                            <Box>
                                <Typography variant="h6" sx={{ fontWeight: 700, color: 'success.main' }}>
                                    From €{hotel.best_price.toFixed(0)} per night
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {hotel.available_rooms} room{hotel.available_rooms !== 1 ? 's' : ''} • {hotel.total_offers} offer{hotel.total_offers !== 1 ? 's' : ''}
                                </Typography>
                            </Box>
                        )}

                        <Stack direction="row" spacing={1} alignItems="center">
                            <Chip
                                label={hotel.source}
                                size="small"
                                sx={{
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
                            <Box sx={{ flexGrow: 1 }} />
                            <ArrowForwardIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                        </Stack>
                    </Stack>
                </CardContent>
            </Card>
        );
    }

    return (
        <Container maxWidth="xl" sx={{ py: { xs: 3, md: 6 } }}>
            <Box
                sx={{
                    position: 'relative',
                    mb: { xs: 4, md: 8 },
                    borderRadius: 4,
                    overflow: 'hidden',
                    p: { xs: 3, md: 6 },
                    background: `linear-gradient(140deg, ${alpha(theme.palette.primary.main, 0.12)} 0%, ${alpha(
                        theme.palette.secondary.main,
                        0.12
                    )} 100%)`,
                    backdropFilter: 'blur(4px)',
                    border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                }}
            >
                <Stack spacing={2} alignItems="center" sx={{ textAlign: 'center' }}>
                    <Typography
                        variant="h2"
                        sx={{
                            fontWeight: 800,
                            letterSpacing: 0.3,
                            background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}
                    >
                        Find Your Perfect Hotel
                    </Typography>
                    <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 760 }}>
                        Compare prices and amenities from multiple sources to find the best deals
                    </Typography>
                </Stack>

                <Paper
                    elevation={0}
                    sx={{
                        mt: { xs: 3, md: 5 },
                        p: { xs: 2, md: 3 },
                        borderRadius: 3,
                        mx: 'auto',
                        maxWidth: 980,
                        bgcolor: alpha(theme.palette.background.paper, 0.9),
                        border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                        boxShadow: '0 12px 40px rgba(0,0,0,0.08)',
                    }}
                >
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                        <TextField
                            fullWidth
                            variant="outlined"
                            placeholder="Destination"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <LocationIcon sx={{ color: 'text.secondary' }} />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{
                                '& .MuiOutlinedInput-root': { borderRadius: 2 },
                            }}
                        />
                        <TextField
                            type="date"
                            label="Check-in"
                            value={checkInDate}
                            onChange={(e) => setCheckInDate(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            sx={{ minWidth: { md: 220 } }}
                            inputProps={{ min: new Date().toISOString().split('T')[0] }}
                        />
                        <TextField
                            type="date"
                            label="Check-out"
                            value={checkOutDate}
                            onChange={(e) => setCheckOutDate(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            sx={{ minWidth: { md: 220 } }}
                            inputProps={{ min: checkInDate || new Date().toISOString().split('T')[0] }}
                        />
                        <Button
                            variant="contained"
                            size="large"
                            onClick={() => handleSearch()}
                            disabled={loading}
                            startIcon={!loading ? <SearchIcon /> : undefined}
                            sx={{
                                minWidth: 160,
                                borderRadius: 2,
                                fontWeight: 700,
                                letterSpacing: 0.2,
                                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                                '&:hover': { filter: 'brightness(0.95)' },
                            }}
                        >
                            {loading ? <CircularProgress size={22} color="inherit" /> : 'Search'}
                        </Button>
                    </Stack>

                    {searchResults && (
                        <Stack
                            direction="row"
                            spacing={2}
                            justifyContent="center"
                            sx={{ mt: 2, flexWrap: 'wrap' }}
                        >
                            <FormControl size="small" sx={{ minWidth: 160 }}>
                                <InputLabel>Sort by</InputLabel>
                                <Select value={sortBy} label="Sort by" onChange={(e) => setSortBy(e.target.value)}>
                                    <MenuItem value="best_price">Price</MenuItem>
                                    <MenuItem value="rating">Rating</MenuItem>
                                    <MenuItem value="title">Name</MenuItem>
                                    <MenuItem value="available_rooms">Availability</MenuItem>
                                </Select>
                            </FormControl>
                            <FormControl size="small" sx={{ minWidth: 160 }}>
                                <InputLabel>Order</InputLabel>
                                <Select
                                    value={sortOrder}
                                    label="Order"
                                    onChange={(e) => setSortOrder(e.target.value)}
                                >
                                    <MenuItem value="desc">High to Low</MenuItem>
                                    <MenuItem value="asc">Low to High</MenuItem>
                                </Select>
                            </FormControl>
                        </Stack>
                    )}
                </Paper>
            </Box>

            {error && (
                <Alert
                    severity="error"
                    sx={{
                        mb: 4,
                        borderRadius: 2,
                        border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`,
                    }}
                >
                    {error}
                </Alert>
            )}

            {searchResults && (
                <Box>
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="h4" sx={{ fontWeight: 700 }}>
                            Hotels in {searchResults.search.location}
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            {new Date(searchResults.search.check_in_date).toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                            })}{' '}
                            −{' '}
                            {new Date(searchResults.search.check_out_date).toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                            })}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {searchResults.pagination.total_count} hotel
                            {searchResults.pagination.total_count !== 1 ? 's' : ''} available
                        </Typography>
                    </Box>

                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        {searchResults.hotels.map((hotel) => (
                            <Grid key={hotel.id} item xs={12} sm={6} md={4}>
                                <HotelCard hotel={hotel} />
                            </Grid>
                        ))}
                    </Grid>

                    {searchResults.pagination.total_pages > 1 && (
                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                            <Pagination
                                count={searchResults.pagination.total_pages}
                                page={searchResults.pagination.current_page}
                                onChange={handlePageChange}
                                color="primary"
                                size="large"
                                sx={{
                                    '& .MuiPaginationItem-root': {
                                        borderRadius: 2,
                                    },
                                }}
                            />
                        </Box>
                    )}
                </Box>
            )}
        </Container>
    );
}

export default SearchPage;
