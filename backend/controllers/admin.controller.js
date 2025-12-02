const db = require('../db');

// 1. Get All Users
exports.getAllUsers = async (req, res) => {
  try {
    const { rows } = await db.query('SELECT user_id, user_name, user_email, mobile_number, role, avatar_url FROM users ORDER BY role, user_name');
    res.json(rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// 2. Add Movie
exports.addMovie = async (req, res) => {
  try {
    const { title, description, duration_mins, genre, image_url } = req.body;
    const newMovie = await db.query(
      'INSERT INTO movies (title, description, duration_mins, genre, image_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [title, description, duration_mins, genre, image_url]
    );
    res.json(newMovie.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// 3. Delete Movie
exports.deleteMovie = async (req, res) => {
  const client = await db.pool.connect();
  try {
    const { id } = req.params;
    await client.query('BEGIN');
    await client.query(`DELETE FROM tickets WHERE showtime_id IN (SELECT showtime_id FROM showtimes WHERE movie_id = $1)`, [id]);
    await client.query(`DELETE FROM bookings WHERE showtime_id IN (SELECT showtime_id FROM showtimes WHERE movie_id = $1)`, [id]);
    await client.query('DELETE FROM showtimes WHERE movie_id = $1', [id]);
    await client.query('DELETE FROM movies WHERE movie_id = $1', [id]);
    await client.query('COMMIT');
    res.json({ message: 'Movie deleted successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err.message);
    res.status(500).send('Server Error');
  } finally {
    client.release();
  }
};

// 4. Get All Showtimes
exports.getAllShowtimes = async (req, res) => {
  try {
    const query = `
      SELECT st.showtime_id, st.start_time, m.title, s.screen_number, c.name AS theater_name, c.location,
             st.price_classic, st.price_prime, st.price_recliner, st.price_premium
      FROM showtimes st
      JOIN movies m ON st.movie_id = m.movie_id
      JOIN screens s ON st.screen_id = s.screen_id
      JOIN cinemas c ON s.cinema_id = c.cinema_id
      ORDER BY st.start_time DESC
    `;
    const { rows } = await db.query(query);
    res.json(rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// 5. Add Showtime (With Cinema/Screen Check & Pricing)
exports.addShowtime = async (req, res) => {
  const client = await db.pool.connect();
  try {
    const { 
      movie_id, date, time, screen_number, theater_name, location,
      price_classic, price_prime, price_recliner, price_premium 
    } = req.body; 

    const timestamp = `${date}T${time}:00+05:30`; // Force IST

    await client.query('BEGIN');

    // 1. Find or Create Cinema
    let cinemaRes = await client.query('SELECT cinema_id FROM cinemas WHERE name = $1 AND location = $2', [theater_name, location]);
    let cinema_id;

    if (cinemaRes.rows.length > 0) {
      cinema_id = cinemaRes.rows[0].cinema_id;
    } else {
      const newCinema = await client.query(
        'INSERT INTO cinemas (name, location) VALUES ($1, $2) RETURNING cinema_id',
        [theater_name, location]
      );
      cinema_id = newCinema.rows[0].cinema_id;
    }

    // 2. Find or Create Screen
    let screenRes = await client.query(
      'SELECT screen_id FROM screens WHERE cinema_id = $1 AND screen_number = $2',
      [cinema_id, screen_number]
    );
    let screen_id;

    if (screenRes.rows.length > 0) {
      screen_id = screenRes.rows[0].screen_id;
    } else {
      const newScreen = await client.query(
        'INSERT INTO screens (cinema_id, screen_number, capacity) VALUES ($1, $2, 100) RETURNING screen_id',
        [cinema_id, screen_number]
      );
      screen_id = newScreen.rows[0].screen_id;

      // Auto-generate 100 seats
      const seatValues = [];
      for (let r = 0; r < 10; r++) {
          const rowChar = String.fromCharCode(65 + r); 
          for (let c = 1; c <= 10; c++) {
              seatValues.push(`(${screen_id}, '${rowChar}', ${c})`);
          }
      }
      await client.query(
        `INSERT INTO seats (screen_id, seat_row, seat_number) VALUES ${seatValues.join(',')}`
      );
    }

    // 3. Insert Showtime
    await client.query(
      `INSERT INTO showtimes 
       (movie_id, screen_id, start_time, price_classic, price_prime, price_recliner, price_premium) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [movie_id, screen_id, timestamp, price_classic || 200, price_prime || 350, price_recliner || 550, price_premium || 870]
    );

    await client.query('COMMIT');
    res.json({ message: 'Showtime added successfully!' });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err.message);
    res.status(500).send('Server Error');
  } finally {
    client.release();
  }
};

// 6. Delete Showtime
exports.deleteShowtime = async (req, res) => {
  const client = await db.pool.connect();
  try {
    const { id } = req.params;
    await client.query('BEGIN');
    await client.query('DELETE FROM tickets WHERE showtime_id = $1', [id]);
    await client.query('DELETE FROM bookings WHERE showtime_id = $1', [id]);
    await client.query('DELETE FROM showtimes WHERE showtime_id = $1', [id]);
    await client.query('COMMIT');
    res.json({ message: 'Showtime deleted successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err.message);
    res.status(500).send('Server Error');
  } finally {
    client.release();
  }
};

// 7. Get User Details
exports.getUserDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const userRes = await db.query('SELECT user_id, user_name, user_email, mobile_number, role, avatar_url FROM users WHERE user_id = $1', [id]);
    
    if (userRes.rows.length === 0) return res.status(404).json({ message: 'User not found' });

    const bookingsQuery = `
      SELECT 
        b.booking_id, b.booking_time, b.total_amount,
        m.title, m.image_url, st.start_time, c.name AS cinema_name, scr.screen_number,
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
    
    const bookingsRes = await db.query(bookingsQuery, [id]);
    res.json({ user: userRes.rows[0], bookings: bookingsRes.rows });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// 8. Delete Booking
exports.deleteBooking = async (req, res) => {
  const client = await db.pool.connect();
  try {
    const { id } = req.params; 
    await client.query('BEGIN');
    await client.query('DELETE FROM tickets WHERE booking_id = $1', [id]);
    await client.query('DELETE FROM bookings WHERE booking_id = $1', [id]);
    await client.query('COMMIT');
    res.json({ message: 'Booking deleted successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err.message);
    res.status(500).send('Server Error');
  } finally {
    client.release();
  }
};

// 9. Delete User
exports.deleteUser = async (req, res) => {
  const client = await db.pool.connect();
  try {
    const { id } = req.params;
    await client.query('BEGIN');
    await client.query(`DELETE FROM tickets WHERE booking_id IN (SELECT booking_id FROM bookings WHERE user_id = $1)`, [id]);
    await client.query('DELETE FROM bookings WHERE user_id = $1', [id]);
    await client.query('DELETE FROM users WHERE user_id = $1', [id]);
    await client.query('COMMIT');
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err.message);
    res.status(500).send('Server Error');
  } finally {
    client.release();
  }
};

// 10. Get All Payments
exports.getAllPayments = async (req, res) => {
  try {
    const query = `
      SELECT 
        b.transaction_id,
        b.booking_time,
        b.total_amount,
        b.card_holder,
        b.card_number_mask,
        u.user_name,
        u.user_email,
        m.title AS movie_title
      FROM bookings b
      JOIN users u ON b.user_id = u.user_id
      JOIN showtimes st ON b.showtime_id = st.showtime_id
      JOIN movies m ON st.movie_id = m.movie_id
      ORDER BY b.booking_time DESC
    `;
    const { rows } = await db.query(query);
    const totalRevenue = rows.reduce((sum, row) => sum + parseFloat(row.total_amount || 0), 0);
    res.json({ transactions: rows, totalRevenue });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// 11. Get Notifications
exports.getNotifications = async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50'
    );
    const unreadCount = rows.filter(n => !n.is_read).length;
    res.json({ notifications: rows, unreadCount });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// 12. Mark Notifications as Read
exports.markNotificationsRead = async (req, res) => {
  try {
    await db.query('UPDATE notifications SET is_read = TRUE WHERE is_read = FALSE');
    res.json({ message: 'Marked as read' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};