export enum ProblemKind {
    BodyParseError = 'BodyParseError',
    GitHubError = 'GitHubError',
    BadInput = 'BadInput',
    BadAuth = 'BadAuth',
}

export class ProblemError extends Error {
    #kind: ProblemKind;

    constructor(kind: ProblemKind, message: string) {
        super(message);

        this.#kind = kind;
        this.name = `ProblemError(${kind})`;
    }

    toString() {
        return `ProblemError(${this.#kind}) ${this.message}`;
    }

    get status(): number {
        switch (this.#kind) {
            case ProblemKind.BodyParseError:
                return 400;
            case ProblemKind.BadInput:
                return 400;
            case ProblemKind.BadAuth:
                return 401;
            case ProblemKind.GitHubError:
                return 500;
            default:
                return 500;
        }
    }
}
