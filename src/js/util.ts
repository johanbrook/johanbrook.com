export interface Err {
    kind: 'err';
    msg: string;
    cause?: Error;
}

export type Result<T> = T | Err;

export const promiseResult = <T>(p: Promise<T | Err>): Promise<T> =>
    new Promise((rs, rj) =>
        p.then((v) => (isErr(v) ? rj(new Error(v.msg)) : rs(v))).catch(rj)
    );

export const isErr = (t: unknown): t is Err => (t as Err).kind == 'err';
