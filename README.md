requirejs-goggle
================

A Brackets extension that adds a "Debug > RequireJS Goggle" menu item.

Displays unused require module(s) in the current document.

The definition of an "unused require module" here signifies a module
that has been "require()d" via the require('modulepath') syntax and
then later never used. 

While this may not apply generically to all cases, the key advantage
is that unused dependencies are removed keeping the code clean and
lessening the chances of circular dependencies.

Known limitations: Does not show unused requirejs module that are
mentioned within a string or regexp.

Note: Uses code stolen from the FindInFiles brackets module to reuse
the result dialog. This extension is therefore dependent on the
internal implementation details of FindInFiles.

Wishlist: Easy way to extend FindInFiles to do custom search and
display results.