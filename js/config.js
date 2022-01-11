const config = {
    owner: 'johanbrook',
    repo: 'johanbrook.com',
    notesDir: 'src/notes'
};
const isLocal = ()=>location.hostname == 'localhost'
;
export { config as config };
export { isLocal as isLocal };
