const db = require('../db');
const notificationService = require('../services/notification.service');

// 1. Get All Movies
exports.getMovies = async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT movie_id, title, description, duration_mins, image_url, genre FROM movies'
    );
    res.json(rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// 2. Get Showtimes for a Movie
// // 2. Get Showtimes for a Movie
exports.getShowtimes = async (req, res) => {
  try {
    const { movieId } = req.params;
    const { rows } = await db.query(
      `SELECT 
         st.showtime_id,
         st.start_time,
         s.screen_number,
         c.name AS cinema_name,
         c.location,
         st.price_classic,
         st.price_prime,
         st.price_recliner,
         st.price_premium
       FROM showtimes st
       JOIN screens s ON st.screen_id = s.screen_id
       JOIN cinemas c ON s.cinema_id = c.cinema_id
       WHERE st.movie_id = $1
         AND st.start_time > NOW()
       ORDER BY st.start_time`,
      [movieId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// 3. Get Seats
exports.getSeatsForShowtime = async (req, res) => {
  try {
    const { showtimeId } = req.params;
    const showtime = await db.query('SELECT screen_id FROM showtimes WHERE showtime_id = $1', [showtimeId]);
    if (showtime.rows.length === 0) return res.status(404).json({ message: 'Showtime not found.' });
    const { screen_id } = showtime.rows[0];

    const { rows } = await db.query(
      `SELECT s.seat_id, s.seat_row, s.seat_number,
         CASE WHEN t.ticket_id IS NOT NULL THEN 'booked' ELSE 'available' END AS status
       FROM seats s
       LEFT JOIN tickets t ON s.seat_id = t.seat_id AND t.showtime_id = $1
       WHERE s.screen_id = $2
       ORDER BY s.seat_row, s.seat_number`,
      [showtimeId, screen_id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// 4. Book Tickets (FIXED: Robust Payment Details)
exports.bookTickets = async (req, res) => {
  const client = await db.pool.connect(); 
  try {
    const { showtimeId, seatIds, totalAmount, paymentDetails } = req.body;
    const userId = req.user.id;

    if (!showtimeId || !seatIds || seatIds.length === 0) return res.status(400).json({ message: 'Missing data.' });

    await client.query('BEGIN');
    
    const cardMask = paymentDetails ? `**** **** **** ${paymentDetails.cardNumber.slice(-4)}` : 'CASH';
    const cardHolder = paymentDetails ? paymentDetails.name : 'Unknown';

    const bookingQuery = `INSERT INTO bookings (user_id, showtime_id, total_amount, card_holder, card_number_mask) VALUES ($1, $2, $3, $4, $5) RETURNING booking_id, transaction_id`;
    const bookingRes = await client.query(bookingQuery, [userId, showtimeId, totalAmount || 0, cardHolder, cardMask]);
    const newBookingId = bookingRes.rows[0].booking_id;

    const ticketValues = [];
    const queryParams = [newBookingId, showtimeId];
    seatIds.forEach((seatId) => {
      let placeholderIndex = queryParams.length + 1;
      ticketValues.push(`($1, $2, $${placeholderIndex})`);
      queryParams.push(seatId);
    });

    const ticketsQuery = `INSERT INTO tickets (booking_id, showtime_id, seat_id) VALUES ${ticketValues.join(', ')}`;
    await client.query(ticketsQuery, queryParams);

    const detailsQuery = `SELECT m.title, st.start_time, u.user_email, u.mobile_number, u.user_name 
                          FROM showtimes st 
                          JOIN movies m ON st.movie_id = m.movie_id 
                          JOIN users u ON u.user_id = $1 
                          WHERE st.showtime_id = $2`;
    const detailsRes = await client.query(detailsQuery, [userId, showtimeId]);
    const details = detailsRes.rows[0];

    // --- NEW: Create Admin Notification on booking ---
    await client.query(
      "INSERT INTO notifications (message, type) VALUES ($1, 'booking')", 
      [`New booking: ${details.title} (${seatIds.length} tickets) by ${details.user_name}`]
    );

    await client.query('COMMIT');

    const bookingDetails = { id: newBookingId, movie: details.title, time: details.start_time, seats: seatIds.length };
    notificationService.sendBookingConfirmation(details.user_email, details.mobile_number, bookingDetails);

    res.json({ message: 'Booking successful!', booking_id: newBookingId });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).send('Server Error');
  } finally {
    client.release();
  }
};

// 5. Get User Bookings
exports.getUserBookings = async (req, res) => {
  try {
    const userId = req.user.id;
    const query = `
      SELECT 
        b.booking_id, b.booking_time, b.total_amount,
        b.transaction_id, b.card_number_mask,
        m.title, m.image_url, m.duration_mins,
        c.name AS cinema_name, c.location, st.start_time, scr.screen_number,
        STRING_AGG(s.seat_row || s.seat_number, ', ') AS seat_numbers,
        COUNT(t.ticket_id) AS total_tickets
      FROM bookings b
      JOIN showtimes st ON b.showtime_id = st.showtime_id
      JOIN movies m ON st.movie_id = m.movie_id
      JOIN screens scr ON st.screen_id = scr.screen_id
      JOIN cinemas c ON scr.cinema_id = c.cinema_id
      JOIN tickets t ON b.booking_id = t.booking_id
      JOIN seats s ON t.seat_id = s.seat_id
      WHERE b.user_id = $1
      GROUP BY b.booking_id, m.movie_id, c.cinema_id, st.showtime_id, scr.screen_id
      ORDER BY b.booking_time DESC
    `;
    const { rows } = await db.query(query, [userId]);
    res.json(rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// 6. Cancel Booking (UPDATED: also creates admin notification)
exports.cancelBooking = async (req, res) => {
  const client = await db.pool.connect();
  try {
    const { bookingId } = req.params;
    const userId = req.user.id;

    await client.query('BEGIN');

    // Get booking + user + movie details (and seat count) first
    const infoRes = await client.query(
      `
      SELECT 
        b.booking_id,
        b.total_amount,
        u.user_name,
        u.user_email,
        m.title,
        COUNT(t.ticket_id) AS total_tickets
      FROM bookings b
      JOIN users u ON b.user_id = u.user_id
      JOIN showtimes st ON b.showtime_id = st.showtime_id
      JOIN movies m ON st.movie_id = m.movie_id
      LEFT JOIN tickets t ON b.booking_id = t.booking_id
      WHERE b.booking_id = $1 AND b.user_id = $2
      GROUP BY b.booking_id, b.total_amount, u.user_name, u.user_email, m.title
      `,
      [bookingId, userId]
    );

    if (infoRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Booking not found or access denied.' });
    }

    const bookingInfo = infoRes.rows[0];

    // Delete tickets & booking
    await client.query('DELETE FROM tickets WHERE booking_id = $1', [bookingId]);
    await client.query('DELETE FROM bookings WHERE booking_id = $1', [bookingId]);

    // Create admin notification about cancellation
    const notifMessage = `Booking cancelled: ${bookingInfo.user_name} cancelled booking for "${bookingInfo.title}" (ID: ${bookingInfo.booking_id}, ${bookingInfo.total_tickets} tickets, ₹${bookingInfo.total_amount})`;

    await client.query(
      "INSERT INTO notifications (message, type) VALUES ($1, 'booking')",
      [notifMessage]
    );

    await client.query('COMMIT');
    res.json({ message: 'Booking cancelled successfully.' });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err.message);
    res.status(500).send('Server Error');
  } finally {
    client.release();
  }
};
