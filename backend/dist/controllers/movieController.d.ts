import { Request, Response } from 'express';
export declare const getMovies: (req: Request, res: Response) => Promise<void>;
export declare const getMovieById: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const createMovie: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const updateMovie: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteMovie: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getMovieStats: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=movieController.d.ts.map