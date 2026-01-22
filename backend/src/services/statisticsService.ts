import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface YearlyStats {
  year: number;
  movieCount: number;
  rankingCount: number;
  userCount: number;
  averageRating: number;
  topMovies: Array<{
    id: string;
    title: string;
    year: number;
    averageRating: number;
    rankingCount: number;
  }>;
  topUsers: Array<{
    id: string;
    username: string;
    displayName: string;
    rankingCount: number;
    averageRating: number;
  }>;
}

export interface OverallStats {
  totalMovies: number;
  totalUsers: number;
  totalRankings: number;
  averageRating: number;
  years: number[];
  yearlyStats: YearlyStats[];
  genreDistribution: Array<{ genre: string; count: number }>;
  ratingDistribution: Array<{ rating: number; count: number }>;
}

export interface UserStats {
  userId: string;
  username: string;
  displayName: string;
  totalRankings: number;
  averageRating: number;
  yearsActive: number[];
  topMovies: Array<{
    movieId: string;
    title: string;
    year: number;
    rating: number;
    rankingYear: number;
  }>;
  ratingDistribution: Array<{ rating: number; count: number }>;
}

export interface MovieStats {
  movieId: string;
  title: string;
  year: number;
  totalRankings: number;
  averageRating: number;
  ratingDistribution: Array<{ rating: number; count: number }>;
  yearlyStats: Array<{
    year: number;
    averageRating: number;
    rankingCount: number;
  }>;
  userRankings: Array<{
    userId: string;
    username: string;
    displayName: string;
    rating: number;
    rankingYear: number;
  }>;
}

class StatisticsService {
  /**
   * Get overall statistics
   */
  async getOverallStats(): Promise<OverallStats> {
    // Get basic counts
    const [totalMovies, totalUsers, totalRankings] = await Promise.all([
      prisma.movie.count(),
      prisma.user.count(),
      prisma.ranking.count(),
    ]);

    // Get average rating
    const avgRatingResult = await prisma.ranking.aggregate({
      _avg: { rating: true },
    });

    // Get distinct years
    const years = await prisma.ranking.findMany({
      distinct: ['rankingYear'],
      select: { rankingYear: true },
      orderBy: { rankingYear: 'desc' },
    });

    // Get yearly stats
    const yearlyStatsPromises = years.map(yearObj =>
      this.getYearlyStats(yearObj.rankingYear)
    );
    const yearlyStats = await Promise.all(yearlyStatsPromises);

    // Get rating distribution
    const ratingDistribution = await this.getRatingDistribution();

    // Note: Genre distribution would require genre data in the database
    // For now, we'll return empty array
    const genreDistribution: Array<{ genre: string; count: number }> = [];

    return {
      totalMovies,
      totalUsers,
      totalRankings,
      averageRating: avgRatingResult._avg.rating || 0,
      years: years.map(y => y.rankingYear),
      yearlyStats,
      genreDistribution,
      ratingDistribution,
    };
  }

  /**
   * Get yearly statistics
   */
  async getYearlyStats(year: number): Promise<YearlyStats> {
    // Get counts for the year
    const [movieCount, rankingCount, userCount] = await Promise.all([
      prisma.movie.count({ where: { watchedYear: year } }),
      prisma.ranking.count({ where: { rankingYear: year } }),
      prisma.user.count({
        where: {
          rankings: {
            some: { rankingYear: year },
          },
        },
      }),
    ]);

    // Get average rating for the year
    const avgRatingResult = await prisma.ranking.aggregate({
      where: { rankingYear: year },
      _avg: { rating: true },
    });

    // Get top movies for the year
    const topMovies = await prisma.ranking.groupBy({
      by: ['movieId'],
      where: { rankingYear: year },
      _avg: { rating: true },
      _count: true,
      orderBy: { _avg: { rating: 'desc' } },
      take: 10,
    });

    const topMoviesWithDetails = await Promise.all(
      topMovies.map(async (movie) => {
         const movieDetails = await prisma.movie.findUnique({
          where: { id: movie.movieId },
          select: { title: true, year: true, posterUrl: true },
        });

        return {
          id: movie.movieId,
          title: movieDetails?.title || 'Unknown',
          year: movieDetails?.year || 0,
          posterUrl: movieDetails?.posterUrl || null,
          averageRating: movie._avg.rating || 0,
          rankingCount: movie._count,
        };
      })
    );

    // Get top users for the year
    const topUsers = await prisma.ranking.groupBy({
      by: ['userId'],
      where: { rankingYear: year },
      _count: true,
      _avg: { rating: true },
      orderBy: { _count: 'desc' },
      take: 10,
    });

    const topUsersWithDetails = await Promise.all(
      topUsers.map(async (user) => {
        const userDetails = await prisma.user.findUnique({
          where: { id: user.userId },
          select: { username: true, displayName: true },
        });

        return {
          id: user.userId,
          username: userDetails?.username || 'Unknown',
          displayName: userDetails?.displayName || 'Unknown',
          rankingCount: user._count,
          averageRating: user._avg.rating || 0,
        };
      })
    );

    return {
      year,
      movieCount,
      rankingCount,
      userCount,
      averageRating: avgRatingResult._avg.rating || 0,
      topMovies: topMoviesWithDetails,
      topUsers: topUsersWithDetails,
    };
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId: string): Promise<UserStats> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true, displayName: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Get user's rankings
    const rankings = await prisma.ranking.findMany({
      where: { userId },
      include: {
        movie: {
          select: { title: true, year: true },
        },
      },
      orderBy: [{ rankingYear: 'desc' }, { rating: 'desc' }],
    });

    // Calculate stats
    const totalRankings = rankings.length;
    const averageRating = rankings.length > 0
      ? rankings.reduce((sum, r) => sum + r.rating, 0) / rankings.length
      : 0;

    // Get years active
    const yearsActive = [...new Set(rankings.map(r => r.rankingYear))].sort((a, b) => b - a);

    // Get top movies (highest rated)
    const topMovies = rankings
      .slice(0, 10)
      .map(r => ({
        movieId: r.movieId,
        title: r.movie.title,
        year: r.movie.year,
        rating: r.rating,
        rankingYear: r.rankingYear,
      }));

    // Get rating distribution
    const ratingDistribution = this.calculateRatingDistribution(
      rankings.map(r => r.rating)
    );

    return {
      userId,
      username: user.username,
      displayName: user.displayName,
      totalRankings,
      averageRating,
      yearsActive,
      topMovies,
      ratingDistribution,
    };
  }

  /**
   * Get movie statistics
   */
  async getMovieStats(movieId: string): Promise<MovieStats> {
    const movie = await prisma.movie.findUnique({
      where: { id: movieId },
      select: { title: true, year: true },
    });

    if (!movie) {
      throw new Error('Movie not found');
    }

    // Get all rankings for this movie
    const rankings = await prisma.ranking.findMany({
      where: { movieId },
      include: {
        user: {
          select: { username: true, displayName: true },
        },
      },
      orderBy: [{ rankingYear: 'desc' }, { rating: 'desc' }],
    });

    // Calculate stats
    const totalRankings = rankings.length;
    const averageRating = rankings.length > 0
      ? rankings.reduce((sum, r) => sum + r.rating, 0) / rankings.length
      : 0;

    // Get rating distribution
    const ratingDistribution = this.calculateRatingDistribution(
      rankings.map(r => r.rating)
    );

    // Get yearly stats
    const yearlyStatsMap = new Map<number, { total: number; sum: number }>();
    rankings.forEach(r => {
      const yearStats = yearlyStatsMap.get(r.rankingYear) || { total: 0, sum: 0 };
      yearStats.total += 1;
      yearStats.sum += r.rating;
      yearlyStatsMap.set(r.rankingYear, yearStats);
    });

    const yearlyStats = Array.from(yearlyStatsMap.entries())
      .map(([year, stats]) => ({
        year,
        averageRating: stats.total > 0 ? stats.sum / stats.total : 0,
        rankingCount: stats.total,
      }))
      .sort((a, b) => b.year - a.year);

    // Get user rankings
    const userRankings = rankings.map(r => ({
      userId: r.userId,
      username: r.user.username,
      displayName: r.user.displayName,
      rating: r.rating,
      rankingYear: r.rankingYear,
    }));

    return {
      movieId,
      title: movie.title,
      year: movie.year,
      totalRankings,
      averageRating,
      ratingDistribution,
      yearlyStats,
      userRankings,
    };
  }

  /**
   * Get rating distribution
   */
  private async getRatingDistribution(): Promise<Array<{ rating: number; count: number }>> {
    const ratings = await prisma.ranking.findMany({
      select: { rating: true },
    });

    return this.calculateRatingDistribution(ratings.map(r => r.rating));
  }

  /**
   * Calculate rating distribution from array of ratings
   */
  private calculateRatingDistribution(ratings: number[]): Array<{ rating: number; count: number }> {
    const distribution: Record<number, number> = {};
    
    // Initialize all possible ratings (1-10)
    for (let i = 1; i <= 10; i++) {
      distribution[i] = 0;
    }
    
    // Count ratings
    ratings.forEach(rating => {
      const rounded = Math.round(rating);
      if (rounded >= 1 && rounded <= 10) {
        distribution[rounded]++;
      }
    });
    
    // Convert to array
    return Object.entries(distribution)
      .map(([rating, count]) => ({
        rating: parseInt(rating),
        count,
      }))
      .sort((a, b) => a.rating - b.rating);
  }
}

export default StatisticsService;