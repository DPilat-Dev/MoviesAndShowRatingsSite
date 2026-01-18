"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const rankingController_1 = require("../controllers/rankingController");
const validation_1 = require("../middleware/validation");
const validation_2 = require("../utils/validation");
const router = (0, express_1.Router)();
router.get('/', (0, validation_1.validateQuery)(validation_2.rankingQuerySchema), (0, validation_1.validateQuery)(validation_2.paginationSchema), rankingController_1.getRankings);
router.get('/:id', rankingController_1.getRankingById);
router.post('/', (0, validation_1.validateBody)(validation_2.createRankingSchema), rankingController_1.createRanking);
router.put('/:id', (0, validation_1.validateBody)(validation_2.updateRankingSchema), rankingController_1.updateRanking);
router.delete('/:id', rankingController_1.deleteRanking);
router.get('/year/:year', rankingController_1.getRankingsByYear);
router.get('/stats/years', rankingController_1.getYearlyStats);
router.get('/user/:userId/movie/:movieId', rankingController_1.getUserMovieRanking);
router.get('/user/:userId/movie/:movieId/year/:year', rankingController_1.getUserMovieRanking);
exports.default = router;
//# sourceMappingURL=rankingRoutes.js.map