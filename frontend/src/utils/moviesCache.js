// src/utils/moviesCache.js
import eventService from '../api/events';

// Call this after any change in movies from Admin (add/edit/delete)
export const refreshMoviesCache = async () => {
  try {
    const response = await eventService.getMovies();
    const data = response.data || [];
    localStorage.setItem('moviesCache', JSON.stringify(data));
  } catch (err) {
    console.error('Failed to refresh movies cache', err);
  }
};
