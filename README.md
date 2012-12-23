requirejs-goggle
================

A Brackets extension that displays unused require module(s) in the
current document (via "Debug > RequireJS Goggle" menu item).

The definition of an "unused require module" - a module
that has been "require()d" via the require('modulepath') syntax and
then later never used. 

key advantage: keeps code clean, lessening the chances of circular
dependencies.

## Known limitations

Does not show an unused requirejs module if it has been mentioned
within a string or regexp.

## Implementation Notes 

Uses code stolen from the FindInFiles brackets module to reuse the
result dialog. This extension is therefore dependent on the internal
implementation details of FindInFiles.

Wishlist: Easy way to extend FindInFiles to do custom search and
display results.