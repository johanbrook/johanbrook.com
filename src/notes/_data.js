export const microRoot = '/micro';
// [TODO]
export const url = (page) => `${microRoot}/${page.src.split('/').pop().replace(/\.[^.]+$/, '')}/`;
