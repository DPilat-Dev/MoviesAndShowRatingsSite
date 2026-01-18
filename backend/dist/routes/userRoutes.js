"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const validation_1 = require("../middleware/validation");
const validation_2 = require("../utils/validation");
const router = (0, express_1.Router)();
router.get('/', (0, validation_1.validateQuery)(validation_2.paginationSchema), userController_1.getUsers);
router.get('/:id', userController_1.getUserById);
router.post('/', (0, validation_1.validateBody)(validation_2.createUserSchema), userController_1.createUser);
router.put('/:id', (0, validation_1.validateBody)(validation_2.updateUserSchema), userController_1.updateUser);
router.delete('/:id', userController_1.deleteUser);
router.get('/:id/stats', userController_1.getUserStats);
exports.default = router;
//# sourceMappingURL=userRoutes.js.map