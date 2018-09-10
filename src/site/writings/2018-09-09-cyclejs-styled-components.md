---
title: Styled components in a virtual DOM
slug: styled-components-vdom
date: '2018-09-09T16:31'
excerpt: Learn how to create re-usable styled components in a virtual DOM. This post describes how one can use functional CSS (small, atomical classes) together with a higher order component and create pre-styled components.
keywords:
  - cyclejs
  - virtual dom
  - typescript
  - components
  - css
  - styled components
  - functional css
---

**At Lookback, we've recently tried out using CycleJS** for a web client code base. [CycleJS][1] is all about _cyclic reactive functional streams_ and promises nice separation of concerns by separating out side effects and handling of external APIs into something called _Drivers_. It uses a virtual DOM, like React, to translate app state to user interface. Add a dash of TypeScript, and you've got a really nice and tight web frontend setup.

My interest for both frontend architecture and design systems made me see an opportunity to create styled components for for re-use in the virtual DOM. The idea is to construct small, re-usable components to use instead of marking up content with the regular approach of using CSS classes. The key in our approach here isn't inline CSS embedded on the component, but about applying _functional CSS_ classes.

I once held a pretty strong opinion that one should separate markup and styling of a web page. That works out pretty good for web content with document style content – just like all the early web pages were. When building complex information architectures in ever changing web apps, where the cascading part of CSS just gets in your way, I've turned to investigate this functional CSS class approach instead. There's writing on this philosophy elsewhere: I really recommend reading [Jon Gold's article][2] on the subject, as well as checking out the [Tachyons CSS library][3] (I've based Lookback's internal functional CSS library off Tachyons' structure).

## A primer on functional CSS

Let's say we've got these CSS rules:

```scss
// headings.scss

h1 {
  margin-bottom: $spacing-base;
}

// modals.scss

.modal {
  h1 {
    margin-bottom: $spacing-base / 3;
  }

  form {
    text-align: center;
  }
}
```

And here we've got the markup for modal content (here the scenario of creating a new project inside of a generic web app):

```html
<div class="modal">
  <h1>New Project</h1>

  <form>
    <input name="project-name" placeholder="Project name">
    <input type="submit" value="Create">
  </form>
</div>
```

This will make all H1 headings in all modals have tighter bottom margin, and make all forms in all modals have centered content. This is probably fine to start off with. But what if I'd like to have more margin on a H1 heading in one certain modal?

I'd either:

1. Introduce another namespace on that modal, perhaps `.modal-some-name` and apply more margin on all `h1` elements in that namespace.
2. Introduce a new class name on those `h1` elements that need more margin, and apply it from CSS.

Both of these solutions tightens the coupling between the markup and CSS, and forever creates a dependency from the former on the latter. Meaning, during iterating on the product, I as a frontend developer will be forced to go back and forth between the markup and CSS when requirements change, features are added, and view hiearchies are refactored. In my experience, there's _very few_ changes in the markup that also don't require adjustments in the CSS – even for extremely well engineered frontends.

**Enter functional CSS.**

Using functional CSS is to depart from the classical thought of _"No styling in the markup"_. We're not embedding inline styles _per se_, but we're applying styling information that does not make any semantic sense from a markup perspective.

This is the above example refactored to use functional CSS classes:

```scss
// headings.scss

h1 {
  margin-bottom: $spacing-base;
}

// spacing.scss

.mb0 {
  margin-bottom: 0;
}

.mb1 {
  margin-bottom: $spacing-small;
}

// ...

// text-align.scss

.tc {
  text-align: center;
}
.tl {
  text-align: left;
}
.tr {
  text-align: right;
}
```

```html
<div class="modal">
  <h1 class="mb0">New Project</h1>

  <form class="tl">
    ...
  </form>
</div>
```

Note how the classes form a sort of domain specific language in describing which style rule or rules that are applied. With functional CSS, I'm free to combine styles on elements by composition, as well as deviate from common styling wherever I need to. I can use a `.f1` class to denote the largest font size, and bind it to a Sass variable:

```scss
// typography.scss
.f1 {
  font-size: $font-size-1;
}
```

So if I need to change font sizes all over the the web app, it's still easy since we haven't embedded any inline CSS – just engineering everything with classes and variables.

## Components with functional CSS in a virtual DOM

Back to the components part. During the development of said web client, I identified common patterns from the design mockups. It could be a certain style for a form label or heading. They were present frequently enough that warranted some kind of Don't Repeat Yourself strategy, but still not important enough for custom rules in the stylesheet.

Two aspects in this setup are quite crucial:

1. Thanks to a very important part of functional CSS – _composition_ – we can put together several styles into one, without having the need to create a new CSS component for it.
2. The programmatic nature of virtual DOMs. Markup in the virtual DOMs of React and CycleJS are really just function calls, with the signature `(selector, props, children)`.

Let's talk more about each one real quick:

### Composition

Thanks to minimal functional CSS classes, we can do things like this:

```html
<label class=".f7.tracked.c-muted.mb1.b">Foo</label>
```

This kind of cryptic class name string translates to:

- `f7`- Font size of level 7 (smallest)
- `tracked`- Smallest letter spacing
- `c-muted`- Muted colour
- `mb1`- Bottom margin of level 1
- `b`- Bold font weight

All these properties together make up a re-usable style stack.

### Markup as functions

The virtual DOM in CycleJS is called [Snabbdom][4]. In CycleJS, it looks like this:

```ts
import { div, h1, p, strong } from '@cycle/dom';

/*
This becomes:

  <div>
    <h1 id="myId" class="my-heading some-other-class">Hello world</h1>
    <p><strong>This is bolder text</strong> followed by a regular text node.</p>
  </div>
*/
const vdom = div([
  h1('#myId.my-heading.some-other-class', 'Hello world'),
  p([
    strong('This is bolder text'),
    'followed by a regular text node.'
  ]);
]);
```

The `div`, `h1`, `p`, and `strong` functions are helpers from the DOM lib of CycleJS. They follow the signature `(selector?, props?, children?)`. The `selector` parameter is a CSS style selector string, which is used to apply IDs and class names.

This way of building user interfaces was tedious at first for a seasoned HTML coder, but after a while, treating DOM elements like functions became fluid. Not being held back by some stupid constraints of the templating library you're using, you can use all your Javascript skills to construct components.

## Reusable components

I thought to myself, _"If styling with functional CSS is only about applying small, atomic classes, and classes in Snabbdom is just a selector string, I could store the classes a strings somewhere and just import them and use them in the VDOM"_.

### Take One

This became my first iteration:

```ts
// styles.ts

// Keep shared styles in this dict.
export const Styles = {
  SmallFormLabel: '.f7.ttu.comp-blue-f.mb1',

  TopHeading: '.lh-title.mb4',
};
```

```ts
// SomeComponent.ts
import { h1, label, form, input } from '@cycle/dom';
import { Styles } from './styles';

export default function SomeComponent(props) {
  const vdom = form([
    h1(Styles.TopHeading, 'My Form'),
    label(Styles.SmallFormLabel, { for: 'name' }, 'Label'),
    input({ type: 'text', id: 'name', placeholder: 'Name' }),
  ]);

  return vdom;
}
```

This makes it possible to control the exact appearance of a `SmallFormLabel` from within the `styles.ts` file. Change there – change everywhere!

### Take Two

This was quite fine, but still didn't feel component-y enough. What about extensibility? If I wanted to apply more styles to a `TopHeading`, I'd have to do an ES6 style string literal `${Styles.TopHeading}.more-classes` and apply as selector. Not that elegant, and a lot to type.

Since VDOM elements are functions, we can implement a backing function which _enhances_ a VDOM element with a given selector, and returns the element ready to be used.

The signature would look like:

```ts
function enhanceWithStyle(domTag: DomTag, classes: Selector): DomTag;
```

where we've got the types:

```ts
type Selector = string;
// This is the signature for a Snabbdom helper, like h1(), p(), etc.
type DomTag = (sel?: Selector | any, ...args: any[]) => VNode;
```

Let's enhance!

```ts
// styles.ts
import { label, h1 } from '@cycle/dom';

const Styles = {
  SmallFormLabel: '.f7.ttu.comp-blue-f.mb1',

  TopHeading: '.lh-title.mb4',
};

export const SmallFormLabel = enhanceWithStyle(label, Styles.SmallFormLabel);

export const TopHeading = enhanceWithStyle(h1, Styles.TopHeading);
```

```ts
// SomeComponent.ts
import { form, input } from '@cycle/dom';
import { SmallFormLabel, TopHeading } from './styles';

export default function SomeComponent(props) {
  const vdom = form([
    TopHeading('.some-other-class', 'My Form'),
    SmallFormLabel({ for: 'name' }, 'Label'),
    input({ type: 'text', id: 'name', placeholder: 'Name' }),
  ]);

  return vdom;
}
```

Voíla! We can use our custom components just like any other, since it uses the signature `(selector?, props?, children?)`. Composable and re-usable.

### Implementation

The implementation for the enhance function is:

```ts
// styles.ts
import { VNode } from '@cycle/dom';

// specific type for selectors
export type Selector = string;

// This is the signature for a Snabbdom helper, which we need to also
// export if we use it ...
export type DomTag = (sel?: Selector | any, ...args: any[]) => VNode;

const isSelector = (str?: string): str is Selector =>
  typeof str === 'string' &&
  str.length > 1 && // A selector with only a dot doesn't make sense. Require > 1 chars
  str[0] === '.'; // Starts with a dot, like '.className'

export const concatSelectors = (...ss: Selector[]): Selector =>
  ss.filter(isSelector).join('');

/**
 * Enhance an existing Snabbdom helper with a set of style classes,
 * in order to DRY things up.
 *
 * Example:
 *
 *    import { enhanceWithStyle } from './libs/styles';
 *
 *    // Enhance the label component from Snabbdom:
 *    const SmallLabel = enhanceWithStyle(label, '.some-class.another');
 *
 *    // Use in the DOM:
 *    SmallLabel('.more-classes', 'My Label');
 */
export const enhanceWithStyle = (domTag: DomTag, classes: Selector): DomTag => (
  sel: any,
  ...args
) => {
  const tagArgsToPass = isSelector(sel)
    ? [
        // Apply our classes, and append any custom selector passed, if it's a string.
        concatSelectors(classes, sel),
        ...args,
      ]
    : [
        classes,
        sel, // sel isn't a selector here, treat it as an any argument to the Hyperscript helper
        ...args,
      ];

  return domTag(...tagArgsToPass);
};
```

## Conclusion

What I like with this approach is the simplicity: many people understand the concept of composition. I'm sure this kind of enhancement functions exist for React and other virtual DOMs, but this really is something you can hack together on your own, since it's "just" functions!

What we've achieved is:

- **Re-usability** of styles in the shape of small VDOM helpers.
- **Isolation** of CSS styling into the `.css` file – not the app logic.
- **Composition** of style rules without having to deal with cascade headaches.

Thanks for reading!

[1]: https://github.com/cyclejs/cyclejs
[2]: https://jon.gold/2015/07/functional-css/
[3]: https://tachyons.io/
[4]: https://github.com/snabbdom/snabbdom
