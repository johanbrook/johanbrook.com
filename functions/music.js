export function onRequestGet(context) {
	try {
		return handle(context);
	} catch (ex) {
		console.error(ex);
		return new Response(ex.message, {
			status: 500,
		});
	}
}

const handle = async ({ env }) => {
	const { LASTFM_API_KEY } = env;

	if (!LASTFM_API_KEY) {
		throw new Error('Required env vars not defined');
	}

	const res = await send(LASTFM_API_KEY, 'user.getrecenttracks');

	return new Response(JSON.stringify(res), {
		headers: {
			'Content-Type': 'application/json',
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type',
		}
	})
};

const url = new URL('http://ws.audioscrobbler.com/2.0');

const send = async (token, method) => {
	const u = new URL(url);
	u.searchParams.set('method', method);
	u.searchParams.set('format', 'json');
	u.searchParams.set('api_key', token);
	u.searchParams.set('user', 'johanbrook');
	u.searchParams.set('limit', 3);

	return fetch(u, {
		headers: new Headers({
			'user-agent': 'Johan.im-Music/1.0',
		})
	})
		.then(r => r.json())
		.then(json => {
			if (json.error) {
				return {
					kind: 'err',
					message: json.message,
				};
			}
			return {
				kind: 'ok',
				tracks: json.recenttracks.track,
			};
		});
}
