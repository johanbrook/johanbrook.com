import feed from 'lume/plugins/feed.ts';
import { DateTimeFormat, formatTemporalDate } from './src/_lume-plugins/temporal-date.ts';
import { type Book } from './api/model/book.ts';

export const feeds = () => (site: any) => {
    site.use(feed({
        output: ['feed.xml', 'feed.json'],
        query: 'type=note|post|recipe|book',
        sort: 'finishedAt=desc date=desc',
        info: {
            title: "Johan's feed",
            description: 'Aggregated feed of all activity on johan.im',
            generator: false,
        },
        items: {
            title: (t) => {
                switch (t.type) {
                    case 'note':
                        return formatTemporalDate(t.date, DateTimeFormat.HumanTime, t.timezone);
                    default:
                        return t.title;
                }
            },
            description: (t) => {
                switch (t.type) {
                    case 'post':
                        return '=excerpt';
                    case 'book':
                        return bookDescriptionOf(t);
                    default:
                        return t.excerpt || t.description;
                }
            },

            content: (t) => {
                switch (t.type) {
                    case 'book':
                        return t.notes || 'No notes';
                    default:
                        return t.children || t.content;
                }
            },
        },
    }))
        .use(feed({
            output: ['micro.xml', 'micro.json'],
            query: 'type=note',
            info: {
                title: '=titles.micro',
                generator: false,
            },
            items: {
                title: (post) => formatTemporalDate(post.date, DateTimeFormat.HumanTime, post.timezone),
            },
        }))
        .use(feed({
            output: ['writings.xml', 'writings.json'],
            query: 'type=post',
            info: {
                title: '=titles.writings',
                generator: false,
            },
            items: {
                description: '=excerpt',
            },
        }))
        .use(feed({
            output: ['reading.xml', 'reading.json'],
            query: 'type=book',
            sort: 'finishedAt=desc',
            info: {
                title: '=titles.reading',
                generator: false,
            },
            items: {
                description: bookDescriptionOf,
                content: (book) => {
                    if (book.notes) return book.notes;
                    return 'No notes';
                },
                updated: '=finishedAt',
            },
        }))
        .use(feed({
            output: ['recipes.xml', 'recipes.json'],
            query: 'type=recipe',
            info: {
                title: '=titles.recipes',
                generator: false,
            },
        }));
};

const bookDescriptionOf = (book: Book) => {
    if (book.dropped) return 'Book dropped';
    if (book.paused) return 'Book paused';
    if (!book.finished) return 'Currently reading';
    return 'Finished reading';
};
