import { Services } from '../services/index.ts';

export type AppHandler = (connectors: Services, req: Request) => Promise<Response> | Response;

export interface Meta {
    [index: string]: unknown;
    date: Date;
    location?: string;
    tags?: string[];
    timezone?: string;
}
