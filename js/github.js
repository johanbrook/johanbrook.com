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
    const maybeLogin = ()=>{
        const storedTok = getStoredToken();
        if (!storedTok) {
            location.href = url;
        }
    };
    return {
        maybeLogin,
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
export { mkGitHub as mkGitHub };
