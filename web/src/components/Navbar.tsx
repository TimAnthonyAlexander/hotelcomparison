import { AppBar, Toolbar, Typography, Box } from '@mui/material';
import { Hotel as HotelIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
    const navigate = useNavigate();

    return (
        <AppBar
            position="sticky"
            sx={{
                backgroundColor: 'white',
                color: 'primary.main',
                boxShadow: '0 2px 20px rgba(0,0,0,0.08)',
                borderBottom: '1px solid rgba(0,0,0,0.06)'
            }}
        >
            <Toolbar
                sx={{
                    justifyContent: 'space-between',
                    minHeight: { xs: 56, md: 64 },
                    px: 2,
                }}>
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        cursor: 'pointer',
                        '&:hover': { opacity: 0.8 }
                    }}
                    onClick={() => navigate('/')}
                >
                    <HotelIcon sx={{ mr: 2, fontSize: 32 }} />
                    <Typography
                        variant="h4"
                        component="div"
                        sx={{
                            fontWeight: 300,
                            background: 'linear-gradient(45deg, #2196f3 30%, #ff4081 90%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text'
                        }}
                    >
                        HotelComparison
                    </Typography>
                </Box>
            </Toolbar>
        </AppBar >
    );
};

export default Navbar;
