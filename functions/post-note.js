export function onRequestPost(context) {
	try {
		return handle(context);
	} catch (ex) {
		console.error(ex);
		return new Response(ex.message, {
			status: 500,
		});
	}
}

const config = {
	owner: 'johanbrook',
	repo: 'johanbrook.com',
	notesDir: 'src/notes',
};

const isLocal = (url) => url.hostname == 'localhost';

const handle = async ({ request, env }) => {
	const { SHORTCUT_TOKEN, SHORTCUT_PASSWORD } = env;

	if (!SHORTCUT_TOKEN || !SHORTCUT_PASSWORD) {
		throw new Error('Required env vars not defined');
	}

	const password = request.headers.get('x-password');

	if (!password) {
		return new Response('Please provide a password', {
			status: 400,
		});
	}

	if (password != SHORTCUT_PASSWORD) {
		return new Response('Incorrect password', {
			status: 401,
		});
	}

	let body;

	try {
		body = await readBody(request);
	} catch (err) {
		return new Response(err, { status: 400 });
	}

	const url = new URL(request.url);
	const d = new Date();
	const { repo, owner, notesDir } = config;
	const branch = isLocal(url) ? 'dev' : 'main';
	const date = formatDate(d);
	const fileDate = formatDate(d, true);

	const content = `---
date: ${date}
location: On the run
---
${body}\n
`;

	const fileName = `${fileDate}.md`;
	const path = notesDir + '/' + fileName;

	const res = await githubRequest('PUT', `/repos/${owner}/${repo}/contents/${path}`, {
		message: 'Add note from iOS Shortcut',
		content: base64(content),
		branch,
	}, SHORTCUT_TOKEN);

	if (!res.content?.name || !res.content?.html_url) {
		return new Response('Unexpected response when creating a note', {
			status: 500,
		});
	}

	const { name: file, html_url: fileUrl } = res.content;

	return new Response(JSON.stringify({ file, fileUrl, allNotes: 'https://johan.im/mind' }), {
		headers: {
			'content-type': 'application/json',
		},
	});
};

const readBody = async (request) => {
	const contentType = request.headers.get('content-type');

	switch (contentType) {
		case 'application/json': {
			const json = await request.json();

			if (!json.note) {
				throw new Error('Bad JSON, needs: { "note": "<text>" }');
			}

			return json.note;
		}

		case 'text/plain':
		case 'application/text':
		case 'text/html': {
			return request.text();
		}
		default:
			throw new Error('Please send body as JSON, text, or HTML content types');
	}
};

const API_ROOT = 'https://api.github.com';

const githubRequest = async (method, resource, body, token) => {
	const res = await fetch(API_ROOT + resource, {
		method,
		headers: {
			accept: 'application/vnd.github.v3+json',
			authorization: `Bearer ${token}`,
			'X-GitHub-Api-Version': '2022-11-28',
			'user-agent': 'Johan.im-Notes/1.0',
		},
		body: JSON.stringify(body),
	});

	if (!res.ok) {
		throw new Error(
			`Failed to do GitHub request: ${method} ${res.status} ${resource}: ${res.statusText} ${await res
				.text()}`,
		);
	}

	const json = await res.json();

	return json;
};

// => 'yyyy-MM-dd HH:mm:ss'
// fileName: true => 'yyyy-MM-dd-HH-mm'
const formatDate = (date, fileName = false) => {
	const datePart = [
		date.getUTCFullYear(),
		date.getUTCMonth() + 1,
		date.getUTCDate(),
	]
		.map((n) => String(n).padStart(2, '0'))
		.join('-');

	const timePart = [
		date.getUTCHours(),
		date.getUTCMinutes(),
		fileName ? null : date.getUTCSeconds(),
	]
		.filter(Boolean)
		.map((n) => String(n).padStart(2, '0'))
		.join(fileName ? '-' : ':');

	if (fileName) {
		return datePart + '-' + timePart;
	}

	return datePart + ' ' + timePart;
};

// From https://stackoverflow.com/questions/30106476/using-javascripts-atob-to-decode-base64-doesnt-properly-decode-utf-8-strings
// To not mess up utf-8 chars in the string.
const base64 = (str) =>
	btoa(
		encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_match, p1) =>
			String.fromCharCode(parseInt(p1, 16))),
	);
