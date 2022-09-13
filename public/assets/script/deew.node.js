// deew.node v0.0.2

class DEEW
{
    GetCookieByName(name)
    {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2)
            return parts.pop().split(';').shift();
        else
            return null;
    }

    LoadURL(link, callback)
    {
        let xhr = new XMLHttpRequest();
        xhr.open("GET", link, false);
        xhr.onload = () =>
        {
            if(xhr.status == 200)
                callback(true, xhr.responseText);
            else
                callback(false, xhr.responseText);
        };
        xhr.send();
    }

    PostURL(link, jsonParms, callback)
    {
        let xhr = new XMLHttpRequest();
        xhr.open("POST", link, false);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.onload = () =>
        {
            callback(xhr.status, JSON.parse(xhr.responseText));
        };
        xhr.onerror = () =>
        {
            callback(xhr.status, {});
        };
        xhr.send(JSON.stringify(jsonParms));
    }

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

//module.exports = DEEW;