
var history = window.History;

var KEY = 'AIzaSyDzvGIlo_6GmdRasOTnN17hJ9rS3hx_3OA';
var CX = '015533284649053097143:eyct-samxvy';
var NEGCX = '015533284649053097143:pqe10xnvwd8';

var LABELS = [
{
    label: 'google',
    name: 'Google',
    exclude_from_add: true
}, {
    label: 'web',
    name: 'Medical Results',
    exclude_from_add: true
}, {
    label: 'original_articles',
    name: 'Original Articles'
}, {
    label: 'systematic_reviews',
    name: 'Systematic Reviews'
}, {
    label: 'case_reports',
    name: 'Case Reports',
}, {
    label: 'practice_guidelines',
    name: 'Practice Guidelines'
}, {
    label: 'position_statements',
    name: 'Position Statements'
}, {
    label: 'clinical_education',
    name: 'Clinical Education'
}, {
    label: 'calculators',
    name: 'Medical Calculators'
}, {
    label: 'news',
    name: 'Medical News'
}, {
    label: 'images',
    name: 'Images',
    exclude_from_add: true
}, {
    label: 'videos',
    name: 'Videos',
    exclude_from_add: true
}, {
    label: '_cse_exclude_eyct-samxvy',
    name: 'Eliminate',
    exclude_from_left: true,
    negative_label: true
}, {
    label: 'new',
    name: 'New',
    exclude_from_add: true
}, {
    label: 'paywall',
    name: 'Paywall',
    negative_label: true
}];

// UI components
var modes = null;
var query = null;
var results = null;
var resultNum = null;

// IE8

function parseLocation() {
    var params = {
        // NOTE(mwytock): Default to Google
        mode: 'google'
    };
    if (!location.search)
        return params;

    var vars = location.search.slice(1).split('&');
    for (var i=0; i < vars.length; i++) {
        var pair = vars[i].split('=');
        var name = decodeURIComponent(pair[0]);
        var value = decodeURIComponent(pair[1]).replace(/\+/g, ' ');
        params[name] = value;
    }
    return params;
}

function startNum(params) {
    if (params.start) {
	if (typeof(params.start) == 'string') {
	    return parseInt(params.start);
	} else {
	    return params.start;
	}
    } else {
	return 1;
    }
}

function title(params) {
    if (!params.q) return 'Stanford Medical Search';
    return params.q + ' - Stanford Medical Search';
}

// Update the params state and push it into the history which will cause the URL
// to update and trigger updateInterface().
function updateState(delta) {
    var params = history.getState().data;
    var pageturn = false;
    for (k in delta) {
	if (k == 'start') pageturn = true;
	params[k] = delta[k];
    }
    // Special case for start parameter
    if (!pageturn) params['start'] = 1;

    // NOTE(mwytock): This will update the URL whih will cause a statechange
    // event to be triggered and cause the interface to be updated.
    var url = location.pathname + '?' + $.param(params);
    history.pushState(params, title(params), url);
}

// Update the user interface elements using the state stored in params.
function updateInterface() {
    var params = history.getState().data;
    query.update(params);
    modes.update(params);
    results.update(params);
    resultNum.update(params);
    document.title = title(params);
}

var lastPin = '';
var pinTime = null;
function getLastPin() {
    var now = (new Date()).valueOf();
    if (!pinTime)
        return '';
    // Expire after 10 minutes
    if (now - pinTime > 10*60*1000)
        return '';
    return lastPin;
}

function setLastPin(pin) {
    if (!pin) return;
    lastPin = pin;
    pinTime = (new Date()).valueOf();
}

var ui = {};
ui.modes = function(root) {
    var selected = null;
    var labelToAnchor = {};
    root.html($.map(LABELS, function(x) {
	if (!x.exclude_from_left) {
            var a = $('<a>')
		.text(x.name)
		.on('click', function(e) {
                    updateState({mode: x.label});
		});
            labelToAnchor[x.label] = a;
            return $('<li>').append(a);
	}
    }));

    var el = {};
    el.update = function(params) {
        var mode = params.mode ? params.mode : 'web';
        var a = labelToAnchor[mode];
        if (selected) selected.removeClass('selected');
        a.addClass('selected');
        selected = a;
    };

    return el;
};


ui.resultNum = function(root) {
    var start = 1;
    var prev = $('<a>')
        .hide()
        .text('Prev')
        .on('click', function(e) {
	    updateState({start: start - 10})
	});
    root.append(prev);

    var next = $('<a>')
        .text('Next')
        .on('click', function(e) {
	    updateState({start: start + 10})
        });
    root.append(next);

    var el = {};
    el.update = function(params) {
        start = parseInt(params.start);
        // TODO(mwytock): Possibly enable
        //prev.toggle(start > 1);
    };

    return el;
};

ui.query = function(root) {
    var text = root.find('#query-text');

    var el = {};
    el.update = function(params) {
        if (!('q' in params)) return;
        text.val(params.q);
    };

    root.find('form').on('submit', function(e) {
        updateState({q: text.val()});
        return false;
    });

    return el;
};

ui.results = {};
ui.results.web = function(root) {
    var el = {};

    var popupScreen = $('<div>').addClass('popup-screen')
        .on('click', hidePopup)
        .hide();
    var popup = $('<div>').addClass('popup')
        .hide();

    $(document.body)
        .append(popupScreen)
        .append(popup);

    function showPopup(data) {
        popupScreen.show();

        popup.empty()
            .append($('<h1>').text('Add label'))
            .append($('<div>').addClass('result')
                    .append($('<h3>')
                            .append($('<a>').attr('href', data.link)
                                    .html(data.htmlTitle)))
                    .append($('<cite>').html(data.formattedUrl))
                    .append($('<p>')
                            .html(data.htmlSnippet.replace(/<br>/g, ''))))

        var labels = LABELS.filter(function(x) { return !x.exclude_from_add; });
        var posLabels = labels.filter(function(x) { return !x.negative_label; });
        var negLabels = labels.filter(function(x) { return x.negative_label; });
        var existingLabels = {};
        var labelsDisplay = $('<div>').addClass('label-display');

        if (data.labels) {
            $.each(data.labels, function(i, e) {
                existingLabels[e.name] = true;
            });
        }

        var form = $('<form>').addClass('add-label')
            .append($('<input>')
                    .attr('type', 'hidden')
                    .attr('name', 'url')
                    .attr('value', data.link))
            .append($('<div>').addClass('group mode')
                    .append($('<label>')
                            .append($('<input>')
                                    .attr('type', 'radio')
                                    .attr('name', 'mode')
                                    .attr('value', 'site'))
                            .append('Label entire site'))
                    .append($('<label>')
                            .append($('<input>')
                                    .attr('checked', 'true')
                                    .attr('type', 'radio')
                                    .attr('name', 'mode')
                                    .attr('value', 'page'))
                            .append('Label this page')))
            .append($('<div>').addClass('group labels')
                    .append(labelCheckboxes(negLabels, existingLabels)))
            .append($('<div>').addClass('group labels')
                    .append(labelCheckboxes(posLabels, existingLabels)))
            .append($('<div>').addClass('group pin')
                    .append($('<input>')
                            .attr('name', 'pin')
                            .attr('size', 4)
                            .attr('placeholder', 'Pin')
                            .attr('value', getLastPin())));

        var saving = false;
        popup.append(form)
            .append($('<div>').addClass('button-bar')
                    .append($('<button>').text('Save')
                            .on('click', function() {
                                if (saving) return;
                                saving = true;

                                var labelParams = [];
                                var selectedLabels = {};
                                $.each(form.serializeArray(), function(i, e) {
                                    if (e.name == 'label') {
                                        selectedLabels[e.value] = true;
                                    } else {
                                        if (e.name == 'pin')
                                            setLastPin(e.value);
                                        labelParams.push(e);
                                    }

                                });

                                $.each(labels, function(i, l) {
                                    if (!selectedLabels[l.label] && existingLabels[l.label])
                                        labelParams.push({
                                            name: 'remove',
                                            value: l.label
                                        });

                                    if (selectedLabels[l.label] && !existingLabels[l.label])
                                        labelParams.push({
                                            name: 'add',
                                            value: l.label
                                        });
                                });

                                var button = $(this);
                                button.text('Saving...');
                                $.ajax({
                                    url: '/api/label',
                                    method: 'POST',
                                    data: labelParams,
                                    success: function() {
                                        updateInterface();
                                    },
                                    error: function() {
                                        alert('Saving label failed');
                                        button.text('Save');
                                        saving = false;
                                    }
                                });
                            }))
                    .append($('<button>').text('Cancel')
                            .on('click', hidePopup)))
            .show();
    }

    function hidePopup() {
        popup.hide();
        popupScreen.hide();
    }
    // So that we can hide the popup on update.
    el.hidePopup = hidePopup;

    function labels(data) {
        var div = $('<div>').addClass('labels');
        if (data.labels && data.labels.length) {
            $.each(data.labels, function(i, e) {
                if (i != 0) div.append(' - ');
                div.append($('<a>')
                           .text(e.displayName)
                           .on('click', function() {
                               updateState({mode: e.name});
                           }));
            });
            div.append(' - ');
        }
        div.append($('<a>').text('Add label').on('click', function() {
            showPopup(data);
        }));
        return div;
    }

    function labelCheckboxes(labels, existingLabels) {
        return $.map(labels, function(l) {
            return $('<label>')
                .append($('<input>')
                        .attr('type', 'checkbox')
                        .attr('name', 'label')
                        .attr('value', l.label)
                        .attr('checked', existingLabels[l.label]))
                .append($('<span>').text(l.name));
        });
    }

    function result(data) {
        return $('<li>').addClass('result')
            .append($('<h3>')
                    .append($('<a>').attr('href', data.link)
                            .attr('target', '_blank')
                            .html(data.htmlTitle)))
            .append($('<cite>').html(data.formattedUrl))
            .append($('<p>').html(data.htmlSnippet.replace(/<br>/g, '')))
            .append(labels(data));
    }

    function spelling(data) {
        var q = data.correctedQuery.replace(/more:\w+/, '');

        return $('<p>').addClass('spelling')
            .append('Did you mean ')
            .append($('<a>').text(q)
                    .on('click', function(e) {
                        updateState({q: q});
                        return false;
                    }))
            .append('?');
    }

    function noResults(data) {
        return $('<p>')
            .append('No results for ')
            .append($('<b>').text(data.request[0].searchTerms));
    }

    el.update = function(params) {
        var query = params.q;
        if (params.mode && params.mode != 'web')
            query += ' more:' + params.mode;

        $.ajax({
            url: 'https://www.googleapis.com/customsearch/v1',
            dataType: 'jsonp',
            data: {
                key: KEY,
		start: params.start ? params.start : 1,
                cx: (params.mode == 'new' ? NEGCX : CX),
                q: query
            },
            success: function(data) {
                root.empty();

                if (data.spelling)
                    root.append(spelling(data.spelling));

                if (data.items) {
                    root.append($('<ol>').addClass('web')
                                .html($.map(data.items, result)));
                } else {
                    root.append(noResults(data.queries));
                }

                // This handles the case when search results are refreshed due
                // to the user adding a label with the popup. This should
                // probably be handled more explicitly.
                hidePopup();
            }
        });
    };

    return el;

};

ui.results.images = function(root) {
    var el = {};

    function noResults(data) {
        return $('<p>')
            .append('No results for ')
            .append($('<b>').text(data.request[0].searchTerms));
    }

    function result(data) {
        var cite = data.image.width + ' &times; ' + data.image.height + ' - ' +
            data.displayLink;
        return $('<li>')
            .append($('<a>')
                    .attr('href', data.image.contextLink)
                    .append($('<img>')
                            .attr('src', data.image.thumbnailLink))
                    .append($('<cite>').html(cite)));
    }

    function spelling(data) {
        var q = data.correctedQuery;


        return $('<p>').addClass('spelling')
            .append('Did you mean ')
            .append($('<a>').text(q)
                    .on('click', function(e) {
                        updateState({q: q});
                        return false;
                    }))
            .append('?');
    }

    el.update = function(params) {
        $.ajax({
            url: 'https://www.googleapis.com/customsearch/v1',
            dataType: 'jsonp',
            data: {
                key: KEY,
                cx: CX,
                q: params.q,
                searchType: 'image',
                imgSize: 'medium'
            },
            success: function(data) {
                root.empty();

                if (data.spelling)
                    root.append(spelling(data.spelling));

                if (data.items) {
                    root.append($('<ol>').addClass('images')
                                .html($.map(data.items, result)));
                } else {
                    root.append(noResults(data.queries));
                }
            }
        });
    };

    return el;
};

ui.results.all = function(root) {
    var el = {};

    var web = ui.results.web(root);
    var images = ui.results.images(root);

    el.update = function(params) {
        // TODO(mwytock): Better way to handle this
        web.hidePopup();
        log(params);

        // Special UI for images
        if (params.mode == 'images')
            images.update(params);
        else
            web.update(params);
    };

    function log(params) {
        $.ajax({
            url: '/api/log',
            method: 'POST',
            data: params
        });
    }

    return el;
};

var loaded = false;
$(document).ready(function() {
    modes = ui.modes($('#modes'));
    query = ui.query($('#query'));
    results = ui.results.all($('#results'));
    resultNum = ui.resultNum($('#resultNum'));

    var params = parseLocation();
    history.replaceState(params, title(params),
                         location.pathname+location.search);
    updateInterface();
    loaded = true;
});

history.Adapter.bind(window, 'statechange', function() {
    if (!loaded) return;
    updateInterface();
});
