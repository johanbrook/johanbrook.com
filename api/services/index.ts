/** Describes the services where content is hosted. */
export interface FileHost {
    putFile(
        contents: string,
        filePath: string,
    ): Promise<string>;
}

export interface Services {
    github: FileHost;
}
