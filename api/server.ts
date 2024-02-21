Deno.serve(
    {
        onListen: ({ port }) => {
            console.log('Deno server listening on *:', port);
        },
    },
    (req: Request, conn: Deno.ServeHandlerInfo) => {
        // Get information about the incoming request
        const method = req.method;
        const ip = conn.remoteAddr.hostname;
        console.log(`${ip} just made an HTTP ${method} request.`);

        return new Response('Hello, world!');
    }
);
