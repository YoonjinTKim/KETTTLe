 $('input[type=file]').on('change', function() {
    var fileName = $(this).val();
    $(this).next('.custom-file-label').html(fileName);
});

$('input#select-job-box').on('change', function() {
    var query = queryStringToJSON();
    var jobId = $(this).data('job-id');
    if (this.checked) {
        query[jobId] = true
    } else {
        delete query[jobId]
    }
    window.history.pushState({} , '', '?' + $.param(query));
});

$('a.page-link').on('click', function(event) {
    // Prevent redirect
    event.preventDefault();

    var query = queryStringToJSON();
    delete query.page

    var original = $(this).attr('href');
    var url = location.origin + original;
    var params = $.param(query);
    if (params.length) {
        url += '&' + params
    }
    window.location.href = url;
});

$('button.compare-button').on('click', function() {
    var query = queryStringToJSON();
    delete query.page

    if (Object.keys(query).length < 2) {
        alert('Select at least two jobs to compare');
    } else {
        window.location.href = location.origin + '/jobs/compare?' + $.param(query);
    }
});

function queryStringToJSON() {
    if (!location.search.length) return {};
    var pairs = location.search.slice(1).split('&');

    var result = {};
    pairs.forEach(function(pair) {
        pair = pair.split('=');
        result[pair[0]] = decodeURIComponent(pair[1] || '');
    });

    return JSON.parse(JSON.stringify(result));
}