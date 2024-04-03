import { Page, RawData } from 'lume/core/file.ts';
import * as CookLang from 'cooklang';
import { test as hasFm } from 'std/front_matter/mod.ts';
import { extract as extractFm } from 'std/front_matter/any.ts';

type RecipeData = Pick<CookLang.Recipe, 'cookwares' | 'ingredients' | 'metadata' | 'steps'> & {
    instructions: Array<string[]>;
};

// Quick n dirty
const cookLangToMarkdown = (recipe: CookLang.Recipe): string => {
    const metadata = `${Object.entries(recipe.metadata).map(([k, v]) => `- ${k}: ${v}`).join('\n')}`;

    const ingredients = `${recipe.ingredients.map((i) => `- ${i.quantity} ${i.units} ${i.name}`).join('\n')}`;

    const cookwares = `${recipe.cookwares.map((i) => `- ${i.quantity} ${i.name}`).join('\n')}`;

    const instructions = recipeInstructionsOf(recipe).map((s) => `- ${s.join(' ')}`).join('\n');

    return `
# ${recipe.metadata.title || 'Unknown recipe'}

## Metadata

${metadata}

## Ingredients

${ingredients}

## Cookware

${cookwares}

## Instructions

${instructions}
`.trim();
};

export default function (): Lume.Plugin {
    return (site) => {
        site
            .filter('cook', (content) => {
                const recipe = new CookLang.Recipe(content);
                return cookLangToMarkdown(recipe);
            })
            // Load .cook files
            .loadPages(['.cook'], {
                loader: async (path): Promise<RawData & RecipeData> => {
                    const content = await Deno.readTextFile(path);

                    const recipeProps = (str: string): RecipeData => {
                        const recipe = new CookLang.Recipe(str);

                        return {
                            ...recipe,
                            ...recipe.metadata,
                            instructions: recipeInstructionsOf(recipe),
                        };
                    };

                    if (hasFm(content)) {
                        let { attrs, body } = extractFm<RawData>(content);
                        attrs ??= {};
                        attrs.content = body;

                        return {
                            ...recipeProps(body),
                            ...attrs,
                        };
                    }

                    return {
                        ...recipeProps(content),
                        content,
                    };
                },
            })
            // (Re-)generate raw .cook files
            .preprocess(['.cook'], (filtered, all) => {
                for (const page of filtered) {
                    const cookFile = Page.create({
                        basename: page.src.entry?.name,
                        url: page.outputPath.replace('/index.html', '.cook'),
                        content: page.data.content,
                    });

                    page.data.rawUrl = cookFile.data.url;

                    all.push(cookFile);
                }
            });
    };
}

const recipeInstructionsOf = (recipe: CookLang.Recipe) => {
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
