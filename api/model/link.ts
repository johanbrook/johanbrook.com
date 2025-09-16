import { ProblemError, ProblemKind } from '../problem.ts';
import { FileHost } from '../services/index.ts';
import { join } from 'std/path/mod.ts';
import { yamlParse, yamlStringify } from '../yaml.ts';

const LINKS_PATH = 'src/_data/links.yml';

export interface Link {
    [k: string]: string | undefined;
    url: string;
    notes?: string;
}

export type LinkInput = Pick<Link, 'url' | 'notes'>;

export const add = async (store: FileHost, input: LinkInput) => {
    const link: Link = {
        url: input.url.trim(),
        notes: input.notes?.trim() || undefined, // filter away empty strings
    };

    const links = await findAll(store);

    if (links.find((b) => b.url == link.url)) {
        throw new ProblemError(
            ProblemKind.BadInput,
            `A link with that URL already exists: ${link.url}`,
        );
    }

    const raw = await store.getFile(LINKS_PATH);

    const str = yamlStringify([link]);

    const final = raw + '\n' + str;

    const fullPath = await store.putFile(
        final,
        join(LINKS_PATH),
        `Add link: ${link.url}`,
    );

    return [link, fullPath];
};

const findAll = async (store: FileHost): Promise<Link[]> => {
    const raw = await store.getFile(LINKS_PATH);

    if (!raw) return [];

    return linksArrayOf(raw);
};

const linksArrayOf = (raw: string): Link[] => {
    const links = yamlParse(raw);

    if (!Array.isArray(links)) {
        throw new ProblemError(ProblemKind.InconsistentFile, `${LINKS_PATH} isn't a YAML array`);
    }

    return links as Link[];
};
