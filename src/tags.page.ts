export const layout = 'layouts/tagg.njk';

export default function* ({ search }: Lume.Data) {
    for (const tag of search.values<string>('tags')) {
        yield {
            url: `/tags/${tag}/`,
            type: 'tag',
            tag,
        };
    }
}
