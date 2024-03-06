import { Connectors } from '../app.ts';

export type AppHandler = (connectors: Connectors, req: Request) => Promise<Response> | Response;

export interface Meta {
    [index: string]: unknown;
    date: Date;
    location?: string;
    tags?: string[];
    timezone?: string;
}
