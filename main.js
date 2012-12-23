/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, window */

/** Adds a "Debug > RequireJS Goggle" menu item that displays unused require variables in the current document. */
define(function (require, exports, module) {
    "use strict";

    var CommandManager  = brackets.getModule("command/CommandManager"),
        Commands        = brackets.getModule("command/Commands"),
        EditorManager   = brackets.getModule("editor/EditorManager"),
        Strings         = brackets.getModule("strings"),
        StringUtils     = brackets.getModule("utils/StringUtils"),
        Menus           = brackets.getModule("command/Menus"),
        DocumentManager = brackets.getModule("document/DocumentManager");

    var _results = [],
        FIND_IN_FILES_MAX = 100;

    //stolen from findreplace, as is.
    function getSearchCursor(cm, query, pos) {
        // Heuristic: if the query string is all lowercase, do a case insensitive search.
        return cm.getSearchCursor(query, pos, typeof query === "string" && query === query.toLowerCase());
    }

    //stolen from findinfiles as is, no changes.
    function _showSearchResults(searchResults, query) {
        var $searchResultsDiv = $("#search-results");

        if (searchResults && searchResults.length) {
            var $resultTable = $("<table class='zebra-striped condensed-table' />")
                                .append("<tbody>");

            // Count the total number of matches
            var numMatches = 0;
            searchResults.forEach(function (item) {
                numMatches += item.matches.length;
            });

            // Show result summary in header
            var numMatchesStr = "";
            numMatchesStr += String(numMatches);

            // This text contains some formatting, so all the strings are assumed to be already escaped
            var summary = StringUtils.format(
                Strings.FIND_IN_FILES_TITLE,
                numMatchesStr,
                (numMatches > 1) ? Strings.FIND_IN_FILES_MATCHES : Strings.FIND_IN_FILES_MATCH,
                searchResults.length,
                (searchResults.length > 1 ? Strings.FIND_IN_FILES_FILES : Strings.FIND_IN_FILES_FILE),
                query,
                ""
            );

            $("#search-result-summary")
                .html(summary +
                     (numMatches > FIND_IN_FILES_MAX ? StringUtils.format(Strings.FIND_IN_FILES_MAX, FIND_IN_FILES_MAX) : ""))
                .prepend("&nbsp;"); // putting a normal space before the "-" is not enough

            var resultsDisplayed = 0;

            searchResults.forEach(function (item) {
                if (item && resultsDisplayed < FIND_IN_FILES_MAX) {
                    var makeCell = function (content) {
                        return $("<td/>").html(content);
                    };

                    // shorthand function name
                    var esc = StringUtils.htmlEscape;

                    var highlightMatch = function (line, start, end) {
                        return esc(line.substr(0, start)) + "<span class='highlight'>" + esc(line.substring(start, end)) + "</span>" + esc(line.substr(end));
                    };

                    // Add row for file name
                    var displayFileName = StringUtils.format(Strings.FIND_IN_FILES_FILE_PATH,
                                                             StringUtils.breakableUrl(esc(item.fullPath)));
                    $("<tr class='file-section' />")
                        .append("<td colspan='3'><span class='disclosure-triangle expanded'></span>" + displayFileName + "</td>")
                        .click(function () {
                            // Clicking file section header collapses/expands result rows for that file
                            var $fileHeader = $(this);
                            $fileHeader.nextUntil(".file-section").toggle();

                            var $triangle = $(".disclosure-triangle", $fileHeader);
                            $triangle.toggleClass("expanded").toggleClass("collapsed");
                        })
                        .appendTo($resultTable);

                    // Add row for each match in file
                    item.matches.forEach(function (match) {
                        if (resultsDisplayed < FIND_IN_FILES_MAX) {
                            var $row = $("<tr/>")
                                .append(makeCell(" "))      // Indent
                                .append(makeCell(StringUtils.format(Strings.FIND_IN_FILES_LINE, (match.start.line + 1))))
                                .append(makeCell(highlightMatch(match.line, match.start.ch, match.end.ch)))
                                .appendTo($resultTable);

                            $row.click(function () {
                                CommandManager.execute(Commands.FILE_OPEN, {fullPath: item.fullPath})
                                    .done(function (doc) {
                                        // Opened document is now the current main editor
                                        EditorManager.getCurrentFullEditor().setSelection(match.start, match.end);
                                    });
                            });
                            resultsDisplayed++;
                        }
                    });

                }
            });

            $("#search-results .table-container")
                .empty()
                .append($resultTable)
                .scrollTop(0);  // otherwise scroll pos from previous contents is remembered

            $("#search-results .close")
                .one("click", function () {
                    $searchResultsDiv.hide();
                    EditorManager.resizeEditor();
                });

            $searchResultsDiv.show();
        } else {
            $searchResultsDiv.hide();
        }

        EditorManager.resizeEditor();
    }

    // Finds require imports, looks if another match for the same var
    // exists.
    function handleGoggle() {
        var editor = EditorManager.getCurrentFullEditor(),
            cm = editor._codeMirror,
            searchStartPos = 0,
            searchText = new RegExp("(.*?)\\s*=\\s*require\\(");

        _results = [];
        var cursor = getSearchCursor(cm, searchText);
        while (true) {
            var found = cursor.findNext();
            if (cursor.atOccurrence && found.length === 2) {
                //get the var name, make sure it is used at least once.
                //remove var prefix
                var varName = $.trim(found[1].replace('var', ''));

                //check if it is used elsewhere
                //console.log('looking if require mod used: ' + varName);
                var dupCursor = getSearchCursor(cm, varName),
                    dupMatch = dupCursor.findNext();

                if (dupMatch && !dupCursor.findNext()) {
                    _results.push({from: cursor.from(), to: cursor.to(), start: {line: cursor.from().line}, end: {line: cursor.to().line}, line: found[0]});
                }
            } else {
                break;
            }
        }

        _showSearchResults([{fullPath: editor.document.file.fullPath, matches: _results}], 'unused requirejs vars');
    }


    // First, register a command - a UI-less object associating an id to a handler
    var REQUIREJS_GOGGLE_COMMAND_ID = "requirejs-google.lookup";   // package-style naming to avoid collisions
    CommandManager.register("RequireJS Goggle", REQUIREJS_GOGGLE_COMMAND_ID, handleGoggle);

    // Then create a menu item bound to the command
    // The label of the menu item is the name we gave the command (see above)
    var menu = Menus.getMenu(Menus.AppMenuBar.DEBUG_MENU);
    menu.addMenuItem(REQUIREJS_GOGGLE_COMMAND_ID);

    // Or you can add a key binding without having to create a menu item:
    //KeyBindingManager.addBinding(MY_COMMAND_ID, "Ctrl-Alt-H");
});