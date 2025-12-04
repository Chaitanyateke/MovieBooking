const db = require('../db');

// Helper: Auto create seating layout (A–J, 10 seats each) for a given screen
async function generateSeats(client, screen_id) {
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

  for (const row of rows) {
    for (let num = 1; num <= 10; num++) {
      await client.query(
        'INSERT INTO seats (screen_id, seat_row, seat_number) VALUES ($1, $2, $3)',
        [screen_id, row, num]
      );
    }
  }
}

/* ================================================================
   1. GET ALL USERS
================================================================ */
exports.getAllUsers = async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT user_id, user_name, user_email, mobile_number, role, avatar_url FROM users ORDER BY role, user_name'
    );
    res.json(rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

/* ================================================================
   2. ADD MOVIE
================================================================ */
exports.addMovie = async (req, res) => {
  try {
    const { title, description, duration_mins, genre, image_url } = req.body;

    const movie = await db.query(
      `INSERT INTO movies (title, description, duration_mins, genre, image_url)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [title, description, duration_mins, genre, image_url]
    );

    res.json(movie.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

/* ================================================================
   3. DELETE MOVIE
================================================================ */
exports.deleteMovie = async (req, res) => {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const { id } = req.params;

    await client.query(
      `DELETE FROM tickets WHERE showtime_id IN (SELECT showtime_id FROM showtimes WHERE movie_id = $1)`,
      [id]
    );
    await client.query(
      `DELETE FROM bookings WHERE showtime_id IN (SELECT showtime_id FROM showtimes WHERE movie_id = $1)`,
      [id]
    );
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

/* ================================================================
   4. GET ALL SHOWTIMES
================================================================ */
exports.getAllShowtimes = async (req, res) => {
  try {
    const query = `
      SELECT 
        st.showtime_id, st.start_time, m.title, s.screen_number,
        c.name AS theater_name, c.location,
        st.price_classic, st.price_prime, 
        st.price_recliner, st.price_premium
      FROM showtimes st
      JOIN movies m ON st.movie_id = m.movie_id
      JOIN screens s ON st.screen_id = s.screen_id
      JOIN cinemas c ON s.cinema_id = c.cinema_id
      ORDER BY st.start_time DESC`;

    const { rows } = await db.query(query);
    res.json(rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

/* ================================================================
   5. ADD SHOWTIME (AUTO CREATE CINEMA/SCREEN + SEATS)
================================================================ */
exports.addShowtime = async (req, res) => {
  const client = await db.pool.connect();

  try {
    const {
      movie_id,
      date,
      time,
      screen_number,
      theater_name,
      location,
      price_classic,
      price_prime,
      price_recliner,
      price_premium,
    } = req.body;

    if (
      !movie_id ||
      !date ||
      !time ||
      !screen_number ||
      !theater_name ||
      !location
    ) {
      return res
        .status(400)
        .json({ message: 'All fields are required for showtime.' });
    }

    // Build IST date-time and convert to UTC ISO for DB (so UI shows correct IST later)
    const istDate = new Date(`${date}T${time}:00+05:30`);
    const now = new Date();

    if (istDate <= now) {
      return res
        .status(400)
        .json({ message: 'Showtime must be in the future.' });
    }

    const timestamp = istDate.toISOString(); // DB column type: timestamptz

    await client.query('BEGIN');

    // 1️⃣ Find or create cinema
    let cinema = await client.query(
      'SELECT cinema_id FROM cinemas WHERE name = $1 AND location = $2',
      [theater_name, location]
    );

    let cinema_id;
    if (cinema.rows.length) {
      cinema_id = cinema.rows[0].cinema_id;
    } else {
      const newCinema = await client.query(
        'INSERT INTO cinemas (name, location) VALUES ($1, $2) RETURNING cinema_id',
        [theater_name, location]
      );
      cinema_id = newCinema.rows[0].cinema_id;
    }

    // 2️⃣ Find or create screen (screen_number can be ANY integer like 1, 41, etc.)
    let screen = await client.query(
      'SELECT screen_id FROM screens WHERE cinema_id = $1 AND screen_number = $2',
      [cinema_id, screen_number]
    );

    let screen_id;
    if (screen.rows.length) {
      screen_id = screen.rows[0].screen_id;
    } else {
      const newScreen = await client.query(
        'INSERT INTO screens (cinema_id, screen_number) VALUES ($1, $2) RETURNING screen_id',
        [cinema_id, screen_number]
      );
      screen_id = newScreen.rows[0].screen_id;

      // Auto-generate seats just ONCE for this new screen
      await generateSeats(client, screen_id);
    }

    // 3️⃣ Insert showtime with admin prices (fallback defaults)
    await client.query(
      `INSERT INTO showtimes 
       (movie_id, screen_id, start_time, 
        price_classic, price_prime, price_recliner, price_premium)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        movie_id,
        screen_id,
        timestamp,
        price_classic || 200,
        price_prime || 350,
        price_recliner || 550,
        price_premium || 870,
      ]
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

/* ================================================================
   6. DELETE SHOWTIME
================================================================ */
exports.deleteShowtime = async (req, res) => {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM tickets WHERE showtime_id = $1', [
      req.params.id,
    ]);
    await client.query('DELETE FROM bookings WHERE showtime_id = $1', [
      req.params.id,
    ]);
    await client.query('DELETE FROM showtimes WHERE showtime_id = $1', [
      req.params.id,
    ]);
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

/* ================================================================
   7. GET USER DETAILS (Bookings Included)
================================================================ */
exports.getUserDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await db.query(
      `SELECT user_id, user_name, user_email, mobile_number, role, avatar_url
       FROM users WHERE user_id = $1`,
      [id]
    );

    if (!user.rows.length)
      return res.status(404).json({ message: 'User not found' });

    const bookings = await db.query(
      `
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
      ORDER BY b.booking_time DESC`,
      [id]
    );

    res.json({ user: user.rows[0], bookings: bookings.rows });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

/* ================================================================
   8. DELETE BOOKING
================================================================ */
exports.deleteBooking = async (req, res) => {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM tickets WHERE booking_id = $1', [
      req.params.id,
    ]);
    await client.query('DELETE FROM bookings WHERE booking_id = $1', [
      req.params.id,
    ]);
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

/* ================================================================
   9. DELETE USER
================================================================ */
exports.deleteUser = async (req, res) => {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `DELETE FROM tickets WHERE booking_id IN (SELECT booking_id FROM bookings WHERE user_id = $1)`,
      [req.params.id]
    );
    await client.query('DELETE FROM bookings WHERE user_id = $1', [
      req.params.id,
    ]);
    await client.query('DELETE FROM users WHERE user_id = $1', [req.params.id]);
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

/* ================================================================
   🔟 PAYMENT MANAGEMENT
================================================================ */
exports.getAllPayments = async (req, res) => {
  try {
    const data = await db.query(
      `
      SELECT 
        b.transaction_id, b.booking_time, b.total_amount,
        b.card_holder, b.card_number_mask,
        u.user_name, u.user_email,
        m.title AS movie_title
      FROM bookings b
      JOIN users u ON b.user_id = u.user_id
      JOIN showtimes st ON b.showtime_id = st.showtime_id
      JOIN movies m ON st.movie_id = m.movie_id
      ORDER BY b.booking_time DESC`
    );

    const totalRevenue = data.rows.reduce(
      (sum, r) => sum + Number(r.total_amount || 0),
      0
    );

    res.json({ transactions: data.rows, totalRevenue });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

/* ================================================================
   🔔 NOTIFICATIONS
================================================================ */
exports.getNotifications = async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50'
    );
    const unreadCount = rows.filter((n) => !n.is_read).length;

    res.json({
      notifications: rows,
      unreadCount,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.markNotificationsRead = async (req, res) => {
  try {
    await db.query('UPDATE notifications SET is_read = TRUE WHERE is_read = FALSE');
    res.json({ message: 'Notifications marked as read' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};
