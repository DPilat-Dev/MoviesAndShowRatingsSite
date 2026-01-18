import { Request, Response, NextFunction } from 'express';
import { AnyZodObject } from 'zod';
export declare const validate: (schema: AnyZodObject) => (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export declare const validateBody: (schema: AnyZodObject) => (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export declare const validateQuery: (schema: AnyZodObject) => (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
//# sourceMappingURL=validation.d.ts.map