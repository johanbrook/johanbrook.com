---
title: Customising an iOS home screen web app in 2021
slug: ios-homescreen-web-app
date: 2021-12-14
location: Stockholm
excerpt: Developing a mobile web app for iOS is tricky, since with new iOS releases, features are being added and removed, and new bugs appear. In this post, I walk through what worked for me and my simple app in iOS 15 (in 2021).
keywords:
  - ios
  - web apps
  - pwa
---

## Background

During parental leave, I've started to run. Not away from the baby, for heaven's sakes, but regular exercise running. I really prioritised keeping it super straight-forward: I refuse wear any kind of wearable, such an Apple Watch or Garmin in order to track heart rate and so on (I won't go into why here, I just don't need another tech device). But. Even I see the need for tracking basic stats, like duration, length of run, and average speed. Those are literally the three things I need.

Let's see what running apps there are! *Opens up App Store.* "Strava, yes I've heard about that one. Runkeeper… that one I've used before! ( = a lifetime ago)". I installed Strava because it was at the top, and hell begins. It prompts me for an account, which is fair enough I guess, but it still put me off a bit. It's also paid. Monthly subscription. And it shows nagging reminders to upgrade to a paid plan *everywhere*. And it has social features, which I of course don't need. It has so much *stuff* I neither need nor want! As a developer on leave, the only sane thing to do is to write my own running app.

Since I'm not a Swift or Objective-C developer (and have no intentions of becoming one), I need to do it as a web app. Approximately 5 seconds after I decided to develop my own running tracker app I realise I really must ensure that this single API is available in the iOS browser: being able to *watch* the GPS position as it changes with the [Geolocation API](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API). Thank god, `Geolocation.watchPosition()` exists, and a wave of relief is showering over me. That means I can watch the position, stash away the raw coordinates, and do things with them. Such as converting to [GeoJSON](https://geojson.org) in order to calculate the length in kilometers and drawing the route in an embedded map from Mapbox.

- You can try the final app here: [runloop.pages.dev](https://runloop.pages.dev). Be sure to add it to your homescreen.
- The source code for my app is over [at GitHub](https://github.com/johanbrook/runloop).

## Apple documentation feels out of date

I start out by going straight into the horse's mouth: the Apple documentation on (mobile) Safari. This should be the truth, and nothing but the truth! I head over to [developer.apple.com](https://developer.apple.com) and browse to some "Technologies" page where one can input a "technology". I put in ["safari"](https://developer.apple.com/documentation/technologies?tags=Safari). The search results only yield things that are interesting from a native app perspective, such as embedding web views.

Okay. I scroll around to the footer, and see ["Safari and the web"](https://developer.apple.com/safari/). Score! These are the only interesting links:

![Apple docs]({{ "apple-docs-safari.png" | postAssetUrl }})

Clicking that "More" link leads me to the ["Documentation Archive"](https://developer.apple.com/library/archive/navigation/index.html?filter=safari). That sounds nice. Latest change as of writing is in June 2018. Gulp.

Unless I'm missing something, there's no official Apple documentation on iOS Safari. Except for browsing through blog posts over at [WebKit.org](https://webkit.org) and other release notes. Note that I'm talking about proprietary Safari tech – not regular Web APIs you'd find over at MDN.

My next bet was simply googling around on problems as I encountered them.

## How to make a web app behave and look nicely on iOS 15 in 2021

What follows is a stream of things I encountered while researching how to make a super slick iOS web app in 2021. My phone is an iPhone 12 mini, and I'm using iOS 15.2 at the time of writing this post.

### Adding to home screen – don't forget the icon

I knew from before that adding a web page to the iOS home screen grants it special privileges. Like not [wiping LocalStorage after just 7 days](https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/). Also, there's the UX aspect, which is important: adding to the home screen removes the Safari chrome (UI) and runs the web app in a frameless mode. This is nice.

This hasn't changed since last time I looked, thank god. The option is still there in the Safari UI. It'll add use the `<title>` from your web page as the app title. You need to supply an icon yourself (iOS will pick a fugly screenshot of your app otherwise).

Put this in your `<head>`:

```html
<link rel="apple-touch-icon" href="apple-touch-icon.png">
```

where the `href` attribute points to a PNG image with the icon file.

Refer to [Apple's official guide on icons](https://developer.apple.com/design/human-interface-guidelines/ios/icons-and-images/app-icon/) for sizes, since you can control which icon file that goes with which size, like this:

```html
<link rel="apple-touch-icon" sizes="152x152" href="touch-icon-ipad.png">
```

### Viewport settings

The single most important thing you'd want to do is to set the viewport width to the width of the device. This is old school, but important:

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
```

If you feel like disabling the pinch-to-zoom behaviour of web pages, tack on an `user-scalable=no`:

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
```

For me, I wanted more native feel, so I disabled zoom. Even though it's a bit user hostile. But the user in this case is me, so I don't care.

### Frameless mode and `manifest.json`

The next most important thing is to tell iOS that we'd like to run the web app in "frameless mode", or "without the browser chrome". Otherwise your home screen web app icon only leads to a web page, and thus merely becomes a shortcut. We want it to feel like an app!

```html
<meta name="apple-mobile-web-app-capable" content="yes" />
```

This still is the way to tell iOS to hide the address bar and all that.

But. When I clicked around on internal links in my app, I saw the browser chrome appear for every link click! It would suck if Apple had crippled mobile web apps in this way, but I wasn't too surprised after all – this is Apple.

I started reading about ["Web app manifests"](https://developer.mozilla.org/en-US/docs/Web/Manifest). Those manifests is a JSON file which tells the browser more things when it runs the app in "PWA" (Progressive Web App) mode. I's mainly about customising presentation, such as titles, icons, splash screens, etc. So I sort of wrote it off at first, and also thought Apple wouldn't care about these kinds of valiant efforts by the web community.

But I was wrong. I stuck a simple `manifest.json` in my root directory and linked it from my HTML:

```html
<link rel="manifest" href="/manifest.json" />
```

```json
{
    "name": "Runloop",
    "scope": "/",
    "display": "standalone"
}
```

I'm not sure whether it was the `scope` or `display` parameter that made the internal links work without chrome again, but this did the trick! iOS Safari *is* parsing this file after all. And I have no idea why the `apple-mobile-web-app-capable` tag won't cut it, but oh well. This feels like an extra guard to *really* tell the system that my app is running standalone without any browser chrome ("please").

### Using the whole screen on iPhone models with notches

My iPhone 12 mini has a notch, and is thus not a perfect rectangular display. We can tell the web app to use the whole display with this:

```html
<meta name='viewport' content='initial-scale=1, viewport-fit=cover' />
```

That is, adding `viewport-fit=cover` to the `viewport` meta tag. Otherwise, Safari will play it safe and make sure your app lives within a rectangular area far away from the notch.

Apple is kind and provides tech for us in order to avoid colliding with the notch and the virtual home button at the bottom of the iPhone screen. [I recommend reading this article](https://webkit.org/blog/7929/designing-websites-for-iphone-x/).

Basically, we've got four `env()` values to use:

```css
env(safe-area-inset-top)
env(safe-area-inset-bottom)
env(safe-area-inset-left)
env(safe-area-inset-right)
```

`env()` works where `var()` works – even inside `calc()`, which is nice. For instance, this is the styling for my bottom `NavBar` component:

```css
.NavBar {
  padding: var(--inset);
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding-bottom: calc(env(safe-area-inset-bottom) + 10px);
  padding-left: max(env(safe-area-inset-left), var(--inset));
  padding-right: max(env(safe-area-inset-right), var(--inset));
}
```

`--inset` is set on `:root`, and is the "global padding" in my app. As you can see, I use it with the `max()` function to make the left and right padding be whatever's the max value of the safe area and my inset.

### Styling taps on links and buttons

Since the arrival of the first iOS ("iPhone OS"?), it's been tricky to style taps on interactive elements. Such as a different background on a button when you tap it. `:active` and `:hover` pseudo selectors are both weird and strangely enough don't manage to produce that native feel.

In 2021, turns your all you have to is adding a single no-op touch listener, and then you can use `:active` as it's intended to:

```js
// Adding an empty touch listener will make :active CSS pseudo selector
// work in order to style taps on elements. Joy.
document.addEventListener('touchstart', (evt) => {});
```

Insert that snippet somewhere in your JS, and off you go.

### Making the app be 100% height and don't show scrollbars

You thought this was the kind of stuff you'd stop put up with in 2021? Think again. `100vh` won't do what you think it does, and Apple devs think it works "as intended". [Read more here](https://chanind.github.io/javascript/2019/09/28/avoid-100vh-on-mobile-web.html) for a demonstration. I almost can't muster strength to explain it all, but the gist of it is that the browser chrome in mobile Safari is dynamic in height and take up space. This affects the `vh` unit and produces overflow.

[Dynamic viewports](https://www.bram.us/2021/07/08/the-large-small-and-dynamic-viewports/) will fix this. But until then, I went with a boring Javascript fix:

```ts
let lastHeight: number | null = null;

const setAppHeight = debounce(() => {
    const doc = document.documentElement;
    const height = window.innerHeight;

    if (height != lastHeight) {
        doc.style.setProperty('--app-height', `${height - MAGIC_NUMBER}px`);
        lastHeight = height;
    }
}, 100);

// This is the magic offset which one can subtract in order to hide scrollbars
// AT LEAST ON MY PHONE. YMMV.
const MAGIC_NUMBER = 3;

/** This is solving the STILL outstanding problem of using
 * height: 100vh on Mobile Safari. The problem is outlined here:
 * https://chanind.github.io/javascript/2019/09/28/avoid-100vh-on-mobile-web.html
 *
 * Instead, we control the height of a CSS variable which is mirroring
 * the window.innerHeight property.
 */
const fixMobileHeight = () => {
    window.addEventListener('resize', setAppHeight);

    setAppHeight();

    return () => window.removeEventListener('resize', setAppHeight);
};

// Util
const debounce = (func: (...args: unknown[]) => unknown, wait: number) => {
    let timeout: NodeJS.Timeout;

    return (...args: unknown[]) => {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };

        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

fixMobileHeight();
```

```css
#app {
  min-height: var(--app-height);
}
```

We use the `resize` event which fires on `window` to set a CSS variable, which we can use in our stylesheet. It has some guards so that we won't fire it too often.

### Dark mode

Don't forget enabling dark mode so Safari can style native elements:

```css
:root {
  color-scheme: light dark;
}
```

This is controllable from a tag within `<head>` too (which I guess is faster since the browser doesn't have to download and parse the CSS to decide).

### Theme colours

This is new, and very marketed by Apple dev evangelists: the possibility to set the "theme colour", which makes Safari use a configured colour of your choice in the browser chrome. Safari is trying to be smart, and defaults to the `background-color` on your `html` or `body` elements, but sometimes you need to set it on your own:

```html
<meta name="theme-color" content="#fff" media="(prefers-color-scheme: light)" />
<meta name="theme-color" content="#000" media="(prefers-color-scheme: dark)" />
```

### System colours

Speaking of colours: dark mode isn't cool, you know what's cool? System colours (that joke fell…). I stumbled upon this blog post: ["CSS System Colors"](https://blog.jim-nielsen.com/2021/css-system-colors/). The author emphasised not hard coding any colours for light and dark modes. Instead, he lets the system decide from sensible defaults. For a website or app without need for any special branding, this is probably what you want.

But what do you do when you actually want to *use* one of these system colours elsewhere in your CSS? That's the core question in the linked blog post, I'll let you read it.

*tldr*: there are "system colors" defined in the [CSS spec](https://drafts.csswg.org/css-color/#css-system-colors), which you can use like any other colour:

```css
.dropdown {
  background-color: Canvas;
}
```

Of course, there's a bug (?) in iOS, so `Canvas` backgrounds don't work properly. The blog post suggests using the `-apple-system-control-background` value as a hack, and it works. Copied from the post:

```css
/* Defaults/fallbacks for 1) */
:root {
  --color-bg: #fff;
  --color-text: #222;
}

/* 1) For browsers that don’t support `color-scheme` and therefore
   don't handle system dark mode for you automatically 
   (Firefox), handle it for them. */
@supports not (color-scheme: light dark) {
  html {
    background: var(--color-bg);
    color: var(--color-text);
  }
}

/* 2) For browsers that support automatic dark/light mode
   As well as system colors, set those */
@supports (color-scheme: light dark) and (background-color: Canvas) and (color: CanvasText) {
  :root {
    --color-bg: Canvas;
    --color-text: CanvasText;
  }
}

/* 3) For Safari on iOS. Hacky, but it works. */
@supports (background-color: -apple-system-control-background) and (color: text) {
  :root {
    --color-bg: -apple-system-control-background;
    --color-text: text;
  }
}

html {
  background-color: var(--color-bg);
  color: var(--color-text);
}
```

This worked for me. Now I can use `--color-bg` wherever I want to use the (dynamic, non hard coded) background colour.

### Disabling selecting text

This also goes in the "user hostile" department. Use are your own discretion:

```css
html {
  -webkit-tap-highlight-color: transparent;
  -webkit-user-select: none;
  user-select: none;
}
```

### Use an iOS-y font stack

I went with this, to get the SF font:

```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell',
        'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
```

## Conclusion

After all these fixes, my app finally felt pretty good to use on an iPhone. It looked gorgeous in dark mode, the typography was great, it felt snappy navigating around, and not like a wEbSiTe at all.

I'm most impressed over how easy it is to make the *styling* look nice. Before iOS 7, when we were in skeumorphism land, it was a pain to make web apps blend into the system. Now it's just some typography, spacing, and default colours, and we've come a long way. If you just "know" how a typical iOS app looks like – with list views, headings and so on – I bet you'll get something that looks decent in no time thanks to the CSS snippets I've posted throughout the text.

I was most surprised over the show-chrome-on-link-tap thing in the home screen app. I had no idea one needed to use a Webmanifest JSON file to get rid of that. I've found *very little* documentation on iOS' use of the web manifest file too.

### Nice Web APIs

Overall, Web APIs have gone a long way with I/O: we can now upload, download, and *share* files in iOS. I built and export and import feature to try this out, and it worked great on mobile:

```ts
const doImport = async (evt: Event) => {
    const { files } = evt.target as HTMLInputElement;

    const file = files[0];

    if (file.type != 'application/json') {
        alert('Only JSON files, please.');
        return;
    }

    try {
        const json = JSON.parse(await file.text());
        // do stuff with object
    } catch (ex) {
        console.error(ex);
        alert(`Failed to read "${file.name}". Reason: ${ex}`);
    }
};

document.findElementById('import')!.addEventListener('change', doImport);
```
```html
<input type="file" id="import" accept="application/json" />
```

Exporting works good with the [Share API](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share):

```ts
const doExport = async () => {
    try {
        // Will show native iOS share pane
        await navigator.share({
            title: 'Run data as JSON',
            files: [fileOf(appConf)],
        });
    } catch (ex) {
        if ((ex as DOMException).name == 'AbortError') return;
        alert(`Sharing failed. Reason: ${(ex as Error).message || ex}`);
        console.error(ex);
    }
};

const fileOf = (data: unknown): File =>
    new File([JSON.stringify(appConf, null, 4)], 'runloop.json', {
        type: 'application/json',
    });
```

The user now gets the choice of saving the file somewhere, or sending it with the native UI controls.

## Epilogue

The irony is that my running tracker app didn't work *at all* out in the wild… Turns out that the system turns off any background geolocation services when the screen is locked – which totally is the case when I'm running. And there's no Geolocation in Service Workers or similar background magic place. Argh.

See it in action here: [runloop.pages.dev](https://runloop.pages.dev).
