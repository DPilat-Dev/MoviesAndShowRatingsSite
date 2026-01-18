import { Request, Response } from 'express';
export declare const getRankings: (req: Request, res: Response) => Promise<void>;
export declare const getRankingById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const createRanking: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateRanking: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteRanking: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getRankingsByYear: (req: Request, res: Response) => Promise<void>;
export declare const getYearlyStats: (req: Request, res: Response) => Promise<void>;
export declare const getUserMovieRanking: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=rankingController.d.ts.map