import { Handler } from '../router.ts';

export const postNote: Handler = (req: Request) => {
    return Response.json({ hej: 'foo' });
};
