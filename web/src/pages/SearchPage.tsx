import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import {
  Search as SearchIcon,
  LocationOn as LocationIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { ApiService } from '../services/api';
import type { Hotel, SearchResponse } from '../services/api';

const SearchPage = () => {
  const [location, setLocation] = useState('');
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('price');
  const [sortOrder, setSortOrder] = useState('asc');
  const navigate = useNavigate();

  const handleSearch = async (page = 1) => {
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
  };

  const handlePageChange = (_event: React.ChangeEvent<unknown>, page: number) => {
    handleSearch(page);
  };

  const handleSortChange = () => {
    if (searchResults) {
      handleSearch(currentPage);
    }
  };

  useEffect(() => {
    handleSortChange();
  }, [sortBy, sortOrder]);

  const HotelCard = ({ hotel }: { hotel: Hotel }) => (
    <Box key={hotel.id} sx={{ flex: '1 1 300px', minWidth: 300, maxWidth: 400 }}>
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          cursor: 'pointer',
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            transform: 'translateY(-8px)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
          },
        }}
        onClick={() => navigate(`/hotel/${hotel.id}`)}
      >
        <Box
          sx={{
            height: 200,
            background: `linear-gradient(135deg, 
              ${hotel.rating >= 4.5 ? '#4caf50' : hotel.rating >= 4 ? '#ff9800' : '#2196f3'}20 0%, 
              ${hotel.rating >= 4.5 ? '#4caf50' : hotel.rating >= 4 ? '#ff9800' : '#2196f3'}40 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Typography
            variant="h3"
            sx={{
              color: 'white',
              fontWeight: 300,
              textShadow: '0 2px 10px rgba(0,0,0,0.3)',
            }}
          >
            {hotel.title.charAt(0).toUpperCase()}
          </Typography>
          <Box
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              alignItems: 'flex-end',
            }}
          >
            <Box
              sx={{
                backgroundColor: 'rgba(255,255,255,0.9)',
                borderRadius: 2,
                px: 1,
                py: 0.5,
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
              }}
            >
              <StarIcon sx={{ color: '#ffd700', fontSize: 16 }} />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {hotel.rating.toFixed(1)}
              </Typography>
            </Box>
            {hotel.best_price && (
              <Box
                sx={{
                  backgroundColor: 'rgba(46, 125, 50, 0.9)',
                  color: 'white',
                  borderRadius: 2,
                  px: 1,
                  py: 0.5,
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  €{hotel.best_price.toFixed(0)}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
        <CardContent sx={{ flexGrow: 1, p: 3 }}>
          <Typography
            variant="h6"
            component="h3"
            gutterBottom
            sx={{
              fontWeight: 500,
              mb: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {hotel.title}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <LocationIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 18 }} />
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
          </Box>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {hotel.description || 'Discover this amazing hotel with great amenities and service.'}
          </Typography>
          
          {hotel.best_price && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" color="success.main" sx={{ fontWeight: 600 }}>
                From €{hotel.best_price.toFixed(0)} per night
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {hotel.available_rooms} room{hotel.available_rooms !== 1 ? 's' : ''} • {hotel.total_offers} offer{hotel.total_offers !== 1 ? 's' : ''}
              </Typography>
            </Box>
          )}
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip
              label={hotel.source}
              size="small"
              sx={{
                backgroundColor: 'primary.main',
                color: 'white',
                fontWeight: 500,
              }}
            />
            {hotel.best_price && (
              <Chip
                label="Available"
                size="small"
                sx={{
                  backgroundColor: 'success.main',
                  color: 'white',
                  fontWeight: 500,
                }}
              />
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Hero Section */}
      <Box
        sx={{
          textAlign: 'center',
          mb: 6,
          py: 8,
          background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.1) 0%, rgba(255, 64, 129, 0.1) 100%)',
          borderRadius: 4,
        }}
      >
        <Typography
          variant="h1"
          component="h1"
          gutterBottom
          sx={{
            background: 'linear-gradient(45deg, #2196f3 30%, #ff4081 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            mb: 2,
          }}
        >
          Find Your Perfect Hotel
        </Typography>
        <Typography
          variant="h6"
          color="text.secondary"
          sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}
        >
          Compare prices and amenities from multiple sources to find the best deals
        </Typography>

        {/* Search Form */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            maxWidth: 800,
            mx: 'auto',
            borderRadius: 3,
            backgroundColor: 'white',
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Enter destination (e.g., Berlin, Paris, New York)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              InputProps={{
                startAdornment: <LocationIcon sx={{ color: 'text.secondary', mr: 1 }} />,
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
              }}
            />
            
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <TextField
                type="date"
                label="Check-in"
                value={checkInDate}
                onChange={(e) => setCheckInDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ flex: 1 }}
                inputProps={{
                  min: new Date().toISOString().split('T')[0],
                }}
              />
              <TextField
                type="date"
                label="Check-out"
                value={checkOutDate}
                onChange={(e) => setCheckOutDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ flex: 1 }}
                inputProps={{
                  min: checkInDate || new Date().toISOString().split('T')[0],
                }}
              />
              <Button
                variant="contained"
                size="large"
                onClick={() => handleSearch()}
                disabled={loading}
                sx={{
                  minWidth: 120,
                  borderRadius: 2,
                  background: 'linear-gradient(45deg, #2196f3 30%, #ff4081 90%)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #1976d2 30%, #c60055 90%)',
                  },
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : <SearchIcon />}
              </Button>
            </Box>
          </Box>

          {/* Sort Controls */}
          {searchResults && (
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Sort by</InputLabel>
                <Select
                  value={sortBy}
                  label="Sort by"
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <MenuItem value="best_price">Price</MenuItem>
                  <MenuItem value="rating">Rating</MenuItem>
                  <MenuItem value="title">Name</MenuItem>
                  <MenuItem value="available_rooms">Availability</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 100 }}>
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
            </Box>
          )}
        </Paper>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 4, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* Search Results */}
      {searchResults && (
        <Box>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" component="h2" sx={{ fontWeight: 300, mb: 1 }}>
              Hotels in {searchResults.search.location}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
              {new Date(searchResults.search.check_in_date).toLocaleDateString('en-US', { 
                weekday: 'short', month: 'short', day: 'numeric' 
              })} - {new Date(searchResults.search.check_out_date).toLocaleDateString('en-US', { 
                weekday: 'short', month: 'short', day: 'numeric' 
              })}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {searchResults.pagination.total_count} hotel{searchResults.pagination.total_count !== 1 ? 's' : ''} available
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 3,
              mb: 4,
              justifyContent: 'center',
            }}
          >
            {searchResults.hotels.map((hotel) => (
              <HotelCard key={hotel.id} hotel={hotel} />
            ))}
          </Box>

          {/* Pagination */}
          {searchResults.pagination.total_pages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
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
};

export default SearchPage;
