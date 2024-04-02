import * as CookLang from 'cooklang';

export const layout = 'layouts/reci.njk';

interface RecipeData extends Lume.Data {
    recipes: Record<string, CookLang.Recipe>;
}

export default function* (data: RecipeData) {
    for (const [slug, recipe] of Object.entries(data.recipes)) {
        yield {
            ...recipe,
            url: `/recipes/${slug}/`,
            type: 'recipe',
        };
    }
}
