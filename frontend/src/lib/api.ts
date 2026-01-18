import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor for adding auth token if needed
api.interceptors.request.use(
  (config) => {
    const user = localStorage.getItem('user')
    if (user) {
      const userData = JSON.parse(user)
      config.headers['X-User-Id'] = userData.id || userData.username
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// User API
export const userApi = {
  getUsers: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get('/users', { params }),
  
  getUser: (id: string) =>
    api.get(`/users/${id}`),
  
  createUser: (data: { username: string; displayName?: string }) =>
    api.post('/users', data),
  
  updateUser: (id: string, data: { username?: string; displayName?: string; avatarUrl?: string; isActive?: boolean }) =>
    api.put(`/users/${id}`, data),
  
  deleteUser: (id: string) =>
    api.delete(`/users/${id}`),
  
  getUserStats: (id: string) =>
    api.get(`/users/${id}/stats`),
}

// Movie API
export const movieApi = {
  getMovies: (params?: {
    page?: number
    limit?: number
    year?: number
    watchedYear?: number
    search?: string
    sortBy?: 'title' | 'year' | 'watchedYear' | 'createdAt'
    sortOrder?: 'asc' | 'desc'
  }) => api.get('/movies', { params }),
  
  getMovie: (id: string) =>
    api.get(`/movies/${id}`),
  
  createMovie: (data: {
    title: string
    year: number
    description?: string
    posterUrl?: string
    watchedYear: number
    addedBy: string
  }) => api.post('/movies', data),
  
  updateMovie: (id: string, data: {
    title?: string
    year?: number
    description?: string
    posterUrl?: string
    watchedYear?: number
  }) => api.put(`/movies/${id}`, data),
  
  deleteMovie: (id: string) =>
    api.delete(`/movies/${id}`),
  
  getMovieStats: () =>
    api.get('/movies/stats'),
}

// Ranking API
export const rankingApi = {
  getRankings: (params?: {
    page?: number
    limit?: number
    userId?: string
    movieId?: string
    rankingYear?: number
    year?: number
    watchedYear?: number
  }) => api.get('/rankings', { params }),
  
  getRanking: (id: string) =>
    api.get(`/rankings/${id}`),
  
  createRanking: (data: {
    userId: string
    movieId: string
    rating: number
    rankingYear: number
    description?: string
  }) => api.post('/rankings', data),
  
  updateRanking: (id: string, data: { rating?: number; rankingYear?: number; description?: string }) =>
    api.put(`/rankings/${id}`, data),
  
  deleteRanking: (id: string) =>
    api.delete(`/rankings/${id}`),
  
  getRankingsByYear: (year: number, params?: { page?: number; limit?: number }) =>
    api.get(`/rankings/year/${year}`, { params }),
  
  getYearlyStats: () =>
    api.get('/rankings/stats/years'),
  
  getUserMovieRanking: (userId: string, movieId: string, year?: number) => {
    const url = year
      ? `/rankings/user/${userId}/movie/${movieId}/year/${year}`
      : `/rankings/user/${userId}/movie/${movieId}`
    return api.get(url)
  },
}

// Health check
export const healthApi = {
  check: () => api.get('/health'),
}

// API info
export const apiInfo = {
  getInfo: () => api.get('/api'),
}

export default api