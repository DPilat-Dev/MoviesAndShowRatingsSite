"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserStats = exports.deleteUser = exports.updateUser = exports.createUser = exports.getUserById = exports.getUsers = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getUsers = async (req, res) => {
    try {
        const { page = 1, limit = 20, search } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = search ? {
            OR: [
                { username: { contains: search, mode: 'insensitive' } },
                { displayName: { contains: search, mode: 'insensitive' } },
            ],
        } : {};
        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip,
                take: Number(limit),
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    username: true,
                    displayName: true,
                    avatarUrl: true,
                    isActive: true,
                    createdAt: true,
                    _count: {
                        select: {
                            rankings: true,
                        },
                    },
                },
            }),
            prisma.user.count({ where }),
        ]);
        const usersWithStats = users.map(user => ({
            ...user,
            totalRankings: user._count.rankings,
        }));
        return res.json({
            data: usersWithStats,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total: Number(total),
                pages: Math.ceil(Number(total) / Number(limit)),
            },
        });
    }
    catch (error) {
        console.error('Error fetching users:', error);
        return res.status(500).json({ error: 'Failed to fetch users' });
    }
};
exports.getUsers = getUsers;
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
                isActive: true,
                createdAt: true,
                rankings: {
                    include: {
                        movie: {
                            select: {
                                id: true,
                                title: true,
                                year: true,
                                watchedYear: true,
                            },
                        },
                    },
                    orderBy: { rankedAt: 'desc' },
                    take: 10,
                },
                _count: {
                    select: {
                        rankings: true,
                    },
                },
            },
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const userWithStats = {
            ...user,
            totalRankings: user._count?.rankings || 0,
        };
        return res.json(userWithStats);
    }
    catch (error) {
        console.error('Error fetching user:', error);
        return res.status(500).json({ error: 'Failed to fetch user' });
    }
};
exports.getUserById = getUserById;
const createUser = async (req, res) => {
    try {
        const data = req.body;
        const existingUser = await prisma.user.findUnique({
            where: { username: data.username },
        });
        if (existingUser) {
            return res.status(409).json({
                error: 'Username already exists',
                existingUser: {
                    id: existingUser.id,
                    username: existingUser.username,
                    displayName: existingUser.displayName,
                    avatarUrl: existingUser.avatarUrl,
                    isActive: existingUser.isActive,
                    createdAt: existingUser.createdAt,
                }
            });
        }
        const user = await prisma.user.create({
            data: {
                username: data.username,
                displayName: data.displayName || data.username,
            },
            select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
                isActive: true,
                createdAt: true,
            },
        });
        return res.status(201).json(user);
    }
    catch (error) {
        console.error('Error creating user:', error);
        return res.status(500).json({ error: 'Failed to create user' });
    }
};
exports.createUser = createUser;
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        if (data.username) {
            const existingUser = await prisma.user.findUnique({
                where: { username: data.username },
            });
            if (existingUser && existingUser.id !== id) {
                return res.status(409).json({ error: 'Username already taken' });
            }
        }
        const user = await prisma.user.update({
            where: { id },
            data,
            select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
                isActive: true,
                createdAt: true,
            },
        });
        return res.json(user);
    }
    catch (error) {
        console.error('Error updating user:', error);
        if (error instanceof Error) {
            if (error.message.includes('Record to update not found')) {
                return res.status(404).json({ error: 'User not found' });
            }
            if (error.message.includes('Unique constraint failed')) {
                return res.status(409).json({ error: 'Username already taken' });
            }
        }
        return res.status(500).json({ error: 'Failed to update user' });
    }
};
exports.updateUser = updateUser;
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const rankingsCount = await prisma.ranking.count({
            where: { userId: id },
        });
        if (rankingsCount > 0) {
            return res.status(400).json({
                error: 'Cannot delete user with rankings',
                message: 'User has existing rankings. Deactivate instead.'
            });
        }
        await prisma.user.delete({
            where: { id },
        });
        return res.status(204).send();
    }
    catch (error) {
        console.error('Error deleting user:', error);
        if (error instanceof Error && error.message.includes('Record to delete not found')) {
            return res.status(404).json({ error: 'User not found' });
        }
        return res.status(500).json({ error: 'Failed to delete user' });
    }
};
exports.deleteUser = deleteUser;
const getUserStats = async (req, res) => {
    try {
        const { id } = req.params;
        const [user, rankings, averageRating] = await Promise.all([
            prisma.user.findUnique({
                where: { id },
                select: { id: true, username: true, displayName: true },
            }),
            prisma.ranking.findMany({
                where: { userId: id },
                include: {
                    movie: {
                        select: {
                            title: true,
                            year: true,
                            watchedYear: true,
                        },
                    },
                },
                orderBy: { rankedAt: 'desc' },
            }),
            prisma.ranking.aggregate({
                where: { userId: id },
                _avg: { rating: true },
                _count: true,
            }),
        ]);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const rankingsByYear = rankings.reduce((acc, ranking) => {
            const year = ranking.rankingYear;
            if (!acc[year]) {
                acc[year] = [];
            }
            acc[year].push(ranking);
            return acc;
        }, {});
        const yearlyStats = Object.entries(rankingsByYear).map(([year, yearRankings]) => {
            const avgRating = yearRankings.reduce((sum, r) => sum + r.rating, 0) / yearRankings.length;
            return {
                year: parseInt(year),
                count: yearRankings.length,
                averageRating: parseFloat(avgRating.toFixed(1)),
            };
        });
        return res.json({
            user,
            stats: {
                totalRankings: averageRating._count,
                averageRating: averageRating._count && averageRating._count > 0 && averageRating._avg.rating ? parseFloat(averageRating._avg.rating.toFixed(1)) : null,
                yearlyStats: yearlyStats.sort((a, b) => b.year - a.year),
            },
            recentRankings: rankings.slice(0, 10),
        });
    }
    catch (error) {
        console.error('Error fetching user stats:', error);
        return res.status(500).json({ error: 'Failed to fetch user statistics' });
    }
};
exports.getUserStats = getUserStats;
//# sourceMappingURL=userController.js.map