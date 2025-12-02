import React from 'react';
import { Box } from '@mui/material';

// --- This array now has 27 posters ---
// (We repeat your 10 posters to get 27)
const backgroundImages = [
  '/images/poster1.jpg',
  '/images/poster2.jpg',
  '/images/poster3.jpg',
  '/images/poster4.jpg',
  '/images/poster5.jpg',
  '/images/poster6.jpg',
  '/images/poster7.jpg',
  '/images/poster8.jpg',
  '/images/poster9.jpg',
  '/images/poster10.jpg',
  '/images/poster11.jpg',
  '/images/poster12.jpg',
  '/images/poster13.jpg',
  '/images/poster14.jpg',
  '/images/poster15.jpg',
  '/images/poster16.jpg',
  '/images/poster17.jpg',
  '/images/poster18.jpg',
  '/images/poster19.jpg',
  '/images/poster20.jpg',
  '/images/poster21.jpg',
  '/images/poster22.jpg',
  '/images/poster23.jpg',
  '/images/poster24.jpg',
  '/images/poster25.jpg',
  '/images/poster26.jpg',
  '/images/poster27.jpg',
];

const MovieBackground = () => {
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: -1,
        overflow: 'hidden',
        display: 'grid',
        // --- THIS IS THE NEW 3x9 GRID ---
        gridTemplateColumns: 'repeat(9, 1fr)', // 9 equal columns
        gridTemplateRows: 'repeat(3, 1fr)', // 3 equal rows
        // --- END OF NEW GRID ---
        gap: '5px',
        transform: 'none', // Keep the tilted effect
        // transformOrigin: 'top left',
        opacity: 1,
      }}
    >
      {/* --- Dark Overlay --- */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          zIndex: 1,
          gridColumn: '1 / -1', // Make overlay span all columns
          gridRow: '1 / -1', // Make overlay span all rows
        }}
      />
      {/* --- Image Grid --- */}
      {backgroundImages.map((src, index) => (
        <Box
          key={index}
          component="img"
          src={src}
          alt={`Movie Poster ${index}`}
          sx={{
            // --- THIS FIXES THE IMAGE SIZES ---
            width: '100%',    // Fill 100% of the cell width
            height: '100%',   // Fill 100% of the cell height
            objectFit: 'cover', // Fill the space, cropping if needed (no stretching)
            display: 'block',
          }}
        />
      ))}
    </Box>
  );
};

export default MovieBackground;