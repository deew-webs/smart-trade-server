
class DEEW
{
    ExtToContentType (ext)
    {
        let contentType = 'text/html';
        switch (ext)
        {
            case '.css':
                contentType = 'text/css';
                break;
            case '.js':
                contentType = 'text/javascript';
                break;
            case '.jpg':
                contentType = 'image/jpg';
                break;
            case '.png':
                contentType = 'image/png';
                break;
            case '.ico':
                contentType = 'image/ico';
                break;
            case '.txt': case '.ini':
                contentType = 'text/txt';
                break;
            case '.otf':
                contentType = 'font/otf';
                break;
            case '.otf':
                contentType = 'font/otf';
                break;
            case '.ttf':
                contentType = 'font/ttf';
                break;
            case '.woff':
                contentType = 'font/woff';
                break;
            case '.woff2':
                contentType = 'font/woff2';
                break;
            case '.json':
                contentType = 'application/json';
                break;
        }
        return contentType;
    }
}

module.exports = DEEW;