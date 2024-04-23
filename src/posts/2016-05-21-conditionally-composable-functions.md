---
title: 'Conditionally Composable Functions'
date: 2016-05-21
tags:
    - dev
slug: conditionally-composable-functions
---

I write a lot of Javascript at [work](http://lookback.io), mostly in the Meteor framework. Our web
app use a client side router, and we had this helper function for fetching a team from a slug in the
route URL.

It looked something like this:

```js
function getTeam() {
    let team;

    team = Teams.findOne({ slug: FlowRouter.getParam('slug') });

    if (!team) {
        const rec = RouterHelpers.getRecording();
        team = rec && Teams.findOne(rec.teamId);
    }

    if (!team) {
        const test = RouterHelpers.getTest();
        team = test && Teams.findOne(test.teamId);
    }

    return team;
}
```

So we have a concept of Teams, Recordings, and Tests here. And in these three contexts, this
function should be able to return a team, if all the details are alright.

You see it looks kind of messy: repetitive, dependent on order, not that maintainable if this one
would grow, so I set out to refactor it with some functional thinking in mind.

I identified the obvious need for null checks and the _flow of order_. What if we could abstract out
the guard parts? I.e. `if (!team) { doThis() }`. The flow of order can use the help of `compose` – a
common function for composing several functions into one
([link to Underscore's docs](http://underscorejs.org/#compose)). In plain code:

```js
const f = (val) => val + 1;
const g = (val) => val + 2;

const h = compose(g, f); // Same as g(f())
h(1); // => 4
```

You basically get a single function which is kickstarted with a parameter, and will pass each
function's return value on to the next one. Great for sequences. It corresponds to the mathematical:

```
h(x) = (g ∘ f)(x) = g(f(x))
```

So from that, I identified three functions I wanted to be in this chain:

1. `getTeamFromRoute`
2. `getTeamFromRecording`
3. `getTeamFromTest`

in that order.

Now we _could_ wire it up like the old `if` riddled example above, but then we've just replaced some
statements with functions – that isn't functional programming!

So we could come up with this below, where each function checks the parameter (result from previous
function invocation):

```js
function getTeam() {
  const getTeamFromRoute = () =>
    Teams.findOne({slug: FlowRouter.getParam('slug')})
  );

  const getTeamFromRecording = (team) => {
    if (team) return team;

    const rec = RouterHelpers.getRecording();
    return rec && Teams.findOne(rec.teamId);
  };

  const getTeamFromTest = (team) => {
    if (team) return team;

    const test = RouterHelpers.getTest();
    return test && Teams.findOne(test.teamId);
  };

  return _.compose(getTeamFromTest, getTeamFromRecording, getTeamFromRoute)();
  // Like: getTeamFromTest(getTeamFromRecording(getTeamFromRoute()));
}
```

This is _alright_ but not great, I think. We still repeat ourselves in checking the team in the two
last functions, and the functions themselves thus aren't behaving in the same way – they have
different _arity_ (number of arguments taken in the signature).

**What if** we can extract the null check and thus the decision making into its own function, and
invoke it outside of our getter functions? Let's try.

What we need is a single check to see if the result from last invocation is truthy or not. If it is,
we should stop and return. If not, pass on to the next function in the chain. So we will need some
kind of interceptor between our function calls in `compose`, which sniffs the return value.

I came up with this:

```js
function getTeam() {
    const maybeReturnTeam = (callback) => (team) => team || callback();

    const getTeamFromRoute = maybeReturnTeam(() =>
        Teams.findOne({ slug: FlowRouter.getParam('slug') })
    );

    const getTeamFromRecording = maybeReturnTeam(() => {
        const rec = RouterHelpers.getRecording();
        return rec && Teams.findOne(rec.teamId);
    });

    const getTeamFromTest = maybeReturnTeam(() => {
        const test = RouterHelpers.getTest();
        return test && Teams.findOne(test.teamId);
    });

    return _.compose(getTeamFromTest, getTeamFromRecording, getTeamFromRoute)();
}
```

Does it look weird? Perhaps, yeah. The new thing is `maybeReturnTeam`. In plain, old style
Javascript, it would be:

```js
function maybeReturnTeam(callback) {
    return function (team) {
        return team || callback();
    };
}
```

A _function which returns a function which perhaps invokes a callback_. So each `callback` in there
will be one of our getter functions. And since `maybeReturnTeam` returns a function, it'll play well
with `compose`, since it's actually only the function returned that will be directly invoked by the
composition chain.

The `maybeReturnTeam` will also effectively prevent other getter functions to be called if it
encounters a truthy value in the first function. Great!

---

So we got rid of all the if's and created a nice, flowing chain of functions doing there thing.
Sometimes it's not worth it to go into crazy functional programming techniques in everyday code,
since in a large code base and with a team, you need to keep readability (and _understandability_!)
high. And one might argue that the original code I had there at the top is evidentally less code.
But as a whole, FP makes total sense to me once you learn how to rethink how you actually do program
flows today.
