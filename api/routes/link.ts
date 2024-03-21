import { ProblemError, ProblemKind } from '../problem.ts';
import { Services } from '../services/index.ts';
import * as Link from '../model/link.ts';

export const addLink = async (services: Services, json: any) => {
    const input = linkInputOf(json);

    return await Link.add(services.fileHost, input);
};

const linkInputOf = (json: any): Link.LinkInput => {
    const { url, notes } = json;

    if (typeof url != 'string') {
        throw new ProblemError(
            ProblemKind.BodyParseError,
            `URL must be a string, got ${typeof url}`,
        );
    }

    if (!URL.canParse(url)) {
        throw new ProblemError(ProblemKind.BodyParseError, `${url} isn't a valid URL`);
    }

    if (notes && typeof notes != 'string') {
        throw new ProblemError(
            ProblemKind.BodyParseError,
            `"notes" must be a string, got ${typeof notes}`,
        );
    }

    return {
        url,
        notes,
    };
};
