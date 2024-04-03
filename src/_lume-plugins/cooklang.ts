import { Page } from 'lume/core/file.ts';
import * as CookLang from 'cooklang';

type RecipeData = Pick<CookLang.Recipe, 'cookwares' | 'ingredients' | 'metadata'> & {
    /** The raw `.cook` file content. */
    raw: string;
    steps: Array<string[]>;
    title?: string;
};

export default function (): Lume.Plugin {
    return (site) => {
        site
            // Load .cook files
            .loadPages(['.cook'], async (path): Promise<RecipeData> => {
                const raw = await Deno.readTextFile(path);
                const recipe = new CookLang.Recipe(raw);

                return { ...recipe, raw, title: recipe.metadata.title, steps: recipeStepsOf(recipe) };
            })
            // (Re-)generate raw .cook files
            .preprocess(['.cook'], (filtered, all) => {
                for (const page of filtered) {
                    const cookFile = Page.create({
                        basename: page.src.entry?.name,
                        url: page.src.path + page.src.ext,
                        content: page.data.raw,
                    });

                    page.data.rawUrl = cookFile.data.url;

                    all.push(cookFile);
                }
            });
    };
}

const recipeStepsOf = (recipe: CookLang.Recipe) => {
    const ret: Array<string[]> = [];

    recipe.steps.forEach((tokens, idx) => {
        if (!ret[idx]) ret[idx] = [];

        tokens.forEach((tok) => {
            let content = '';

            switch (tok.type) {
                case 'timer':
                    content = `${tok.quantity} ${tok.units}`;
                    break;
                case 'ingredient':
                    content = tok.name;
                    break;
                case 'text':
                    content = tok.value;
                    break;
            }

            content = `<span class="recipe--${tok.type}">${content}</span>`;

            ret[idx].push(content);
        });
    });

    return ret;
};
