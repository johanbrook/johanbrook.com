---
title: Setting up Sublime Text for Deno
slug: sublime-text-deno
date: 2022-02-16
location: My living room in Stockholm
excerpt: How I set up Sublime Text 4 for developing Deno code.
keywords:
  - deno
  - sublime text
  - plugins
  - config
  - extensions
  - lsp
---

I've recently switched back to Sublime Text as main editor, as described in a recent
[/mind post](/mind/#202202080950). As a test to get a feel for the ecosystem, I've set out on a
journey to make it more ergonomic to develop [Deno](https://deno.land) code. "Ergonomic" as in
"actually use Typescript features and not show any red compile errors for Deno specific code". Also,
I want to try to have Sublime support
[import maps](https://deno.land/manual/linking_to_external_code/import_maps),
[the Deno config file](https://deno.land/manual/getting_started/configuration_file), and format on
save.

# Install necessary packages

(I assume you have [Package Control up and running](https://packagecontrol.io/installation).)

**Required:**

- [LSP](https://packagecontrol.io/packages/LSP). Client implementation of the Language Server
  Protocol for Sublime Text. This is a base package, which is used by other language specific
  packages. There are packages for Typescript, CSS, Deno, JSON, Lua, Vue, etc. etc.
- [LSP-Deno](https://packagecontrol.io/packages/LSP-Deno). Convenience package for starting the Deno
  LSP server. This enables Deno features in Sublime.

**Optional:**

- [LSP-json](https://packagecontrol.io/packages/LSP-json). Schema validation/completions for your
  JSON and Sublime files. This is for making JSON files more "VS Code like" in the way that keys in
  various settings files can be autocompleted and validated. Handy but in no way required.

## Sublime project configuration

First of all, we need a place where we can instruct Sublime (and installed packages) where to look
for custom Deno settings. That is, settings that describe paths to files, and lint and format
config. Essentially holding the values described in
["Configuration file"](https://deno.land/manual/getting_started/configuration_file).

These will go into a `xxx.sublime-project` file, where `xxx` is the name of your project (anything).
Create one if you haven't.

---

(Sublime has this concept of "projects" I don't really like. One has to go to _Window -> Open
project…_ in order for the editor to actually load the project config file, _or_ use
`subl --project path/to/project.sublime-project`. It's not loaded when the editor is brought up via
`subl .` from the command line. This feels lame. Sort of
[tracked here](https://github.com/sublimehq/sublime_text/issues/828).)

---

This is a sample `xxx.sublime-project` for Deno:

```json
{
	"settings": {
		"LSP": {
			"LSP-typescript": {
				"enabled": false
			},
			"Deno": {
				"enabled": true,
				"settings": {
					"deno.config": "./deno.jsonc",
					"deno.unstable": true,
					"deno.importMap": "./import_map.json",
					"deno.suggest.imports.hosts": {
						"https://deno.land": true,
						"https://some-other-cdn.com": true
					}
				}
			}
		}
	}
}
```

All `deno.*` settings are documented
[here, with defaults](https://github.com/sublimelsp/LSP-Deno/blob/main/LSP-Deno.sublime-settings).

Line by line:

- `LSP-typescript`. Let's be really sure to disable the TypeScript Language Server, since that'll
  interfere with `.ts` files with Deno calls.
- `deno.config`: Path to the Deno
  [configuration file](https://deno.land/manual/getting_started/configuration_file).
- `deno.unstable`: Enable unstable features or not.
- `deno.importMap`: Path to an [import map](https://deno.land/manual/npm_nodejs/import_maps).
- `deno.suggest.imports.hosts`: Hosts that will appear as suggestions when importing.

(As mentioned above, the LSP-json package really helps you with the autocomplete here. I found it
tricky to figure out the exact structure of these settings.)

For me, there's no need to do further tweaks in most Deno projects.

Now, Sublime should be able to pick up your import map, as well as your Deno configuration.

If configured correctly, you should be able to

- get IntelliSense popups when hovering over functions
- have working import maps
- get proper type info and autocompletions when coding
- have correct `compilerOptions` from your Deno config

and lots more.

![IntelliSense documentation popup]({{ "deno-intellisense.png" | postAssetUrl }})

---

**Note:** at the time of writing, there's an issue with the `deno.suggest.imports.hosts` key. If you
toggle the LSP log panel (_Command palette -> "LSP: Toggle log panel"_), you'll see that it says:

```
failed to update settings: invalid type: map, expected a boolean
```

I've filed an [issue for LSP-Deno here](https://github.com/sublimelsp/LSP-Deno/issues/10). I've
noticed that this setting interfers with the other settings, so I've removed it for now.

## Click to go to definition

This is a feature I heavily used in VS Code: use the combo of `option+click` (Mac) to go to the
definition of a variable, function, or type. This uses the LSP, so it'll be "intelligent".

Mouse bindings live in this file (create it if it doesn't exist):

```
~/Library/Application\ Support/Sublime\ Text/Packages/User/Default\ (OSX).sublime-mousemap
```

Then add this:

```json
[
	{
		"button": "button1",
		"count": 1,
		"modifiers": [
			"alt"
		],
		"press_command": "lsp_symbol_definition"
	}
]
```

You can now use `alt+click` to jump around.

## Rename symbols

Another nifty feature we can use the Language Server's capabilities for is to do smart renames, i.e.
rename functions and variables and have them be intelligently updated across files.

In VS Code, I used the key binding `cmd+shift+r` (Mac).

Open up Key Bindings (_Preferences -> Key Bindings_) or:

```bash
subl ~/Library/Application\ Support/Sublime\ Text/Packages/User/Default\ (OSX).sublime-keymap
```

Then add this:

```json
[
	{
		"keys": ["super+shift+r"],
		"command": "lsp_symbol_rename",
		"context": [
			{
				"key": "lsp.session_with_capability",
				"operator": "equal",
				"operand": "renameProvider"
			}
		]
	}
]
```

## Diagnostics panel

By default, the LSP package will show a diagnostics panel if there are TypeScript errors or warnings
in your project. I found this really annoying, so I turned it off with:

_Preferences -> Package Settings -> LSP -> Settings_

Then add:

```json
{
	// Open the diagnostics panel automatically on save when diagnostics level is
	// equal to or less than:
	// none: 0 (never open the panel automatically)
	// error: 1
	// warning: 2
	// info: 3
	// hint: 4
	"show_diagnostics_panel_on_save": 0 // default is 2, turn off with 0
}
```

**Tip:** You can still toggle the _Diagnostics_ panel with `cmd+alt+m` (Mac) or search for it in the
command palette. It'll show any TypeScript errors or warnings in the project.

## Code formatting

Deno comes with a built-in formatter, which the LSP in Sublime can use.

Either run `LSP: Format file` from the command palette to format manually, or use format on save.
The latter is configured in the LSP settings, _but_ you should probably do it on a project basis.
This means adding this to your Sublime project file:

```json
{
	"settings": {
		"lsp_format_on_save": true
	}
}
```

The exact formatting config lives in your Deno configuration. For me, it's `deno.jsonc`:

```json
{
	"fmt": {
		"options": {
			"useTabs": false,
			"lineWidth": 100,
			"singleQuote": true,
			"indentWidth": 4
		}
	}
}
```

## Bonus: JSON schema support for `deno.json`

There's no built-in support for autocompletions in `deno.{json,jsonc}` files. But with our newly
installed LSP-json package, there is a way! Deno publishes its schema for the config file on a URL,
which we can add to "user schemas" in the LSP-json settings.

Open `LSP-json.sublime-settings` or run `LSP-json Settings` in the command palette. Then add this:

```json
{
	"settings": {
		"userSchemas": [
			{
				"fileMatch": ["deno.json", "deno.jsonc"],
				"uri": "https://deno.land/x/deno@v1.18.2/cli/schemas/config-file.v1.json"
			}
		]
	}
}
```

I guess one has to update the versions in there manually, but the package wouldn't follow the URL
linked from Deno's
[documentation page](https://deno.land/manual/getting_started/configuration_file), probably since it
redirects:
[https://deno.land/x/deno/cli/schemas/config-file.v1.json](https://deno.land/x/deno/cli/schemas/config-file.v1.json).

---

That's it! [Let me know](/contact) if you've got more tricks for working with Deno in Sublime.
