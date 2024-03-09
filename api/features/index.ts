/** Common fields for pages. */
export interface Meta {
    [index: string]: unknown;
    date: Date;
    location?: string;
    tags?: string[];
    timezone?: string;
}
