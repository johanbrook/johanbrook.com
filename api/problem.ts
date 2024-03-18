export enum ProblemKind {
    /** Failed to parse or validate JSON body. */
    BodyParseError = 'BodyParseError',
    /** Unexpected schema from file. */
    InconsistentFile = 'InconsistentFile',
    /** Badness from GitHub. */
    GitHubError = 'GitHubError',
    /** Error caused by bad client input. */
    BadInput = 'BadInput',
    /** Auth error caused by bad client behaviour. */
    BadAuth = 'BadAuth',
    /** Something wasn't found on our side. */
    NotFound = 'NotFound',
}

export class ProblemError extends Error {
    kind: ProblemKind;

    constructor(kind: ProblemKind, message: string) {
        super(message);

        this.kind = kind;
        this.name = `ProblemError(${kind})`;
    }

    toString() {
        return `${this.name} ${this.message}`;
    }

    get status(): number {
        switch (this.kind) {
            /* falls through */
            case ProblemKind.BodyParseError:
            case ProblemKind.BadInput:
                return 400;
            case ProblemKind.BadAuth:
                return 401;
            case ProblemKind.NotFound:
                return 404;
            /* falls through */
            case ProblemKind.GitHubError:
            case ProblemKind.InconsistentFile:
            default:
                return 500;
        }
    }
}
