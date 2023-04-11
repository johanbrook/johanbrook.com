export function onRequest(context) {
	try {
		return handle(context);
	} catch (ex) {
		console.error(ex);
		return new Response(ex.message, {
			status: 500,
		});
	}
}

async function handle({ request, env }) {
	const { ADMIN_CLIENT_SECRET: client_secret, ADMIN_CLIENT_ID: client_id } = env;

	if (!client_id || !client_secret) {
		throw new Error('Missing some required env var(s)');
	}

	// handle CORS pre-flight request
	if (request.method == 'OPTIONS') {
		return new Response(null, {
			headers: {
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
				'Access-Control-Allow-Headers': 'Content-Type',
			},
		});
	}

	// redirect GET requests to the OAuth login page on github.com
	if (request.method == 'GET') {
		return Response.redirect(
			`https://github.com/login/oauth/authorize?client_id=${client_id}&scope=repo&allow_signup=false`,
			302,
		);
	}

	const { code } = await request.json();

	const response = await fetch(
		'https://github.com/login/oauth/access_token',
		{
			method: 'POST',
			headers: {
				'content-type': 'application/json',
				'user-agent': 'cloudflare-worker-github-oauth',
				accept: 'application/json',
			},
			body: JSON.stringify({ client_id, client_secret, code }),
		},
	);
	const result = await response.json();
	const headers = {
		'Access-Control-Allow-Origin': '*',
	};

	if (result.error) {
		return new Response(JSON.stringify(result), {
			status: 401,
			headers,
		});
	}

	return new Response(JSON.stringify({ token: result.access_token }), {
		status: 201,
		headers,
	});
}
