---
title: Building a small, functional reactive app architecture
slug: small-functional-reactive-app-architecture
date: '2019-09-09T20:01'
location: A kitchen table in Stockholm
excerpt: A long-ish read on how to build a web frontend with reactive functional streams (in Typescript!). We'll go through how we at Lookback extracted a library from patterns in our frontend, inspired by the library CycleJS.
keywords:
  - typescript
  - streams
  - react
  - frp
  - reactive
draft: true
---

At [Lookback](https://lookback.io), we've fallen in love with functional reactive programming with streams in our frontend apps. Together with the use of Typescript for compile time type safety, we've seen a tremendous bump in overall stability and fewer runtime bugs. Actually, I dare to say that _all_ of our bugs so far have been either logic (programmer) or timing errors.

That's why we've extracted the patterns we've been using in our frontend apps to a library we call **Frap** ("**F**unctional **R**eactive **Ap**p"). You can find it here:

<p class="tc">
  <a href="https://github.com/lookback/frap" class="btn">✨ lookback/frap on GitHub</a>
</p>

- 🔨 ~20 Kb minified.
- 📉 Has a single dependency (the `xstream` library).
- 🏄‍♂️ The core API consists of two functions.
- 🤝 Agnostic about the view, but assumes a stream based application.

## What this text is and what it's not

We'll look at how _easy_ it actually is to build these kind of frontend architectures on your own. Frap is, to be clear, _not_ any new or novel idea at all. As you will read below, it's essentially a rip off of a library called CycleJS, but less general and made to work with React as a view before CycleJS had proper React support.

What we'll go through is how one can reason about state, side effects, and drawing the view with the data structure streams. In the end, we have the complete library.

**⚠️ I'll assume knowledge about streams in this post.** The xstream library will be used for reactive streams, but the concepts are applicable to any streams implementation with the basic operations. I will also use Typescript features to model the architecture of Frap.

## Why?

For me personally, it was all about the _joy_ of constructing an architecture I could understand the smallest parts of, and then extracting it to make it general.

It felt good not using a 3rd party package (except for `xstream`…) to solve a thing.

## Credits

The main brain behind the architecture is my colleague [Martin](https://twitter.com/algstn). He was the drive behind the functional patterns as we pair programmed to build the architecture for Lookback's Live player. The extraction and polishing was made by myself.

## Background

We do make use of [CycleJS](https://cycle.js.org) in one of our web clients. CycleJS introduced the concept of cyclical streams and _drivers_ for side effects for us. Go ahead and read about all its features on the website. It was a bit daunting for me in the beginning to "think in cyclical streams", but a few months in I'm happier than ever building a single page client app.

I recommend reading these texts on streams and reactive programming:

- ["Streams" on CycleJS.org](https://cycle.js.org/streams.html)
- ["The introduction to Reactive Programming you've been missing"](https://gist.github.com/staltz/868e7e9bc2a7b8c1f754) by André Staltz, creator of xstream and CycleJS.
- ["Explicitly Comprehensible Functional Reactive Programming (pdf)"](https://futureofcoding.org/papers/comprehensible-frp/comprehensible-frp.pdf)

Have a look at the CycleJS documentation and guides. Then let's see why we decided to _not_ go with CycleJS for a new single page app.

### Differences in drawing a DOM

Out-of-the-box, CycleJS uses [Snabbdom](https://github.com/snabbdom/snabbdom) – a virtual DOM library – to build your app's HTML and insert into the browser. CycleJS supports [components](https://cycle.js.org/components.html), i.e. reusable functions that emit a DOM and take props.

A component in CycleJS/Snabbdom might look like this:

```typescript
import xs from 'xstream';
import { div, span, input } from '@cycle/dom';

function MyComponent(sources) {
  // Incoming DOM from the outside:
  const domSource = sources.DOM;

  // Stream of new text values from our <input> element
  const newValue$ = domSource
    .select('.input') // The <input> has class="input"
    .events('input') // Listen to `input` events
    .map((ev) => ev.target.value); // For each input, grab the `value`

  // Build a stream of state, which looks like:
  //  Stream<{ value: string }>
  const state$ = newValue$.map((value) => ({ value })).remember(); // Remember last value

  // Render out the UI from our state using Snabbdom. This is
  // a virtual DOM implementation, and we build the structure
  // using Hyperscript.
  const vdom$ = state$.map((state) =>
    div([
      span(state.value),
      input('.input', {
        attrs: { type: 'text' },
      }),
    ])
  );

  // Finally, return our DOM to the outside, along with the
  // values from our <input>
  return {
    DOM: vdom$,
    value: state$.map((state) => state.value),
  };
}
```

The DOM flows through the component as a _stream_. Compare this with a React component where you return the virtual DOM as a lump of JSX:

```tsx
import React, { useState } from 'react';

function MyComponent() {
  const [text, setText] = useState<string>('');

  return (
    <div>
      <span>{text}</span>
      <input
        type="text"
        defaultValue={text}
        onInput={(evt) => setText(evt.target.value)}
      />
    </div>
  );
}
```

The React component _probably_ looks more straight forward to most people than the CycleJS component, I imagine. It's because it's _imperative_. We use `setText` and perhaps `this.setState` in React components – a concept that doesn't exist in CycleJS's world. In CycleJS, something needs to "pull" the values through the streams through the component. Streams are, aptly, flowing through the whole app.

### Building our own

I think the Snabbdom way of building markup is interesting. It encourages me to think about my frontend code as functions even more (JSX sort of hides that away). For a rewrite of our Live player, we decided we wanted to use React for the view, instead of doing full CycleJS/Snabbdom again. This was before [@cycle/react](https://github.com/cyclejs/react) was released, so we set out to fully ditch CycleJS for this rewrite and figure out how to make business logic in streams play well with React for the view.

The choice of React for the view was partly due to some odd quirks in how CycleJS handles DOM events, and partly due to the nice React ecosystem. Typescript and React go perfect together too, making for robust view components.

In our new architecture, we wanted to keep these concepts from CycleJS:

- All business logic as reactive streams.
- Handling side effects in Drivers, making for a "pure" main application.

These things we wanted to get rid of:

- Replace the DOM-as-a-stream and Snabbdom rendering with React.

We also wanted to include these ideas:

- Storing the whole app state as a central atom and draw the whole user interface based on that.

Let's begin!

## State & data flow

How to manage state in frontend applications has turned out to be a hot topic. What is app state anyway? It might be:

- An ID string of the currently signed in user.
- An array of blog posts.
- A boolean indicating if a modal is open or not.
- An enum for the current state in a state machine.

And so on. The basic idea is that we should be able to **draw the whole interface from this state**. Sometimes, using local state in components is fine. This might be state such as the active tab in a tab system, which is very local, and _probably_ doesn't concern any other parts of the system.

Redux popularized the Flux architecture's idea of state as "single source of truth". We shouldn't scatter the state across DOM nodes, localStorage, the server, and so on. Also Elm and Om are great inspiration for state handling in client side apps. I encourage you to read the [philosophies and principles of Redux](https://redux.js.org/introduction/motivation).

A state atom might look like this:

```typescript
const state: State = {
  name: 'Johan Brook',
  showModal: true,
};
```

From this, we should be able to draw the full app component tree. And if we'd draw it again from the same state, the app's UI can't change fundamentally.

---

A core principle of functional programming is immutability – the inability to change a state after it's created. We'd like our app state to work the same. Meaning, we can't just "set a property in the state" like it's the Wild West. We need to update properties incrementally and generate a "new" state. For each of these state updates, the view should re-draw. "Re-draw on each state update?! Isn't that crazy expensive for the view?". Not if we trust the virtual DOM algorithms out there!

In order to update the `name` in our state, we can design the flow like this:

1. Construct your update to the state atom. In this case `{ name: 'John Doe' }`.
2. Send the update as a stream to a function which folds it together with the state stream:

```typescript
const state$ = stateUpdate$.fold(
  (prev, update) => ({ ...prev, ...update }),
  startState
);
```

The update effectively extends the existing state object to form a new one.

So we've got a `state$` variable containing the _stream of states_. The idea is to let the view listen to this `state$` stream, which will behave like this:

```
----------------- update: { name: 'Johnny Doe' }----
  stateUpdate$.fold(..., startState)
{ name: 'Johan Brook' }--{ name: 'Johnny Doe' }----- = state$
```

For each new element in the resulting `state$` stream, we'll re-render the whole app (read more below about how we'll manage the view).

So what are these state updates? It's ✨**your application** ✨! That's right: all business logic will either result in state updates or side effects (read more about that in the section about Drivers below).

This can be expressed roughly like this (with xstream):

```typescript
import { Stream } from 'xstream';

interface State {
  name: string;
  showModal: boolean;
}

// Our app just returns a new `name` instantly, but here
// we would render our entire app as React components or similar.
const app = (state$: Stream<State>) => {
  return state$.map((state) => ({
    name: 'Mary',
  }));
};

const run = (main: Main, startState: State) => {
  // Create an incrementally updated stream of state
  // XXX Fix stateUpdate$
  const state$ = stateUpdate$.fold(
    (prev, update) => ({ ...prev, ...update }),
    startState
  );

  // Main app function, renders UI from state$ stream
  main(state$);
};

// Kick off! 🚀
run(app, { name: 'Johan', showModal: false });
```

Sharp eyed readers notice that `stateUpdate$` is appearing out of nowhere. That's supposed to come from the app function, right?! Here's what the "cyclical" in CycleJS comes in: we need to cycle back the state updates from our app up to the `fold` operation. Luckily, the xstream library has an [`imitate`](http://staltz.github.io/xstream/#imitate) method on a stream which makes it possible to create a fake stream at the top of a function, run operations on it, and then let it imitate a "real" stream further down the file. This allows circular dependency of streams.

Let's fix our code:

```typescript/4-5,10,12-14/
import xs from 'xstream';

const run = (main: Main, startState: State) => {
  // Create "fake", empty update stream
  const fakeUpdates$ = xs.create();

  const state$ = stateUpdate$.fold(
    (prev, update) => ({ ...prev, ...update }),
    startState
  );

  const appUpdate$ = main(state$);

  // Imitate the real state update stream - results are
  // cycled back to the .fold operation above!
  fakeUpdates$.imitate(appUpdate$);

  return state$;
};
```

-> [Docs on `xs.create`](http://staltz.github.io/xstream/#create)

We've successfully achieved feeding our app with a stream of state, and made the output stream of the app update the state! 🎉 This creates a `main` function signature of:

```typescript
type Main = (state$: Stream<State>) => Stream<Partial<State>>;
```

**This `run` function is included in Frap for you.** Thus, state management is ticked off for you. You just need to provide the `main` function which is your whole app logic.

Takeaways:

- We update our state with updates via a stream.
- Our main app function _takes a state stream_ and _returns an update stream_.
- The state is thus incrementally updated.
- The view is re-rendered each time the state updates.

## Ch..ch..changes … (to the state)

Let's explore the `run` function from the earlier example (remember that `run` is exported by Frap, so it's not code you'd write yourself in your app).

```typescript
// run :: (Main, State) -> Stream<State>
import { run } from 'frap';

interface State {
  name: string;
}

const startState: State = {
  name: 'Johan',
};

// Our app's business logic, packaged in a single function.
// Receives state stream and should return a stream of updates
// to the state.
// app :: (Stream<State>) -> Stream<Partial<State>>
const app: Main = (state$: Stream<State>) => {
  const stateUpdate$ = xs.create();

  return stateUpdate$;
};

// Kick it off! 🚀
run(app, startState);
```

That `app` function is basically everything there is to it! (almost… we just need to sort out the view rendering and handle side effects). We receive state, do stuff deriving off of it, and return our preferred updates.

An example could be:

```typescript/2-5/
const app: Main = (state$: Stream<State>) => {
  const stateUpdate$: Stream<Partial<State>> = state$.map((state) => ({
    name: state.name.toUpperCase(),
  }));

  return stateUpdate$;
};
```

-> [Docs on `map`](http://staltz.github.io/xstream/#map)

This little app of ours would instantly update the `name` property in our state atom to uppercase:

```
--- { name: 'Johan' } ---
  app()
--- { name: 'JOHAN' } ---
```

Now, this seems silly and simplistic. I thought so too. "How can I ever achieve complex app logic with this?!". Turns out you can. By using the stream operators of xstream on your data, you really _can_ achieve crazy things. It all adds up. For me, it was all about separating the big state down into small functions taking care of "their" domain, and then merging it all together:

```typescript
// Functions we've written to take care of stuff in our data model.
// We don't care how they do it – as long as their return a stream
// of state updates.
import { nameUpdate, posts } from './lib';

const app: Main = (state$: Stream<State>) => {
  const nameUpdate$ = nameUpdate(state$);
  const postsUpdate$ = posts(state$);

  // All derived state updates off of existing state
  return xs.merge(nameUpdate$, postsUpdate$);
};
```

-> [Docs on `xs.merge`](http://staltz.github.io/xstream/#merge)

One important aspect here is the _cyclical_ aspect of our app architecture. Notice how the state stream is constantly giving us new state as elements in the stream. Our `app` function is merely a transformer along the way, returning state updates as sinks and receives the new state as source:

```
------a---ax---ax------
  app() # Transforms the source stream
------ax--ax---axy-----
```

Once you're used to "thinking in cycles", it creates quite a nice way of programming even complex apps, since the pattern is very scalable. You'll be thinking in "inputs and outputs", and solely how you will transform the inputs to a given output.

But derived state ain't no fun. In a real app, we've got lots of inputs! Mouse clicks from the user, async calls coming back from web APIs – a myriad of things that should update our state. Let's investigate the former!

## Sending -> Messages

Any app must deal with user input. Button clicks, text fields, forms, and so on. As our app architecture looks so far, there's only derived state updates. Meaning, we only transform the state we have already.

**We need to construct a way to let the view pass messages to our app function.**

We haven't looked at the view yet, but remember it's **outside** our pure, cozy, functional world inside of our app function. In the app function, we solely deal with functional streams which we apply `map`, `filter` and other operations on.

When I say _messages_, I refer to something like _signals_ or _events_ that are emitted from the UI element the user interacted with. We need two things in these messages:

1. An identifier in order to distinguish between different kinds of messages.
2. An optional payload with data attached to the message.

Let's see how we can get those messages into our app function!

We've modelled data as streams so far, so why not continue on that track. Imagine a `view$` stream which is a stream of _all_ different kinds of messages – user input – coming from the view.

I imagine this flow being something like this:

<figure id="view-model">
  <img width="413" alt="Messages flow" src="{{ 'frap-messages.png' | postAssetUrl }}" />
  <figcaption>Simplified flow diagram.</figcaption>
</figure>

How does a message look like then? Perhaps like this:

```typescript
interface ToggleModal {
  kind: 'toggle_modal';
  modalName: 'surveyModal' | 'loginModal';
  open: boolean;
}

interface SetPerson {
  kind: 'set_person';
  person: {
    name: string;
    age: number;
  };
}

type View = ToggleModal | SetPerson;
```

The last `View` type forms the union type which our messages stream consists of: `Stream<View>`. Let's investigate how this fits into our app architecture.

We've got our `app` function which produces state updates and receives state from `run`. The latter can be modified to accept a stream of view messages:

```typescript
import xs from 'xstream';

const run = <View>(main: Main, view$: Stream<View>, startState: State) => {
  const fakeUpdates$ = xs.create();

  const state$ = stateUpdate$.fold(
    (prev, update) => ({ ...prev, ...update }),
    startState
  );

  const appUpdate$ = main(state$, view$);

  fakeUpdates$.imitate(appUpdate$);

  return state$;
};
```

I've introduced a generic type `View` in the `run` function. Let's start our app:

```typescript
// run :: (Main, Stream<V>, State) -> Stream<State>
import { run } from 'frap';

export interface State {
  name: string;
}

export const startState: State = {
  name: 'Johan',
};

interface SetName {
  kind: 'set_name';
  name: string;
}

export type View = SetName;

const app: Main = (state$: Stream<State>, view$: Stream<View>) => {
  const stateUpdate$ = view$
    // Only filter on the `SetName` type of messages
    .filter((m): m is SetName => !!m.kind && m.kind === 'set_name')
    // Set a new name by mapping the payload from the message to a state update
    .map((m) => ({
      name: m.name,
    }));

  return xs.merge(stateUpdate$);
};

// TODO Build view and construct messages stream
const view$ = xs.create<View>();

// Kick it off! 🚀
run(app, view$, startState);
```

Now, _imagine_ that the `view$` stream is working. Imagine that for every time a user is submitting a form text field with some text, the view will construct the `SetName` message object and put it on the view stream. This view stream can flow through our app's business logic as a regular function parameter, and we can `filter` to get specific messages and then `map` them to do state updates.

This makes the separation between view and business logic pretty clear – which is a good thing! We can test our app in isolation by feeding mocked messages into the view stream and asserting the resulting state without having to mount the view. The view's actions don't have to be side effects, as it's often regarded to be in other app setups.

---

So far, we've stayed inside or pure, functional domain of streams. The next section will go through the elephant in the room.

## A View to a ~~kill~~ Stream

We begin with this simple but beautiful idea:

> ui = view(state)

_The View is a function of state, producing User Interface._

This idea isn't new of course: it exists in various shapes and philosophies, such as MVC, MVVM, MVI, and so on. The concept of having a view that listens to state is a baseline in many design patterns.

**Q:** But how do we do this in Frap? Where we have a single stream of state?

**A:** We rely on a virtual DOM!

This means, we re-render our whole component tree on each new state update. This feels terribly expensive and weird, but we must simply rely on that our virtual DOM implementation will calculate the smallest diff in the real DOM and apply that. The whole design idea behind React is built on this principle: to rely on the virtual DOM.

As you saw above in the code samples at the top, UI components in CycleJS use streams as first class citizens. The components are really just functions which accepts input streams and return output streams. A common lingo in the streams world is _Sources_ and _Sinks_ to signify the input and outputs. Thanks to this property of CycleJS, components can receive a stream of values ("props" in React world) and return a stream of virtual DOM nodes and a stream of new values, emitted from the component. React works differently. React components _must_ return JSX (or a virtual DOM node, however you choose to write it). So we just can't make React components return a stream of JSX and expect things to work, of course.

Have a look at the <a href="#view-model">view figure</a> again. We see that the view should accept a state stream and "return" a messages stream (I say "return" within quotes since it's not really gonna return the stream).

But how do we draw a whole React app from a stream? We can't return a stream of virtual DOM nodes here?

**We must open up the state stream somehow and let it drive the rendering of the top level component.**

(This means the React app will re-render on each state update. _Again, this is fine_. Does the app feel slow? Profile with React's dev tools, as [this tweet](https://twitter.com/ryanflorence/status/1126734015950536706) advises).

In most stream libraries, there's a method called `subscribe` which you can use on a stream. In xstream, it adds a listener on a stream and returns a subscription that can be used to remove that listener (read the [docs](http://staltz.github.io/xstream/#subscribe)). We can use that to subscribe to state updates, and then unsubscribe when our app unmounts.

In the `next` callback of `subscribe`, we'll receive each new element in the stream (we can also catch errors in `error`). We use `next` to set the state of the React component at top level. From then on, we'll let React figure out how to draw the DOM based on that very state. For each new state update, `next` will be called, and React will re-render the tree. Incremental, immutable state.

Here's the function signature of `run`:

```typescript
type Run = (Main, view$: Stream<View>, startState: State) => Stream<State>;
```

Before, we've just called `run` for funsies without really thinking too much about where and how we'll handle it's output stream. I can reveal to you now that the function should ideally be called when your top level React component mounts.

```tsx
import React from 'react';
import { Stream, Subscription } from 'xstream';
import { run } from 'frap';

// Imported from our main file
import { app, State, View, startState } from './main.ts';

/** The state of our React component */
interface AppState {
  state$: Stream<State>;
  /** This holds our "real" app state – ready to render! */
  appState: State;
}

type Send = (event: View) => void;

class App extends React.Component<any, AppState> {
  /** Instance variable holding the subscription to the state stream. */
  sub: Subscription;

  /** Instance function used to drive messages into the view stream. */
  send: Send | null = null;

  constructor(props) {
    super(props);

    // Stream of input from the views.
    const view$ = xs.create<View>();

    // Create our "send" function which will drive messages on to
    // the view stream above.
    this.send = (v: View) => {
      view$.shamefullySendNext(v);
    };

    // Kick everything off! 🚀
    const state$ = run(app, view$, startState);

    // Attach on component's local state so we an access it
    // in life cycle methods
    this.state = {
      state$,
      appState: startState,
    };
  }

  componentDidMount(): void {
    // Start subscribing to incoming state and set the local
    // state of our React component. Will trigger re-render.
    this.sub = this.state.state$.subscribe({
      next: (appState) => {
        this.setState({ appState });
      },
      error: (err) => {
        console.error(err);
      },
    });
  }

  componentWillUnmount(): void {
    // Unsubscribe from state subscription:
    this.sub.unsubscribe();
  }

  render(): React.ReactNode {
    const { appState } = this.state;

    // Render the 'name' state and a button to change it.
    return (
      <div>
        <h1>Hi {appState.name}!</h1>

        <button
          onClick={() =>
            this.send({
              kind: 'set_name',
              name: 'Johnny Doe',
            })
          }
        >
          Set another name
        </button>
      </div>
    );
  }
}
```

(The class approach is a bit verbose, but React Hooks is still a new concept which is outside the scope of this post. Here's a [GitHub Gist](https://gist.github.com/brookback/d98efdfb4a3087dbba767910f2eec2f3) including a Hooks version).

Notice how we:

1. Create a `view$` stream in the constructor and pass it to `run`.
2. Create a `send` function on the app component which can be used from view event handlers to send messages.
3. Subscribe to state updates when mounted.
4. Render the state in `render()`.

The main fishy thing here might be the `shamefullySendNext` method in `send`. As from the [docs](http://staltz.github.io/xstream/#shamefullySendNext), this method forces a new value to be emitted to the stream. This is the one of the two "bridges" between our functional app world and the imperative view (the `subscribe()` call being the other one).

Phew. Lots of code and concepts. In this section, we've:

- seen how to add the view layer (here React) to our app architecture.
- how to pass actual messages from the view.
- render a React component from our state.

There's one thing missing still. Where are all the async API calls, browser API functions, and logging utilities?

Yes: where are the _side effects_?

## Side effects 💀

In any non-trivial application, there _will_ be side effects. Side effects in this case refer to things similar to:

- Fetching JSON from an API server
- Using Chrome's media APIs to gain access to the web camera

The common denominator is that drivers include _imperative code_. Code that isn't functional streams. Code that affect the outside world. Code that is non-pure.

I recommend reading the _Drivers_ section on [CycleJS's page](https://cycle.js.org/drivers.html), since we stole the concept of Drivers from there. There are many good examples there as well.

Once you've done that, return back here.

---

We're gonna use the exact same concept of drivers in Frap. Drivers receive _Sinks_ and return _Sources_. This is in contrast to our main app function, which receives _Sources_ and returns _Sinks_.

The flow diagram thus becomes:

<figure id="view-model">
  <img width="624" alt="Driver flow" src="{{ 'frap-driver-flow.png' | postAssetUrl }}" />
  <figcaption>App architecture with drivers and view.</figcaption>
</figure>

Let's nail down our Sources and Sinks here.

- **To our `app` function,** Sources are all input sources it needs to do its job. View messages, driver input, the state stream. Sinks are output instructions to drivers and state updates.
- **To the drivers,** Sources are the output instructions (as a stream) from `app()`. Sinks can be anything.

The `run()` function from Frap takes care of glueing all of this together.

We communicate with the drivers with a single _out_ stream with messages. A driver can thus look like:

**Driver**

```typescript
// ConsoleLogDriver.ts
import { Stream } from 'xstream';

interface DoLog {
  kind: 'do_log';
  label: string;
  args?: any[];
}

export type ConsoleOut = DoLog;

/** A logging driver that consumes log messages and
 * only performs writes to the console.
 */
const ConsoleLogDriver = (out$: Stream<ConsoleOut>) => {
  out$
    .filter((m): m is DoLog => !!m.kind && m.kind === 'do_log')
    .addListener((m) => console.log(m.label, ...m.args));
};

export default ConsoleLogDriver;
```

As you see, a driver is 🌈Just A Function 🌈.

This particular example of a driver only consumes sinks but doesn't return any sources back to our `app()` function.

How do we hook up this driver? We need to modify the `run` function!

**Run**

```typescript
import xs from 'xstream';

interface Sources<V> {
  view$: Stream<V>;
  drivers?: {
    [key: string]: (s: Stream<any>) => void | Stream<any>;
  };
}

const run = <V>(main: Main, sources: Sources, startState: State) => {
  const { view$, drivers } = sources;

  const fakeUpdates$ = xs.create();
  const fakeDriverOuts = createFakeDriverOut(drivers);

  const state$ = stateUpdate$.fold((prev, update) =>
    ({ ...prev, ...update }), startState);

  // The sources to our app: state, messages, and driver input
  const mainSources = {
    state$,
    view$,
    ...callDrivers(drivers, fakeDriverOuts),
  }

  const { stateUpdate$, ...driverSinks } = main(mainSources);

  fakeUpdates$.imitate(stateUpdate$);

  for (const name in fakeDriverOuts) {
    const fake$ = fakeDriverOuts[name];
    const driverOut$ = driverSinks[name];

    fake$.imitate(driverOut$));
  }

  return state$;
};
```

This might look a bit hairy. I've left out the implementation of two functions here:

- `createFakeDriverOut`. Similarily to the state updates, we need to have a cyclic relationship between the drivers' sinks and sources and the main app function. In this function, we create a fake stream for each driver specified.
- `callDrivers`. We call all the driver functions with the fake outputs and feed the drivers' returned output as sources to our main app function.

**Main app**

```typescript
// main.ts
import { run } from 'frap';
import { ConsoleOut } from './ConsoleLogDriver.ts';

export interface State {
  name: string;
}

export const startState: State = {
  name: 'Johan',
};

interface SetName {
  kind: 'set_name';
  name: string;
}

export type View = SetName;

interface MainSources {
  view$: Stream<View>;
  state$: Stream<State>;
}

interface MainSinks {
  stateUpdate$: Stream<Partial<State>>;
  console: Stream<ConsoleOut>;
}

const app: Main = (sources: MainSources): MainSinks => {

  // Access driver sources with:
  //   sources.myDriver.*

  const stateUpdate$ = /* updates to state */;

  // Send log message to log driver every second:
  const logDriverOut$ = xs
    .periodic(1000)
    .mapTo({
      kind: 'do_log',
      label: 'Hello!',
    }):

  // Return sinks
  return {
    // State updates as usual
    stateUpdate$,
    // Output instructions to the console driver. The key
    // needs to match the name of the driver specified in
    // the `drivers` argument to `run` below.
    console: logDriverOut$,
  };
};
```

**View**

```typescript
import ConsoleLogDriver from './ConsoleLogDriver.ts';

// In the react view, run our app:
run(
  app,
  {
    view$,
    drivers: {
      // ... with the console log driver function
      console: ConsoleLogDriver,
    },
  },
  startState
);
```

---

That's it! Now we can handle all side effects in their special drivers, where they can do all kinds of reads and writes with the external world, and safely pass back their results as sources ("input") to our app.

## Parting words

We're approaching the end of the background of Frap. I might've breezed over some concepts and I might've done a terrible job trying to convey the flows. If that's the case, please let me know at [johan@johanbrook.com](mailto:johan@johanbrook.com) or at [@johanbrook](https://twitter.com/johanbrook).

A huge shoutout to the creators of CycleJS. We've been inspired by them in just about everything. Thanks for popularising the ideas of cyclical data flows!

---

What I love about this architecture we've just built are these things:

- Reasoning in reactive streams! 😍 Forget about mutability and writing imperative code. Say hello to declarative code and "tight" business logic.
- How well it goes along with React's virtual DOM nature.
- How the architecture is flexible enough to allow for all varieties of organising your app, still being strict with what types you pass around.
- How well it scales. Almost every new feature you'll add to your app will be written in the same style.
- How safe I feel when everything from the library layer (Frap) to the view layer (React) is handled with a type system (Typescript).

Please go ahead and read the full API and documentation on the Frap GitHub page:

<p class="tc">
  <a href="https://github.com/lookback/frap" class="btn">lookback/frap</a>
</p>

<p class="tc">
  <strong>Thank you so much for reading ✨</strong>
</p>
