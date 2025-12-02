-- 1. Users Table
-- Stores user account information for login and registration.
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_name VARCHAR(255) NOT NULL,
    user_email VARCHAR(255) NOT NULL UNIQUE,
    user_password VARCHAR(255) NOT NULL
);

-- 2. Cinemas Table
-- Stores the physical cinema locations.
CREATE TABLE cinemas (
    cinema_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location TEXT
);

-- 3. Screens Table
-- Stores the individual screens/halls within each cinema.
-- It references 'cinemas' to know which cinema it belongs to.
CREATE TABLE screens (
    screen_id SERIAL PRIMARY KEY,
    cinema_id INT NOT NULL REFERENCES cinemas(cinema_id),
    screen_number INT NOT NULL,
    capacity INT NOT NULL
);

-- 4. Movies Table
-- Stores all the movie details.
CREATE TABLE movies (
    movie_id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    duration_mins INT
);

-- 5. Seats Table
-- Stores the layout of seats for a specific screen.
-- It references 'screens' to know which screen it belongs to.
CREATE TABLE seats (
    seat_id SERIAL PRIMARY KEY,
    screen_id INT NOT NULL REFERENCES screens(screen_id),
    seat_row VARCHAR(10) NOT NULL,
    seat_number INT NOT NULL,
    -- A seat is unique to its screen (e.g., Screen 1, Row A, Seat 5)
    UNIQUE(screen_id, seat_row, seat_number)
);

-- 6. Showtimes Table
-- This is a key "junction" table.
-- It connects a Movie to a Screen at a specific time.
CREATE TABLE showtimes (
    showtime_id SERIAL PRIMARY KEY,
    movie_id INT NOT NULL REFERENCES movies(movie_id),
    screen_id INT NOT NULL REFERENCES screens(screen_id),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL
);

-- 7. Bookings Table
-- Stores the main booking record, made by a specific user for a specific show.
CREATE TABLE bookings (
    booking_id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(user_id),
    showtime_id INT NOT NULL REFERENCES showtimes(showtime_id),
    booking_time TIMESTAMP DEFAULT NOW()
);

-- 8. Tickets Table
-- This is the most important table for booking logic.
-- It connects a Booking to a specific Seat for a specific Showtime.
CREATE TABLE tickets (
    ticket_id SERIAL PRIMARY KEY,
    booking_id INT NOT NULL REFERENCES bookings(booking_id),
    seat_id INT NOT NULL REFERENCES seats(seat_id),
    showtime_id INT NOT NULL REFERENCES showtimes(showtime_id),

    -- *** THE GOLDEN CONSTRAINT ***
    -- This 'UNIQUE' constraint is the most important part of the project.
    -- It makes it IMPOSSIBLE for the database to sell the
    -- same seat (seat_id) for the same show (showtime_id) twice.
    UNIQUE(seat_id, showtime_id)
);