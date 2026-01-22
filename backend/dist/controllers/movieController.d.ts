import { Request, Response } from 'express';
export declare const getMovies: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getMovieById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createMovie: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateMovie: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const deleteMovie: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getMovieStats: (_req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getUnratedMovies: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const updateMovieMetadata: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=movieController.d.ts.map