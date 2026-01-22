"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const movieController_1 = require("../controllers/movieController");
const validation_1 = require("../middleware/validation");
const validation_2 = require("../utils/validation");
const router = (0, express_1.Router)();
router.get('/', (0, validation_1.validateQuery)(validation_2.movieQuerySchema), (0, validation_1.validateQuery)(validation_2.paginationSchema), movieController_1.getMovies);
router.get('/stats', movieController_1.getMovieStats);
router.get('/unrated/:year', movieController_1.getUnratedMovies);
router.get('/:id', movieController_1.getMovieById);
router.post('/', (0, validation_1.validateBody)(validation_2.createMovieSchema), movieController_1.createMovie);
router.put('/:id', (0, validation_1.validateBody)(validation_2.updateMovieSchema), movieController_1.updateMovie);
router.post('/bulk-update', (0, validation_1.validateBody)(validation_2.bulkUpdateMovieSchema), movieController_1.updateMovieMetadata);
router.delete('/:id', movieController_1.deleteMovie);
exports.default = router;
//# sourceMappingURL=movieRoutes.js.map