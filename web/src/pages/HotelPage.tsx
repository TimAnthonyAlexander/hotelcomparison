import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
  Button,
  Paper,
  TextField,
  FormControlLabel,
  Switch,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  LocationOn as LocationIcon,
  Star as StarIcon,
  People as PeopleIcon,
  CalendarToday as CalendarIcon,
  ExpandMore as ExpandMoreIcon,
  Hotel as HotelIcon,
} from '@mui/icons-material';
import { ApiService } from '../services/api';
import type { HotelOffersResponse, RoomWithOffers } from '../services/api';

const HotelPage = () => {
  const { hotelId } = useParams<{ hotelId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hotelData, setHotelData] = useState<HotelOffersResponse | null>(null);
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [activeOnly, setActiveOnly] = useState(true);

  const fetchHotelData = async () => {
    if (!hotelId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await ApiService.getHotelOffers(hotelId, {
        check_in_date: checkInDate || undefined,
        check_out_date: checkOutDate || undefined,
        active_only: activeOnly,
      });
      
      setHotelData(response.data);
    } catch (err) {
      setError('Failed to load hotel data. Please try again.');
      console.error('Hotel data error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHotelData();
  }, [hotelId, checkInDate, checkOutDate, activeOnly]);

  const formatPrice = (price: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const RoomCard = ({ roomData }: { roomData: RoomWithOffers }) => (
    <Accordion
      sx={{
        mb: 2,
        borderRadius: 3,
        '&:before': { display: 'none' },
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{
          borderRadius: 3,
          '&.Mui-expanded': {
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
          },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', pr: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <HotelIcon sx={{ color: 'primary.main' }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 500 }}>
                {roomData.room.title}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <PeopleIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  Up to {roomData.room.capacity} guests
                </Typography>
                <Chip
                  label={roomData.room.type}
                  size="small"
                  sx={{ ml: 1, backgroundColor: 'secondary.light', color: 'white' }}
                />
              </Box>
            </Box>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="h6" color="primary.main" sx={{ fontWeight: 600 }}>
              {roomData.min_price ? formatPrice(roomData.min_price) : 'No offers'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {roomData.offer_count} offer{roomData.offer_count !== 1 ? 's' : ''}
            </Typography>
          </Box>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 0 }}>
        {roomData.offers.length > 0 ? (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {roomData.offers.map((offer) => (
              <Box key={offer.id} sx={{ flex: '1 1 300px', minWidth: 280, maxWidth: 350 }}>
                <Card
                  sx={{
                    height: '100%',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      borderColor: 'primary.main',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
                    },
                  }}
                >
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="h6" color="primary.main" sx={{ fontWeight: 600 }}>
                        {formatPrice(offer.price, offer.currency)}
                      </Typography>
                      <Chip
                        label={offer.source}
                        size="small"
                        sx={{
                          backgroundColor: offer.is_active ? 'success.light' : 'grey.300',
                          color: 'white',
                        }}
                      />
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(offer.check_in_date)} - {formatDate(offer.check_out_date)}
                      </Typography>
                    </Box>
                    
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                      Last seen: {new Date(offer.last_seen_at).toLocaleString()}
                    </Typography>
                    
                    {!offer.is_active && (
                      <Alert severity="warning" sx={{ mt: 1, py: 0 }}>
                        <Typography variant="caption">No longer available</Typography>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </Box>
            ))}
          </Box>
        ) : (
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            No offers available for this room with the current filters.
          </Alert>
        )}
      </AccordionDetails>
    </Accordion>
  );

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading hotel details...
        </Typography>
      </Container>
    );
  }

  if (error || !hotelData) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{ mb: 3 }}
        >
          Back to Search
        </Button>
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          {error || 'Hotel not found'}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Back Button */}
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(-1)}
        sx={{ mb: 3 }}
      >
        Back to Search
      </Button>

      {/* Hotel Header */}
      <Paper
        elevation={0}
        sx={{
          p: 4,
          mb: 4,
          borderRadius: 4,
          background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.1) 0%, rgba(255, 64, 129, 0.1) 100%)',
        }}
      >
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, alignItems: 'center' }}>
          <Box sx={{ flex: '1 1 400px' }}>
            <Typography
              variant="h3"
              component="h1"
              gutterBottom
              sx={{
                fontWeight: 300,
                background: 'linear-gradient(45deg, #2196f3 30%, #ff4081 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {hotelData.hotel.title}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <LocationIcon sx={{ color: 'text.secondary', mr: 1 }} />
              <Typography variant="body1" color="text.secondary">
                {hotelData.hotel.address}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <StarIcon sx={{ color: '#ffd700' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {hotelData.hotel.rating.toFixed(1)}
                </Typography>
              </Box>
              <Chip
                label={hotelData.hotel.source}
                sx={{
                  backgroundColor: 'primary.main',
                  color: 'white',
                  fontWeight: 500,
                }}
              />
            </Box>
          </Box>
          <Box sx={{ flex: '0 1 300px' }}>
            <Card sx={{ p: 2, textAlign: 'center', borderRadius: 3 }}>
              <Typography variant="h6" gutterBottom>
                Price Summary
              </Typography>
              <Typography
                variant="h4"
                color="primary.main"
                sx={{ fontWeight: 600, mb: 1 }}
              >
                {hotelData.summary.min_price 
                  ? `${formatPrice(hotelData.summary.min_price)} - ${formatPrice(hotelData.summary.max_price!)}`
                  : 'No offers'
                }
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {hotelData.summary.total_offers} offers • {hotelData.summary.total_rooms} rooms
              </Typography>
            </Card>
          </Box>
        </Box>
      </Paper>

      {/* Filters */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 4,
          borderRadius: 3,
          backgroundColor: 'background.paper',
          boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
        }}
      >
        <Typography variant="h6" gutterBottom>
          Filter Offers
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="center">
          <Box sx={{ flex: 1 }}>
            <TextField
              fullWidth
              type="date"
              label="Check-in Date"
              value={checkInDate}
              onChange={(e) => setCheckInDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
          <Box sx={{ flex: 1 }}>
            <TextField
              fullWidth
              type="date"
              label="Check-out Date"
              value={checkOutDate}
              onChange={(e) => setCheckOutDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={activeOnly}
                  onChange={(e) => setActiveOnly(e.target.checked)}
                />
              }
              label="Active offers only"
            />
          </Box>
        </Stack>
      </Paper>

      {/* Hotel Description */}
      {hotelData.hotel.description && (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 4,
            borderRadius: 3,
            backgroundColor: 'background.paper',
            boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
          }}
        >
          <Typography variant="h6" gutterBottom>
            About This Hotel
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {hotelData.hotel.description}
          </Typography>
        </Paper>
      )}

      {/* Rooms and Offers */}
      <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 400 }}>
        Rooms & Offers
      </Typography>
      
      {hotelData.rooms.length > 0 ? (
        hotelData.rooms.map((roomData) => (
          <RoomCard key={roomData.room.id} roomData={roomData} />
        ))
      ) : (
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          No rooms available with the current filters.
        </Alert>
      )}
    </Container>
  );
};

export default HotelPage;
