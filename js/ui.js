define(['underscore', 'jquery'], function(_, $) {

    /**
     * UI object
     */
    var ui = {
        logWindow: null,
        util: {}
    };

    /**
     * Returns or creates group
     *
     * @param {EosLogGroup} group
     * @returns {*}
     */
    ui.getGroup = function getGroup(group) {
        var x = ui.logWindow.find("#" + group.id);
        if (x.size() === 0) {
            x = ui.buildGroup(group);
        }

        return x;
    };

    /**
     * Builds and returns DOM for group
     *
     * @param {EosLogGroup} group
     * @returns {*}
     */
    ui.buildGroup = function buildGroup(group) {
        var x = $("<div></div>").addClass("group");
        x.attr("id", group.id);
        x.data("group", group);

        var title = $("<div></div>").addClass("header").appendTo(x);
        $("<span></span>").addClass("box").addClass("time").text("<time>").appendTo(title);
        $("<span></span>").addClass("title").text(group.id + " ").appendTo(title);
        $("<span></span>")
            .addClass("box")
            .addClass("toggle")
            .addClass("entries")
            .click(ui.toggleSimpleLogList)
            .html("rec <span class='count'></span>")
            .appendTo(title);
        $("<span></span>")
            .addClass("box")
            .addClass("toggle")
            .addClass("errors")
            .click(ui.toggleErrorLogList)
            .html("err <span class='count'></span>")
            .appendTo(title);
        $("<span></span>")
            .addClass("box")
            .addClass("toggle")
            .addClass("sql")
            .click(ui.toggleSqlLogList)
            .html("sql <span class='count'></span>")
            .appendTo(title);
        x.appendTo(ui.logWindow);

        return x;
    };

    /**
     * Updates group information
     *
     * @param {EosLogGroup} group
     */
    ui.updateGroup = function updateGroup(group) {
        var groupDom = ui.getGroup(group);

        // Updating count ticker
        groupDom.children(".header").children(".entries").children(".count").text(group.count);

        // Updating count ticker
        groupDom.children(".header").find(".errors > .count").text(group.errorsCount);
        groupDom.children(".header").find(".errors").css("display", group.errorsCount === 0 ? "none" : "inline");

        // Updating count ticker
        groupDom.children(".header").find(".sql > .count").text(group.sqlCount);
        groupDom.children(".header").find(".sql").css("display", group.sqlCount === 0 ? "none" : "inline");

        // Updating time ticker
        groupDom.children(".header").children(".time").text(ui.util.formatTimeForGroup(group.lastReceivedAt));
    };

    /**
     * Builds and return DOM for log entry
     *
     * @param {EosLogEntry} entry
     * @returns {*}
     */
    ui.buildLogEntry = function buildLogEntry(entry) {
        var dom = $('<div></div>').addClass("entry");
        dom.data("entry", entry);
        $('<span></span>').addClass("index").text(entry.index + ". ").appendTo(dom);
        $('<span></span>')
            .addClass("time")
            .text(ui.util.formatTimeForEntry(entry.receivedAt))
            .click(ui.toggleEntry)
            .appendTo(dom);
        if (entry.hasException()) {
            $('<span></span>').addClass('exception').text('err').appendTo(dom);
        }
        $('<span></span>').addClass("message").text(entry.getShortMessage()).appendTo(dom);

        return dom;
    };

    ui.buildSqlEntry = function buildSqlEntry(entry) {
        var dom = $('<div></div>').addClass("entry");
        dom.data("entry", entry);
        $('<span></span>').addClass("index").text(entry.index + ". ").appendTo(dom);
        $('<span></span>')
            .addClass("time")
            .text(ui.util.formatTimeForEntry(entry.receivedAt))
            .click(ui.toggleEntry)
            .appendTo(dom);
        if (entry.hasPerformanceLog()) {
            $("<span class='var-value-float box'>" + ui.util.millisTime(entry.object.time) + "</span>").appendTo(dom);
        }
        $("<span class='var-value-sql'>" + entry.object.sql + "</span>").appendTo(dom);
        return dom;
    }

    /**
     * Hides group details
     *
     * @param {object} groupDom
     */
    ui.hideGroupChilds = function hideGroupChilds(groupDom) {
        groupDom.find('.content').remove();
    };

    /**
     * Shows simple log list
     */
    ui.toggleSimpleLogList = function toggleGroup() {
        var groupDom = $(this).parent().parent();
        var group    = groupDom.data('group');
        var content  = groupDom.find('.content');
        if (content.size() === 1 && content.attr('type') == 'simple') {
            ui.hideGroupChilds(groupDom);
        } else {
            ui.hideGroupChilds(groupDom);
            content = $("<div></div>").addClass("content").attr("type", "simple").appendTo(groupDom);
            var panel = $("<div></div>").addClass("contentPanel").appendTo(content);
            $("<span></span>").addClass("box").text("Toggle expand").click(ui.toggleSimpleLogListDetails).appendTo(panel);

            // Building
            for (var i=0; i < group.items.length; i++) {
                ui.buildLogEntry(group.items[i]).appendTo(content);
            }
        }
    };

    /**
     * Shows SQL log list
     */
    ui.toggleSqlLogList = function toggleSqlLogList() {
        var groupDom = $(this).parent().parent();
        var group    = groupDom.data('group');
        var content  = groupDom.find('.content');
        if (content.size() === 1 && content.attr('type') == 'sql') {
            ui.hideGroupChilds(groupDom);
        } else {
            ui.hideGroupChilds(groupDom);
            content = $("<div></div>").addClass("content").attr("type", "sql").appendTo(groupDom);
            var panel = $("<div></div>").addClass("contentPanel").appendTo(content);
            $("<span></span>").addClass("box").text("Toggle expand").click(ui.toggleSimpleLogListDetails).appendTo(panel);

            // Building
            for (var i=0; i < group.items.length; i++) {
                if (!group.items[i].hasSql()) {
                    continue;
                }
                ui.buildSqlEntry(group.items[i]).appendTo(content);
            }
        }
    };

    /**
     * Shows Error log list
     */
    ui.toggleErrorLogList = function toggleErrorLogList() {
        var groupDom = $(this).parent().parent();
        var group    = groupDom.data('group');
        var content  = groupDom.find('.content');
        if (content.size() === 1 && content.attr('type') == 'error') {
            ui.hideGroupChilds(groupDom);
        } else {
            ui.hideGroupChilds(groupDom);
            content = $("<div></div>").addClass("content").attr("type", "error").appendTo(groupDom);
            var panel = $("<div></div>").addClass("contentPanel").appendTo(content);
            $("<span></span>").addClass("box").text("Toggle expand").click(ui.toggleSimpleLogListDetails).appendTo(panel);

            // Building
            for (var i=0; i < group.items.length; i++) {
                if (!group.items[i].hasException()) {
                    continue;
                }
                ui.buildLogEntry(group.items[i]).appendTo(content);
            }
        }
    };

    /**
     * Callback, that toggles visibility of details inside group
     */
    ui.toggleSimpleLogListDetails = function toggleSimpleLogListDetails() {
        var details = $(this).parent().parent().find('.entry .details');
        if (details.size() > 0) {
            details.remove();
        } else {
            $(this).parent().parent().find('.entry .time').each(function (i,o) {$(o).click();});
        }
    };

    /**
     * Callback, that toggles visibility of details inside log entry
     */
    ui.toggleEntry = function toggleEntry() {
        var o = $(this).parent();
        var entry = o.data('entry');

        var details = o.find(".details");
        if (details.size() == 0) {
            ui.buildEntryDetails(entry).appendTo(o);
        } else {
            details.remove();
        }
    };

    /**
     * Builds and returns DOM of log entry details
     *
     * @param {EosLogEntry} entry
     * @returns {*}
     */
    ui.buildEntryDetails = function buildEntryDetails(entry) {
        var dom = $('<div></div>').addClass("details");

        $("<span class='var-name-internal'>Eos ID</span><span class='var-value'>" + entry.getId() + "</span><br />").appendTo(dom);
        $("<span class='var-name-internal'>Key</span><span class='var-value'>" + entry.key.key + "</span><br />").appendTo(dom);
        if (entry.key.tags.length > 0) {
            $("<span class='var-name-internal'>Tags</span><span class='var-value'>" + entry.key.tags.join(", ") + "</span><br />").appendTo(dom);
        }

        if (_.isObject(entry.object)) {
            // Building data details

            if (entry.object.time || entry.object.count) {
                if (entry.object.time) {
                    $("<span class='var-name'>Time</span><span class='var-value-float'>" + ui.util.millisTime(entry.object.time) + "</span>").appendTo(dom);
                }
                if (typeof entry.object.count != 'undefined') {
                    $("<span class='var-name'>Count</span><span class='var-value-int'>" + entry.object.count + "</span>").appendTo(dom);
                }
                $("<br />").appendTo(dom);
            }
            if (entry.object.sql) {
                $("<span class='var-name'>SQL</span><span class='var-value-sql'>" + entry.object.sql + "</span><br />").appendTo(dom);
            }
            if (entry.object.exception) {
                $("<span class='var-name'>Exception</span><span class='var-value-exception'>" + entry.object.exception.message + "</span><br />").appendTo(dom);
                for (var i=0; i < entry.object.exception.trace.length; i++ ) {
                    $("<span class='var-trace-line'></span>").text(entry.object.exception.trace[i].line).appendTo(dom);
                    $("<span class='var-trace-file'></span>").text(entry.object.exception.trace[i].file).appendTo(dom);
                    $("<br />").appendTo(dom);
                }
            }

            // Iterating over other fields
            for (var index in entry.object) {
                if (index == 'eos-id' || index == 'message' || index == 'time' || index == 'sql' || index == 'count' || index == 'exception') {
                    // already displayed
                    continue;
                }
                $("<span class='var-name'>" + index + "</span><span class='var-value'>" + entry.object[index] + "</span><br />").appendTo(dom);
            }
        }

        return dom;
    };

    /**
     * Formats time using default Eos formatter
     *
     * @param {Date} date
     */
    ui.util.formatTimeForGroup = function formatTimeForGroup(date) {
        return ui.util.lz(date.getHours()) + ":" + ui.util.lz(date.getMinutes()) + ":" + ui.util.lz(date.getSeconds());
    };

    /**
     * Formats time delta
     *
     * @param {float} floatTime
     */
    ui.util.millisTime = function millisTime(floatTime) {
        if (floatTime > 5) {
            return floatTime.toFixed(1);
        } else if (floatTime > 0.01) {
            return floatTime.toFixed(3);
        } else {
            return floatTime.toFixed(4);
        }
    }

    /**
     * Formats time using default Eos formatter
     *
     * @param {Date} date
     */
    ui.util.formatTimeForEntry = function formatTimeForEntry(date) {
        return  ui.util.lz(date.getSeconds()) + "." + ui.util.lz(date.getMilliseconds(), 3);
    };

    /**
     * Utility method to insert leading zeroes
     *
     * @param {int} num
     * @param {int} places
     * @returns {string}
     */
    ui.util.lz = function lz(num, places) {
        if (!places) places = 2;
        var zero = places - num.toString().length + 1;
        return new Array(+(zero > 0 && zero)).join("0") + num;
    }

    return ui;
});