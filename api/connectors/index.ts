export interface Connector {
    putFile<M extends Record<string, unknown>>(
        date: Date,
        contents: string,
        path: string,
        fileName: string | null,
        meta: M
    ): Promise<string>;
}
