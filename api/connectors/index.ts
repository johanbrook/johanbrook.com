export interface Connector {
    putFile<M extends Record<string, unknown>>(contents: string, filePath: string, meta: M): Promise<string>;
}

export interface Connectors {
    github: Connector;
}
