import { Request, Response } from 'express';
export declare const getRankings: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getRankingById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createRanking: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateRanking: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteRanking: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getRankingsByYear: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getYearlyStats: (_req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getUserMovieRanking: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=rankingController.d.ts.map