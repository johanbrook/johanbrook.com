---
title: Using streams in React with Hooks
slug: react-hooks-streams
date: 2019-03-03
location: A kitchen table in Stockholm
excerpt: Pairing React Hooks with Streams works beautifully, and leads to components with less verbosity and boilerplate. In this post, I convert a class component to a function component using hooks.
tags:
    - dev
    - javascript
---

**As of React 16.8,** there's a new tool in the toolbox:
[Hooks](https://reactjs.org/docs/hooks-intro.html). Hooks are used in functional React components,
extending their functionality to include state and side effects.

I recommend reading
[this article](https://overreacted.io/making-setinterval-declarative-with-react-hooks/) by Dan
Abramov for a deeper understanding of hooks. It shows how the coding style moves away from
imperative class code to declarative code.

I realised the beauty of hooks in user interface components when creating a component which shows
the current time in a recording. We've recently started using Functional Reactive Streams for the
frontend at Lookback (specifically, we're using the [xstream](http://staltz.github.io/xstream/)
library, but the concepts are similar in other libraries). Explaining the concept with streams is
out of scope in this post, but the gist is that you manage state as immutable streams of values.
[This post](https://gist.github.com/staltz/868e7e9bc2a7b8c1f754) is a nice intro to streams/reactive
programming.

Streams actually play well with React. It's _basically_, on a conceptual level, all about doing a
`.map` on a stream of values and draw the React virtual DOM based on the values. But React
components must either have a `render()` function which return JSX, or be a function which returns
JSX. How do we render our current time from a stream?

An intuitive approach of mine would be:

```tsx
import React from 'react';
import { Stream } from 'xstream';

interface Props {
    currentTime$: Stream<number>;
}

// This won't work: our component can't return a Stream!
const CurrentTime = (props: Props) => props.currentTime$.map((time) => <time>{time}</time>);
```

We can't return a stream from a React component – it must somehow devour the stream and return JSX.

## The class(ical) approach

So we need to take a more verbose approach:

1. Subscribe to the stream in a class component.
2. For each new value, set the local state to the value.
3. Render based on local state.
4. Tear down the subscription on unmount.

Very well then:

```tsx
import React from 'react';
import { Stream, Subscription } from 'xstream';
import formatTime from './libs/format-time';

interface Props {
    currentTime$: Stream<number>;
}

interface State {
    timeInSeconds: number;
}

export default class TimeCounter extends React.PureComponent<Props, State> {
    sub?: Subscription;

    constructor(props: Props) {
        super(props);

        this.state = {
            timeInSeconds: 0,
        };
    }

    componentDidMount(): void {
        this.sub = this.props.currentTime$.subscribe({
            next: (time) => {
                this.setState({ timeInSeconds: time });
            },
        });
    }

    componentWillUnmount(): void {
        this.sub && this.sub.unsubscribe();
    }

    render(): React.ReactNode {
        const { timeInSeconds } = this.state;

        // Renders something like: "00:10"
        return <time>{formatTime(timeInSeconds)}</time>;
    }
}
```

This totally works, but yeah... Very verbose and imperative. Hooks to the rescue!

## The Hook approach

Let's follow the intro to Hooks from the React website, and convert our class to a function:

```tsx
import React, { useEffect, useState } from 'react';
import { Stream } from 'xstream';
import formatTime from './libs/format-time';

interface Props {
    currentTime$: Stream<number>;
}

const TimeCounter = (props: Props) => {
    // Create a state hook for our time state, with initial state of zero:
    const [current, setCurrent] = useState<number>(0);

    useEffect(() => {
        // On component mount, set up a side effect that subscribes to
        // the stream, and let `setCurrent` be called for new values:
        const sub = props.currentTime$.subscribe({
            next: setCurrent,
        });

        // Unsubscribe on component tear down:
        return () => sub.unsubscribe();
    });

    // Render our current time state as the returned JSX!
    return <time>{formatDuration(currentTime)}</time>;
};

// Elsewhere, render as usual:
<TimeCounter currentTime$={myStreamOfNumbers$} />;
```

- We call `useEffect` to set up a subscription on the incoming stream.
  [Read more](https://reactjs.org/docs/hooks-effect.html) about the effect hook.
- We call `useState` with an inital value and receive back a tuple of the current value and a
  setter. [Read more](https://reactjs.org/docs/hooks-state.html) about the state hook.

So minimal, still readable. Even _more_ readable than the class version, I think.

## Extracting our hook

Since Hooks are _just functions_, we can extract common functional patterns into our own hooks and
use them in other components. I found myself writing another component which also subscribed to an
incoming stream and rendered its values. What a candidate for extraction into a hook!

If we analyse the component above, we see that `useState` and `useEffect` are going to work roughly,
if not exactly, the same for any other component. Only the types in the incoming stream differ. Here
we use the type `number`, but we can make our new Hook generic thanks to TypeScript's generics.

I came up with this:

```ts
// use-stream.ts
import { useEffect, useState } from 'react';
import { Stream } from 'xstream';

const useStream = <T>(stream$: Stream<T>, initialState: T | null = null) => {
    const [current, setCurrent] = useState<T>(initialState);

    useEffect(() => {
        const sub = stream$.subscribe({
            next: setCurrent,
        });

        return () => sub.unsubscribe();
    });

    // Just return our current value, since that's the thing we're interested in
    // (to render) when using this hook:
    return current;
};

export default useStream;
```

We've just made our own `useStream` hook by composing `useEffect` and `useState`!

The hook can be used like this:

```tsx
import React from 'react';
import { Stream } from 'xstream';
import { formatDuration } from './libs/format-time';
import useStream from './hooks/use-stream';

interface Props {
    currentTime$: Stream<number>;
}

const CurrentTimeCounter = (props: Props) => {
    const currentTime: number = useStream<number>(props.currentTime$, 0);

    return <time>{formatDuration(currentTime)}</time>;
};
```

And at last, there is beauty.
