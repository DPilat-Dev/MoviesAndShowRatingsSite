import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Clear existing data
  await prisma.ranking.deleteMany()
  await prisma.movie.deleteMany()
  await prisma.user.deleteMany()

  // Create users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        username: 'john_doe',
        displayName: 'John Doe',
      },
    }),
    prisma.user.create({
      data: {
        username: 'jane_smith',
        displayName: 'Jane Smith',
      },
    }),
    prisma.user.create({
      data: {
        username: 'bob_wilson',
        displayName: 'Bob Wilson',
      },
    }),
    prisma.user.create({
      data: {
        username: 'alice_jones',
        displayName: 'Alice Jones',
      },
    }),
  ])

  console.log(`✅ Created ${users.length} users`)

  // Create movies
  const movies = await Promise.all([
    prisma.movie.create({
      data: {
        title: 'The Shawshank Redemption',
        year: 1994,
        description: 'Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.',
        watchedYear: 2024,
        addedBy: 'john_doe',
      },
    }),
    prisma.movie.create({
      data: {
        title: 'The Godfather',
        year: 1972,
        description: 'The aging patriarch of an organized crime dynasty transfers control to his reluctant son.',
        watchedYear: 2024,
        addedBy: 'jane_smith',
      },
    }),
    prisma.movie.create({
      data: {
        title: 'The Dark Knight',
        year: 2008,
        description: 'When the menace known as the Joker wreaks havoc on Gotham City, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.',
        watchedYear: 2023,
        addedBy: 'bob_wilson',
      },
    }),
    prisma.movie.create({
      data: {
        title: 'Pulp Fiction',
        year: 1994,
        description: 'The lives of two mob hitmen, a boxer, a gangster and his wife intertwine in four tales of violence and redemption.',
        watchedYear: 2023,
        addedBy: 'alice_jones',
      },
    }),
    prisma.movie.create({
      data: {
        title: 'Forrest Gump',
        year: 1994,
        description: 'The presidencies of Kennedy and Johnson, the events of Vietnam, Watergate, and other historical events unfold through the perspective of an Alabama man with an IQ of 75.',
        watchedYear: 2024,
        addedBy: 'john_doe',
      },
    }),
  ])

  console.log(`✅ Created ${movies.length} movies`)

  // Create rankings for 2024
  const rankings2024 = []
  const currentYear = 2024

  for (const user of users) {
    for (const movie of movies.filter(m => m.watchedYear === currentYear)) {
      rankings2024.push(
        prisma.ranking.create({
          data: {
            userId: user.id,
            movieId: movie.id,
            rating: Math.floor(Math.random() * 4) + 7, // Random rating between 7-10
            rankingYear: currentYear,
          },
        })
      )
    }
  }

  await Promise.all(rankings2024)
  console.log(`✅ Created ${rankings2024.length} rankings for ${currentYear}`)

  // Create rankings for 2023 (for movies watched that year)
  const rankings2023 = []
  const previousYear = 2023

  for (const user of users) {
    for (const movie of movies.filter(m => m.watchedYear === previousYear)) {
      rankings2023.push(
        prisma.ranking.create({
          data: {
            userId: user.id,
            movieId: movie.id,
            rating: Math.floor(Math.random() * 4) + 6, // Random rating between 6-9
            rankingYear: previousYear,
          },
        })
      )
    }
  }

  await Promise.all(rankings2023)
  console.log(`✅ Created ${rankings2023.length} rankings for ${previousYear}`)

  console.log('🎉 Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })