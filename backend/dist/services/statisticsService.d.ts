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
    genreDistribution: Array<{
        genre: string;
        count: number;
    }>;
    ratingDistribution: Array<{
        rating: number;
        count: number;
    }>;
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
    ratingDistribution: Array<{
        rating: number;
        count: number;
    }>;
}
export interface MovieStats {
    movieId: string;
    title: string;
    year: number;
    totalRankings: number;
    averageRating: number;
    ratingDistribution: Array<{
        rating: number;
        count: number;
    }>;
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
declare class StatisticsService {
    getOverallStats(): Promise<OverallStats>;
    getYearlyStats(year: number): Promise<YearlyStats>;
    getUserStats(userId: string): Promise<UserStats>;
    getMovieStats(movieId: string): Promise<MovieStats>;
    private getRatingDistribution;
    private calculateRatingDistribution;
}
export default StatisticsService;
//# sourceMappingURL=statisticsService.d.ts.map