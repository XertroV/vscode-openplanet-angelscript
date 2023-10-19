# Openplanet-Angelscript

IDE features + Language Server for [Openplanet](https://openplanet.dev) flavored angelscript.
This project is not maintained by the Openplanet team.

You must open at the root of a plugin directory (that contains an `info.toml` file).

Works in Windows and WSL. You don't need to use WSL. (it probably also works under linux and macos if you set config paths correctly, but those environments are unsupported. will help with issues if I can, but YMMV.)

Currently only the TMNEXT engine is supported, and so only TMNEXT types will appear, be suggested, autocompleted, etc.
Supporting MP4 and TURBO is possible but not planned unless there is demand. It's relatively simple if *simultaneous* parsing of TMNEXT/MP4/TURBO code isn't required.

You can load TURBO/MP4 game binding specifications by setting the openplanet directory to the one for that game and copying `Openplanet{Turbo,4}.json` to `OpenplanetNext.json`.

## Getting Started

This plugin should autodetect your OpenplanetNext folder and the Trackmania\Openplanet game folder, too.
If this doesn't work, then you'll need to add paths in the settings.

*Note:* if you are using this extension under vscode running in WSL, you should symlink `~/OpenplanetNext` to the corresponding directory in your userprofile dir for the default settings to work.
```bash
(
  OP_DIR="$(wslpath -u $(cmd.exe /C 'echo %userprofile%\\OpenplanetNext' 2>&1 | tr -d '\r' | tail -n1))";
  ln -s "$OP_DIR/" ~/OpenplanetNext;
)
```

To check if something's going wrong, look for logs in `Output > Angelscript Language Server`.

If you have issues ping @XertroV on the Openplanet discord.

<!--
**Note:** inline array declarations like `string[] asdf = {'a', 'b', 'c', 'd'};` are taxing for the extension at the moment. This can cause out of memory errors for complex expressions like `string[][] = {{'a','b','c'},{'a','b','c'},{'a','b','c'},{'a','b','c'},{'a','b','c'},{'a','b','c'}}`.
The workaround is to populate the array with one array at a time using `.InsertLast`.
It's a bug. -->


## Changelog

- 0.2.28
  - Don't error when using `order=` in SettingsTab
  - Don't error when assigning variables in an expression, e.g., `while ((@app = GetApp()) !is null) { DoStuff(); yield(); }`
  - add Coroutine userdata funcdefs
  - merge LSP generalization PR (thanks KripperOldman)
- 0.2.27
  - fix lookup failure for UI enum value names
- 0.2.26
  - fix switch case statements for numbers
  - add `vec * float` type detection
- 0.2.25
  - fix hex numbers in switch statements
  - add type detection for `mat4 * vec3` et al
  - add MwAddRef and MwRelease undocumented methods
  - add `Math::PI`
  - add `MwStridedArray` template type
  - add namespace completions for UI, MathX, UX, mat4, quat, and string
- 0.2.24
  - Maybe fix bug with defining things in namespaces that overlap with openplanet
  - fix override method warning ignoring const status
- 0.2.23
  - fix codeActions exception spam when editing an array, and during another instance
  - add warning notification when codeActions fails and print the traceback to the log
  - for variables declared as function handles, add a function implementation to the relevant scope.
  - fix suggestion of `Super::` stuff in classes with superclasses.
  - fix detection of methods in the superclass namespace (will no longer show in red).
  - Override snippets don't add a newline before the first `{` (will make this a setting if requested)
- 0.2.22
  - Fix bug parsing v1 OpNext.json format
- 0.2.21
  - Fix bad logging output for slow-to-parse statements.
  - Dummy release -- version numbers were off by 1.
- 0.2.20
  - Add support for new OpenplanetNext.json produced by v1.25.23+
  - reduce amount of logging a bit
- 0.2.19
  - fix: outdated parser .js code shipped in .18
- 0.2.18
  - remove `local` & `access` keywords (do not appear in angelcode docs), add `typedef` and `protected`
- 0.2.17
  - Big improvement to array/dictionary parsing (~700x in at least one case) -- some issues still remain.
- 0.2.16
  - fix dependency loading from .op files using windows paths
- 0.2.15
  - fix floating point number stuff, again.
  - add `do { ... } while ( ... );` support
- 0.2.14
  - performance improvements for anon arrays / dictionaries.
  - add `1e+3` syntax for floats in sci notation
  - add `order="X"` keyword for `SettingsTab`s
- 0.2.13
  - add `funcdef UI::InputTextCallback(UI::InputTextCallbackData@ d)` & `NodTreeMemberCallback`
  - improved detection of references and include them more often where they should be
  - add autodoc feature (usage: `ctrl+.` when the cursor is on the name of a namespace, i.e., like `namespace MyN|amspace {...` will offer an auto-doc-gen option)
  - initial support for extra docs for Nadeo types
  - (better) respect custom settings WRT Openplanet directories
- 0.2.12
  - add `and`, `xor`, and `or` binary compare operators (and `^^`, too), and `not`
  - support interfaces, multiple superclasses (preliminary impl, not completely done)
- 0.2.10
  - improve settings kwarg suggestion locations
  - fix broken `Define: ` for openplanet callbacks
  - fix detection of empty function bodies where keywords (like `override`) occur after that arguments list
  - fix parsing strings continued over multiple lines `"a" \n "b" == "ab"`
- 0.2.9
  - fix array parsing so inline type decls for anonymous arrays/dictionaries work (`dictionary d = {{'k', array<string> = {'a', 'b'}}};`)
- 0.2.8
  - support `get const {}` syntax
  - fix settings for openplanet directories not working
  - partial: settings keyword suggestions (triggers in places that it shouldn't)
  - fix too many 'Change auto to X' suggestions -- will only suggest one, now, and only within the prior 20 symbols.
- 0.2.7
  - add cast suggestions, particularly helpful for Nadeo types (try ctrl+. when your cursor is over `auto app = GetApp();`)
  - Improve constructor hover -- shows function decl now, rather than class info.
  - replacing auto with an `array<T>` or `MwFastBuffer<T>` won't add an `@` anymore
- 0.2.6
  - add mixin syntax support
  - add functions for primitive conversions
- 0.2.5
  - improve settings parsing
  - add interface keyword detection
- 0.2.4: package.json description and typo
- 0.2.1 - 0.2.3
  - update readme for vscode marketplace & other publish related things.
- 0.2.0
  - prep for publication, e.g., icons
  - debug snippet: print all props
  - fix missing props on OpNext.json class (was just CSceneVehicleVisState -- was due to VehicleState/StateWrappers.as)
  - exponential notation for floats
  - nicer squiggle (doesn't include surrounding whitespace)
  - add file decorations for files with parse errors
  - error notification when required json files aren't found
- 0.1.6
  - fix parsing errors with `<` and `>` and operator precedence + type detection
  - added `Reload info.toml` command
  - fix settings declarations and improve support
  - add openplanet constructors
  - squiggly line for unparsable statements
  - named functions can be used as arguments e.g., for `startnew`
  - basic `get{} set{}` support
  - prelim support for multiple inline functions in one expression.
  - inline function scopes (+ appear in global namespace)
- 0.1.5
  - windows compatibility supported now (seems to work, pls report bugs)
  - add prelim support for inline functions and function handles
  - fix massive performance issue looking for template types with an @ in them (literally added 1 character to some regex)
  - add game enums and fix resolution for enums with same name in diff namespaces
  - add openplanetnext.json docs
  - `LookupType` now prioritizes namespaces
  - fix some symbol lookup stuff
- 0.1.4
  - add https://openplanet.dev/docs/reference/plugin-callbacks suggestions
  - load dependencies even if info.toml not found
  - added openplanet plugins as dependency options
  - fix settings parsing
  - add options for debug output
  - fix parsing of `auto @x = bar;`
- 0.1.2-0.1.3
  - fixes WRT parsing lvalues that are references
  - work on funcdef
  - try/catch parsing
  - template type bug fixes; template types being e.g., `array<T>`
  - add `super` definitions for classes
  - imported get/set accessors
  - `shared` and other keywords
  - enum parsing
  - fix bug WRT openplaent type class properties scope (was global when shouldn't have been)
  - goto definition of superclasses like `A::B`
  - inline array parsing + type resolution
  - refactor imports to avoid cpu usage and clobbering
- 0.1.1
  - imports and shared, icons, added is and !is support, global get_ accessors work, arrays work, references sorta work (they're just ignored), settings declarations work (are ignored), and mb some other things I forgot.
- 0.1.0
  - initial support, openplanet types (no game enums) and inheritance


## todo:

- check for redefinition of variables in same scope and squiggle
- annotation type add `@`
- add suggestions for settings keyword args (some done)
- fix/add `CoroutineFunc@` data types
- fix suggestions for fundefs -- way too many! (including missing some of the last characters + many many repetitions)
- class properties that are funcdef types should be registered as local functions
- cast to helper suggests pointless stuff for arrays (maybe other template types too)
- `void` as value for `&out` vars to ignore
- "Arguments can also be named and passed to a specific argument independent of the order the parameters were declared in. No positional arguments may follow any named arguments."
- `const obj @ const d = obj();` -- const syntax
- supertypes finish and polish (search for `.getSuperType()`; maybe remove .supertype all together in favor of .supertypes)
- rename getter/setter adds extra _ to start of usages
- (75%) list parsing v broken for complex expressions
- textDocument/completion failed with message: Cannot read properties of undefined (reading 'endsWith', 'length', and others)
- add UI function hints in addition to math hints
- long chains of `.Replace` on strings (e.g., 15+) are exponential to parse
- got some early crashes b/c dbParam in `ShouldLabelConstantNode(argNode, dbParam.name)` was null
