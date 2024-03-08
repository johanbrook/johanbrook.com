export interface Connector {
    putFile(
        contents: string,
        filePath: string,
    ): Promise<string>;
}

export interface Connectors {
    github: Connector;
}
