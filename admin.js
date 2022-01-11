const config = {
    owner: 'johanbrook',
    repo: 'johanbrook.com',
    notesDir: 'src/notes'
};
const isLocal = ()=>location.hostname == 'localhost'
;
const isErr = (t)=>t.kind == 'err'
;
const STORAGE_KEY = 'jb_tok';
const API_ROOT = 'https://api.github.com';
const mkGitHub = ({ url  })=>{
    const doAuth = ()=>{
        location.href = url;
    };
    const request = async (resource, { method ='GET' , query , body  } = {})=>{
        const storedTok = getStoredToken();
        if (!storedTok) {
            doAuth();
            return Promise.resolve({});
        }
        const qs = query ? '?' + new URLSearchParams(query).toString() : '';
        const res = await fetch(API_ROOT + resource + qs, {
            method,
            headers: {
                accept: 'application/vnd.github.v3+json',
                authorization: `token ${storedTok}`
            },
            body: body ? JSON.stringify(body) : undefined
        });
        const json = await res.json();
        if (!res.ok) {
            if (res.status == 401) {
                doAuth();
                return Promise.resolve({});
            }
            return {
                kind: 'err',
                msg: 'Failed to request GitHub REST data',
                cause: new Error(`${method} ${res.status} ${resource}: ${json.message || res.statusText}`)
            };
        }
        return json;
    };
    const isAuthError = (err)=>!!err.error
    ;
    const fetchToken = async (code)=>{
        const path = location.pathname + location.search.replace(/\bcode=\w+/, '').replace(/\?$/, '');
        history.pushState({}, '', path);
        const res = await fetch(url, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                code
            })
        });
        if (!res.ok) {
            return {
                kind: 'err',
                msg: res.statusText
            };
        }
        const result = await res.json();
        if (isAuthError(result)) {
            return {
                kind: 'err',
                msg: result.error
            };
        }
        try {
            localStorage.setItem(STORAGE_KEY, result.token);
        } catch (_ex) {}
        return {
            kind: 'token',
            tok: result.token
        };
    };
    const createNote = async (text)=>{
        const d = new Date();
        const { repo , owner , notesDir  } = config;
        const branch = isLocal() ? 'dev' : 'main';
        const date = formatDate(d);
        const fileDate = formatDate(d, true);
        const content = `---
date: ${date}
location: On the run
---

${text}\n
`;
        const fileName = `${fileDate}.md`;
        const path = notesDir + '/' + fileName;
        const res = await request(`/repos/${owner}/${repo}/contents/${path}`, {
            method: 'PUT',
            body: {
                message: 'Add note from GUI app',
                content: base64(content),
                branch
            }
        });
        if (isErr(res)) return res;
        if (!res.content?.name || !res.content?.html_url || !res.commit.html_url) return {
            kind: 'err',
            msg: 'Unexpected response when creating a note'
        };
        return {
            commitUrl: res.commit.html_url,
            file: res.content.name,
            fileUrl: res.content.html_url
        };
    };
    return {
        fetchToken,
        createNote
    };
};
const getStoredToken = ()=>{
    try {
        return localStorage.getItem(STORAGE_KEY);
    } catch (_ex) {
        return null;
    }
};
const base64 = (str)=>btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_match, p1)=>String.fromCharCode(parseInt(p1, 16))
    ))
;
const formatDate = (date, fileName = false)=>{
    const datePart = [
        date.getUTCFullYear(),
        date.getUTCMonth() + 1,
        date.getUTCDate(), 
    ].map((n)=>String(n).padStart(2, '0')
    ).join('-');
    const timePart = [
        date.getUTCHours(),
        date.getUTCMinutes(),
        fileName ? null : date.getUTCSeconds(), 
    ].filter(Boolean).map((n)=>String(n).padStart(2, '0')
    ).join(fileName ? '-' : ':');
    if (fileName) {
        return datePart + '-' + timePart;
    }
    return datePart + ' ' + timePart;
};
const WORKER_URL = isLocal() ? 'http://localhost:3001' : 'https://github-oauth.brookie.workers.dev';
const mkService = (_service, args)=>{
    return mkGitHub(args);
};
const runApp = async ()=>{
    const svc = mkService('github', {
        url: WORKER_URL
    });
    const root = document.getElementById('root');
    const initial = initialState();
    const setState = reducer(initial);
    const renderApp = App(svc);
    const html = async (s)=>{
        root.innerHTML = await renderApp(s);
    };
    const tick = async (update)=>{
        console.log('update', update);
        const state = setState(update);
        console.log('state', state);
        await html(state);
    };
    window.handleEvt = async (evt, action)=>{
        console.log('event', evt, action);
        switch(action.kind){
            case 'note_input':
                {
                    const textarea = evt.target;
                    window.submitNote.disabled = textarea.value.trim().length == 0;
                    textarea.parentElement.dataset.replicatedValue = textarea.value;
                    break;
                }
            case 'submit_note':
                {
                    evt.preventDefault();
                    const text = evt.target.querySelector('textarea').value.trim();
                    if (!text) {
                        return;
                    }
                    const res = await svc.createNote(text);
                    if (isErr(res)) {
                        await tick({
                            err: res
                        });
                    } else {
                        flash(window.submitNote, '✨ posted! ✨');
                        await tick({
                            createNote: res
                        });
                    }
                    break;
                }
        }
    };
    await tick(initial);
};
const App = (svc)=>{
    return async (state)=>{
        const code = new URL(location.href).searchParams.get('code');
        if (code) {
            const res = await svc.fetchToken(code);
            if (isErr(res)) {
                return Error1(res);
            }
        }
        if (state.err) {
            return Error1(state.err);
        }
        return `
            <section>
                <h1 class="mb2 no-rhythm">${config.repo}</h1>
                <p>
                    <a href="https://github.com/${config.owner}/${config.repo}">${config.owner}/${config.repo}</a>
                </p>

                ${NewNote()}

                ${state.createNote ? `<p>Note created in repo: <a href="${state.createNote.fileUrl}">${state.createNote.file}</a></p>` : ''}

                <p>
                    <a href="/mind" class="f6">View all notes</a>
                </p>
            </section>`;
    };
};
const reducer = (state)=>{
    function* gen() {
        let update = {};
        let prev = state;
        while(true){
            const newState = {
                ...prev,
                ...update
            };
            prev = newState;
            update = yield newState;
        }
    }
    const r = gen();
    r.next(state);
    return (update)=>r.next(update).value
    ;
};
const ev = (e, action)=>`on${e}='handleEvt(event${action ? ', ' + JSON.stringify(action) : ''})'`
;
const NewNote = ()=>`
    <form
        ${ev('submit', {
        kind: 'submit_note'
    })}
        class="measure-narrow mx-auto"
    >
        <h2>New note</h2>

        <div class="grow-wrap mb3">
            <textarea
                ${ev('input', {
        kind: 'note_input'
    })}
                placeholder="Text…"
                class="w-full f5"
            ></textarea>
        </div>

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
`
;
const Error1 = (err)=>`
    <section>
        <h1>Error</h1>
        <p>${err.msg}</p>
        ${err.cause ? `<pre>${err.cause.message}</pre>` : ''}
    </section>
`
;
const flash = (el, msg)=>{
    const org = el instanceof HTMLInputElement ? el.value : el.innerText;
    const set = (str, disable)=>{
        if (el instanceof HTMLInputElement) {
            el.value = str;
            el.disabled = disable;
        } else {
            el.innerText = str;
        }
    };
    set(msg, true);
    setTimeout(()=>{
        set(org, false);
    }, 3000);
};
const initialState = ()=>{
    (()=>{
        try {
            const json = localStorage.getItem('jb_state') ?? '{}';
            return JSON.parse(json);
        } catch (_ex) {
            return {};
        }
    })();
    return {};
};
runApp().catch(console.error);
