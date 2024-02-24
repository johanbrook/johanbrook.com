const SECRET = Deno.env.get('API_SECRET');

if (!SECRET) {
    throw new Error('No API_SECRET env var defined');
}

export const checkAuth = (req: Request): Response | void => {
    const password = req.headers.get('x-password');

    if (!password) {
        return new Response('Please provide a password', {
            status: 400,
        });
    }

    if (password != SECRET) {
        return new Response('Incorrect password', {
            status: 401,
        });
    }
};
