export interface Config {
    owner: string;
    repo: string;
    notesDir: string;
}

export const config: Config = {
    owner: 'johanbrook',
    repo: 'johanbrook.com',
    notesDir: 'src/notes',
};

export const isLocal = () => location.hostname == 'localhost';
