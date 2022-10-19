todo:

* `array<A::B>`, or `namespace A { auto x = {B()}; class B {} }` accessing x from outside A
  * types don't resolve right
* ~~ funcdefs
* ~~ function casting via funcdefs
* ~~ function handles & function types in general
* ?? some constructors not added to scope
* ~~ `auto landmarks = cp.Arena.MapLandmarks;` should be detected as `MwFastBuffer<CGameScriptMapLandmark@>`
* ~~`linkedPositions.InsertLast(cast<array<vec3>>(lcps[lpKeys[i]]))` -- seems like `cast<array<vec3>>` doesn't parse -- note that `cast<vec3[]>` works fine.
  * ~~`>>` looks like the binary op
* ~~ 1/2 class properties using get/set `class C { bool IsBlah { get { return true; } set { this.x = value; }}}`
* ~~ openplanet core constructors
* ~~ inline function scopes in global ns
* numbers like `-3.865678972395145e-05`
* some methods/props not added, e.g.: `FRGroundContactMaterial` `visState.Left` `visState.Up`

package: `vsce package`

install from cli: `code --install-extension openplanet-angelscript-X.Y.Z.vsix`

changelog:

- 0.1.7
  - sldkfj
  - ~~squiggle setting works now
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


------

# old readme

Language Server and Debug Adapter for use with the UnrealEngine-Angelscript plugin from https://angelscript.hazelight.se

## Getting Started
After building or downloading the Unreal Editor version with Angelscript
enabled from the github page linked above, start the editor and use visual
studio code to open the 'Script' folder created in your project directory.
Your 'Script' folder must be set as the root/opened folder for the extension to
function.

## Features
### Editor Connection
The unreal-angelscript extension automatically makes a connection to the
running Unreal Editor instance for most of its functionality. If the editor
is not running, certain features will not be available.

### Code Completion
The extension will try to complete your angelscript code as you type it
using normal visual studio code language server features.

### Error Display
When saving a file the unreal editor automatically compiles and reloads it,
sending any errors to the visual code extension. Errors will be highlighted
in the code display and in the problems window.

### Debugging
You can start debugging from the Debug sidebar or by pressing F5. While
debug mode is active, breakpoints can be set in angelscript files and
the unreal editor will automatically break and stop execution when
they are reached.

Hitting 'Stop' on the debug toolbar will not close the unreal editor,
it merely stops the debug connection, causing breakpoints to be ignored.

When the debug connection is active, any exceptions that occur during
angelscript execution will automatically cause the editor and visual
studio code to pause execution and show the exception.

### Go to Symbol
The default visual studio code 'Go to Definition' (F12) is implemented for
angelscript symbols. A separate command is added to the right click menu
(default shortcut: Alt+G), named 'Go to Symbol'. This command functions
identically to 'Go to Definition' for angelscript symbols.

If you have the Unreal Editor open as well as Visual Studio proper showing
the C++ source code for unreal, the extension will try to use its
unreal editor connection to browse your Visual Studio to the right place,
similar to double clicking a C++ class or function in blueprints.

This uses the standard unreal source navigation system, which is only
implemented for classes and functions.

### Add Import To
The 'Add Import To' (default shortcut: Shift+Alt+I) command from the
right click menu will try to automatically add an import statement
to the top of the file to import the type that the command was run on.

### Quick Open Import
The 'Quick Open Import' (default shortcut: Ctrl+E or Ctrl+P) command from the
right click menu will try to open the quick open navigation with the import
statement.

### More Language Features
This extension acts as a full language server for angelscript code. This includes
semantic highlighting, signature help, reference search, rename symbol and a number
of helpful code actions and quickfixes.

Some of these features require an active connection to the unreal editor.

### Semantic Symbol Colors
There are more types of semantic symbols generated by the extension than there
are colors specified by most color themes.

The default visual studio code color theme will display all variables in blue,
for example, regardless of whether the variable is a member, parameter or local.

You can add a snippet to your `.vscode/settings.json` inside your project folder
to add extra colors to make these differences more visible.

For example, to add extra colors to the default vscode dark theme:

```
    "editor.tokenColorCustomizations": {
		"[Default Dark+]": {
			"textMateRules": [
				{
					"scope": "support.type.component.angelscript",
					"settings": {
						"foreground": "#4ec962"
					}
				},
				{
					"scope": "support.type.actor.angelscript",
					"settings": {
						"foreground": "#2eb0c9"
					}
				},
				{
					"scope": "variable.parameter.angelscript",
					"settings": {
						"foreground": "#ffe5d9"
					}
				},
				{
					"scope": "variable.other.local.angelscript",
					"settings": {
						"foreground": "#e8ffed"
					}
				},
				{
					"scope": "variable.other.global.angelscript",
					"settings": {
						"foreground": "#b99cfe"
					}
				},
				{
					"scope": "variable.other.global.accessor.angelscript",
					"settings": {
						"foreground": "#b99cfe"
					}
				},
				{
					"scope": "entity.name.function.angelscript",
					"settings": {
						"foreground": "#b99cfe"
					}
				},
				{
					"scope": "invalid.unimported.angelscript",
					"settings": {
						"foreground": "#ff9000"
					}
				},
			]
		}
	}
```
