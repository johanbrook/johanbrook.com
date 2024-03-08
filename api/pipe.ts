export type Pipe = {
    <A>(): (a: A) => Promise<A> | A;

    <A, B>(f1: (a: A) => Promise<B> | B): (a: A) => Promise<B> | B;

    <A, B, C>(f1: (a: A) => Promise<B> | B, f2: (b: B) => Promise<C> | C): (a: A) => Promise<C> | C;

    <A, B, C, D>(f1: (a: A) => Promise<B>, f2: (b: B) => Promise<C>, f3: (c: C) => Promise<D>): (
        a: A,
    ) => Promise<D>;

    <A, B, C, D, E>(
        f1: (a: A) => Promise<B>,
        f2: (b: B) => Promise<C>,
        f3: (c: C) => Promise<D>,
        f4: (d: D) => Promise<E>,
    ): (a: A) => Promise<E>;

    <A, B, C, D, E, F>(
        f1: (a: A) => Promise<B>,
        f2: (b: B) => Promise<C>,
        f3: (c: C) => Promise<D>,
        f4: (d: D) => Promise<E>,
        f5: (e: E) => Promise<F>,
    ): (a: A) => Promise<F>;

    <A, B, C, D, E, F, G>(
        f1: (a: A) => Promise<B>,
        f2: (b: B) => Promise<C>,
        f3: (c: C) => Promise<D>,
        f4: (d: D) => Promise<E>,
        f5: (e: E) => Promise<F>,
        f6: (f: F) => Promise<G>,
    ): (a: A) => Promise<G>;

    <A, B, C, D, E, F, G, H>(
        f1: (a: A) => Promise<B>,
        f2: (b: B) => Promise<C>,
        f3: (c: C) => Promise<D>,
        f4: (d: D) => Promise<E>,
        f5: (e: E) => Promise<F>,
        f6: (f: F) => Promise<G>,
        f7: (g: G) => Promise<H>,
    ): (a: A) => Promise<H>;

    <A, B, C, D, E, F, G, H, I>(
        f1: (a: A) => Promise<B>,
        f2: (b: B) => Promise<C>,
        f3: (c: C) => Promise<D>,
        f4: (d: D) => Promise<E>,
        f5: (e: E) => Promise<F>,
        f6: (f: F) => Promise<G>,
        f7: (g: G) => Promise<H>,
        f8: (h: H) => Promise<I>,
    ): (a: A) => Promise<I>;

    <A, B, C, D, E, F, G, H, I, J>(
        f1: (a: A) => Promise<B>,
        f2: (b: B) => Promise<C>,
        f3: (c: C) => Promise<D>,
        f4: (d: D) => Promise<E>,
        f5: (e: E) => Promise<F>,
        f6: (f: F) => Promise<G>,
        f7: (g: G) => Promise<H>,
        f8: (h: H) => Promise<I>,
        f9: (i: I) => Promise<J>,
    ): (a: A) => Promise<J>;
};

/** Compose functions returning promises from left to right. */
export const pipe =
    ((...as: any) => (a1: any) =>
        as.reduce((pa: any, fn: any) => pa.then((a: any) => fn(a)), Promise.resolve(a1))) as Pipe;
