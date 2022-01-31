// deno-fmt-ignore-file
// deno-lint-ignore-file
// This code was bundled using `deno bundle` and it's not recommended to edit it manually

const config = {
    owner: 'johanbrook',
    repo: 'johanbrook.com',
    notesDir: 'src/notes'
};
const isLocal = ()=>location.hostname == 'localhost'
;
export { config as config };
export { isLocal as isLocal };
