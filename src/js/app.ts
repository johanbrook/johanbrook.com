import { config, isLocal } from './config.ts';
import { Args as GitHubArgs, mkGitHub } from './github.ts';
import type { CreateNoteResult, Service } from './service.ts';
import { Err, isErr } from './util.ts';

const WORKER_URL = isLocal() ? 'http://localhost:3001' : 'https://github-oauth.brookie.workers.dev';

interface Services {
	github: GitHubArgs;
}

const mkService = <T extends keyof Services>(
	_service: T,
	args: Services[T],
): Service => {
	return mkGitHub(args);
};

interface State {
	err?: Err;
	createNote?: CreateNoteResult;
}

export const runApp = async () => {
	const svc = mkService('github', { url: WORKER_URL });
	const root = document.getElementById('root')!;

	const initial = initialState();
	const setState = reducer(initial);

	const renderApp = App(svc);

	const html = async (s: State) => {
		root.innerHTML = await renderApp(s);
	};

	const tick = async (update: Partial<State>) => {
		console.log('update', update);
		const state = setState(update);
		console.log('state', state);

		// Side effects
		await html(state);
	};

	(window as any).handleEvt = async (evt: Event, action: Action) => {
		console.log('event', evt, action);

		switch (action.kind) {
			case 'note_input': {
				const textarea = evt.target as HTMLTextAreaElement;

				((window as any).submitNote as HTMLInputElement).disabled =
					textarea.value.trim().length == 0;

				// Autogrow
				textarea.parentElement!.dataset.replicatedValue = textarea.value;
				break;
			}

			case 'submit_note': {
				evt.preventDefault();
				const form = (evt.target as HTMLFormElement);

				const text = form
					.querySelector('textarea')!
					.value.trim();

				const draft = form
					.querySelector<HTMLInputElement>('#draft-check')
					.checked;

				if (!text) {
					return;
				}

				const res = await svc.createNote(text, draft);

				if (isErr(res)) {
					await tick({ err: res });
				} else {
					flash(
						(window as any).submitNote as HTMLInputElement,
						'✨ posted! ✨',
					);

					await tick({ createNote: res });
				}

				break;
			}
		}
	};

	// Initial render
	await tick(initial);
};

const App = (svc: Service) => {
	return async (state: State) => {
		const code = new URL(location.href).searchParams.get('code');

		if (code) {
			const res = await svc.fetchToken(code);

			if (isErr(res)) {
				return Error(res);
			}
		}

		svc.maybeLogin();

		if (state.err) {
			return Error(state.err);
		}

		return /* html */ `
            <section>
                <h1 class="mb2 no-rhythm">${config.repo}</h1>
                <p>
                    <a href="https://github.com/${config.owner}/${config.repo}">${config.owner}/${config.repo}</a>
                </p>

                ${NewNote()}

                ${
			state.createNote
				? `<p>Note created in repo: <a href="${state.createNote.fileUrl}">${state.createNote.file}</a></p>`
				: ''
		}

                <p>
                    <a href="/mind" class="f6">View all notes</a>
                </p>
            </section>`;
	};
};

const reducer = <S>(state: S) => {
	function* gen() {
		let update: Partial<S> = {};
		let prev: S = state;

		while (true) {
			const newState = { ...prev, ...update };
			prev = newState;
			update = yield newState as S;
		}
	}

	const r = gen();
	r.next(state); // Initial

	return (update: Partial<S>) => r.next(update).value as S;
};

interface SubmitNote {
	kind: 'submit_note';
}

interface NoteInput {
	kind: 'note_input';
}

interface ToggleDraft {
	kind: 'toggle_draft';
}

type Action = SubmitNote | NoteInput | ToggleDraft;

const ev = <T extends keyof DocumentEventMap>(e: T, action: Action) =>
	`on${e}='handleEvt(event${action ? ', ' + JSON.stringify(action) : ''})'`;

const NewNote = () => /* HTML */ `
    <form
        ${
	ev('submit', {
		kind: 'submit_note',
	})
}
        class="measure-narrow mx-auto"
    >
        <h2>New note</h2>

        <div class="grow-wrap mb3">
            <textarea
                ${ev('input', { kind: 'note_input' })}
                placeholder="Text…"
                class="w-full f5"
            ></textarea>
        </div>

        <p>
            <label>
                <input class="checkbox-fix" type="checkbox" id="draft-check">
                Draft
            </label>
        </p>

        <p>
            <input
                type="submit"
                id="submitNote"
                value="Post it"
                class="btn"
                disabled
            />
        </p>
    </form>
`;

const Error = (err: Err) => /* html */ `
    <section>
        <h1>Error</h1>
        <p>${err.msg}</p>
        ${err.cause ? `<pre>${err.cause.message}</pre>` : ''}
    </section>
`;

const flash = (el: HTMLElement, msg: string) => {
	const org = el instanceof HTMLInputElement ? el.value : el.innerText;

	const set = (str: string, disable: boolean) => {
		if (el instanceof HTMLInputElement) {
			el.value = str;
			el.disabled = disable;
		} else {
			el.innerText = str;
		}
	};

	set(msg, true);

	setTimeout(() => {
		set(org, false);
	}, 3000);
};

interface Persisted {}

const persist = (p: Persisted) => {
	try {
		localStorage.setItem('jb_state', JSON.stringify(p));
	} catch (_ex) {
		//
	}
};

const initialState = (): State => {
	const persisted = ((): Persisted => {
		try {
			const json = localStorage.getItem('jb_state') ?? '{}';
			return JSON.parse(json);
		} catch (_ex) {
			//
			return {};
		}
	})();

	return {};
};
