var http = require('http');
var fs = require('fs');
var path = require('path');

var PORT = process.env.PORT || 3000;

function resolveFilePath(requestUrl) {
    var urlPath = requestUrl.split('?')[0];
    var filePath = '.' + urlPath;

    // GitHub Pages serves from /Net-Worth/; map those URLs to repo root paths locally
    if (filePath.indexOf('./Net-Worth/') === 0) {
        filePath = '.' + filePath.slice('./Net-Worth'.length);
    }

    if (filePath === './' || filePath === './index.html') {
        return './index.html';
    }
    if (filePath === './Net-Worth' || filePath === './Net-Worth/') {
        return './index.html';
    }
    if (filePath === './profile' || filePath === './profile/') {
        return './profile/index.html';
    }

    if (!path.extname(filePath) && fs.existsSync(filePath + '/index.html')) {
        return filePath + '/index.html';
    }

    return filePath;
}

function redirectWithSlash(request, response, urlPath) {
    var query = request.url.indexOf('?') >= 0 ? request.url.slice(request.url.indexOf('?')) : '';
    response.writeHead(301, { Location: urlPath + '/' + query });
    response.end();
}

function contentTypeFor(filePath) {
    switch (path.extname(filePath)) {
        case '.js':
            return 'text/javascript';
        case '.css':
            return 'text/css';
        case '.json':
            return 'application/json';
        case '.png':
            return 'image/png';
        case '.jpg':
        case '.jpeg':
            return 'image/jpeg';
        case '.wav':
            return 'audio/wav';
        default:
            return 'text/html';
    }
}

http.createServer(function (request, response) {
    var urlPath = request.url.split('?')[0];

    // /profile and /Net-Worth/profile must end with / so relative css/main.css resolves correctly
    if (urlPath === '/profile' || urlPath === '/Net-Worth/profile') {
        redirectWithSlash(request, response, urlPath);
        return;
    }

    var filePath = resolveFilePath(request.url);
    var contentType = contentTypeFor(filePath);

    fs.readFile(filePath, function (error, content) {
        if (error) {
            if (error.code === 'ENOENT') {
                response.writeHead(404, { 'Content-Type': 'text/html' });
                response.end(
                    '<!DOCTYPE html><html><body><h1>404</h1><p>Not found: ' +
                    request.url +
                    '</p></body></html>',
                    'utf-8'
                );
                return;
            }
            response.writeHead(500);
            response.end('Server error: ' + error.code + '\n');
            return;
        }
        response.writeHead(200, { 'Content-Type': contentType });
        response.end(content, 'utf-8');
    });
}).listen(PORT);

console.log('Server running at http://localhost:' + PORT + '/');
