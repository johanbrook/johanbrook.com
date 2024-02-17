import { notePermalinkOf } from '../_includes/permalinks.ts';

// Public, for template use

export const url = (page: Lume.Page) => {
    if (!page.src.entry) {
        throw new Error(`No entry for page: ${page.sourcePath}`);
    }
    return notePermalinkOf(page.src.entry.name);
}
