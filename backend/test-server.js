const express = require('express')
const app = express()
const PORT = 5000

app.use(express.json())

// Simple test endpoints
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.get('/api/users', (req, res) => {
  res.json({
    data: [
      { id: '1', username: 'test_user', displayName: 'Test User', totalRankings: 5 },
      { id: '2', username: 'another_user', displayName: 'Another User', totalRankings: 3 },
    ],
    pagination: { page: 1, limit: 20, total: 2, pages: 1 }
  })
})

app.post('/api/users', (req, res) => {
  const { username, displayName } = req.body
  res.status(201).json({
    id: 'new-user-id',
    username,
    displayName: displayName || username,
    isActive: true,
    createdAt: new Date().toISOString()
  })
})

app.get('/api/movies', (req, res) => {
  res.json({
    data: [
      { 
        id: '1', 
        title: 'The Shawshank Redemption', 
        year: 1994, 
        watchedYear: 2024,
        averageRating: 9.2,
        totalRankings: 8
      },
    ],
    pagination: { page: 1, limit: 20, total: 1, pages: 1 }
  })
})

app.get('/api/rankings/year/2024', (req, res) => {
  res.json({
    year: 2024,
    stats: {
      totalRankings: 12,
      averageRating: 8.3,
      minRating: 7,
      maxRating: 10
    },
    data: [
      {
        id: '1',
        user: { id: '1', username: 'john_doe', displayName: 'John Doe' },
        movie: { id: '1', title: 'The Shawshank Redemption', year: 1994, watchedYear: 2024 },
        rating: 9,
        rankedAt: new Date().toISOString()
      }
    ],
    topMovies: [
      { id: '1', title: 'The Shawshank Redemption', year: 1994, watchedYear: 2024, averageRating: 9.2, totalRankings: 8 }
    ],
    activeUsers: [
      { id: '1', username: 'john_doe', displayName: 'John Doe', totalRankings: 5, averageRating: 8.5 }
    ]
  })
})

app.listen(PORT, () => {
  console.log(`🚀 Test server running on port ${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/health`)
})