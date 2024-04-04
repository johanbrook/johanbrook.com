import { Page, RawData } from 'lume/core/file.ts';
import * as CookLang from 'cooklang';
import { test as hasFm } from 'std/front_matter/mod.ts';
import { extract as extractFm } from 'std/front_matter/any.ts';

type RecipeData = Pick<CookLang.Recipe, 'cookwares' | 'ingredients' | 'metadata' | 'steps'> & {
    instructions: Array<string[]>;
};

class CookLangEngine implements Lume.Engine {
    render(content: string) {
        return this.renderComponent(content);
    }

    renderComponent(content: string) {
        const recipe = new CookLang.Recipe(content);
        return renderRecipe(recipe);
    }

    deleteCache(): void {}
    addHelper(): void {}
}

// Quick n dirty: cook -> HTML
const renderRecipe = (recipe: CookLang.Recipe): string => {
    const metadata = Object.entries(recipe.metadata).map(([k, v]) => `<li>${k}: ${v}</li>`).join('\n').trim();

    const ingredients = recipe.ingredients.map((i) => `<li>${i.quantity} ${i.units} ${i.name}</li>`).join('\n').trim();

    const cookwares = recipe.cookwares.map((i) => `<li>${i.quantity} ${i.name}</li>`).join('\n');

    const instructions = recipeInstructionsOf(recipe).map((s) => `<li>${s.join('')}</li>`)
        .join(
            '\n',
        );

    return `${
        ingredients
            ? `
<h2>Ingredients</h2>

<section class="recipe-ingredients">
    <ul>
    ${ingredients}
    </ul>
</section>
`
            : ''
    }

${
        cookwares
            ? `
<section class="recipe-cookwares">
    <h2>Cookware</h2>

    <ul>
    ${cookwares}
    </ul>
</section>
`
            : ''
    }

<section class="recipe-instructions">
    <h2>Instructions</h2>

    <ol>
    ${instructions}
    </ol>
</section>
${
        metadata
            ? `
<section class="recipe-metadata">
    <h3>Metadata</h3>
    <ul>
    ${metadata}
    </ul>
</section>
`
            : ''
    }

`.trim();
};

export default function (): Lume.Plugin {
    return (site) => {
        site
            .filter('cook', (content) => {
                const recipe = new CookLang.Recipe(content);
                return renderRecipe(recipe);
            })
            // Load .cook files
            .loadPages(['.cook'], {
                engine: new CookLangEngine(),

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
