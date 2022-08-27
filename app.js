const DEEW = require('./deew.node');
const db = require('./deew.db');
const Exchange = require('./deew.exchange');
const path = require('path');
const fs = require('fs');
const os = require('os');
const url = require('url');
const Events = require('events');
const http = require('http');
const express = require('express');

console.log('-------------------------------------------------------------------------');
const deew = new DEEW();
const exchange = new Exchange();
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/*', (req, res) =>
{
    let link = new url.URL('http://' + req.get('host') + req.url);
    let thePath = path.join(__dirname, 'public', link.pathname == "/" ? 'index.html' : link.pathname);
    let ext = path.extname(thePath);
    let contentType = deew.ExtToContentType(ext);

    fs.readFile(thePath, (err, data) =>
    {
        if(!err)
        {
            res.writeHead(200, { 'Content-Type' : contentType });
            res.end(data);
        }
        else
        {
            res.writeHead(404, { 'Content-Type' : 'text/html' });
            res.end("<h1>Error 404 :((</h1>");
        }
    });
});
app.listen(7002, () => console.log(`Example app listening on port 7002!`));

app.post('/API', function (req, res)
{
    let link = new URL('http://' + req.get('host') + req.url);
    if(link.pathname == "/API" || link.pathname == "/API/")
    {
        let resp = HandleAPI(req.body);
        res.writeHead(200, { 'Content-Type' : 'application/json' });
        res.end(JSON.stringify(resp));
    }
});

function HandleAPI (arg)
{
    let job = {"status" : "ok", "message" : {}};
    if(arg.q)
    {
        switch (arg.q)
        {
            case 'AUTHORISE_MEW':
                break;
            case 'AUTHORISE_CHECK':
                break;
            case 'SET_INFO':
                break;
            case 'GET_INFO':
                break;
            case 'SET_ACCOUNT':
                break;
            case 'DELETE_ACCOUNT':
                break;
            case 'GET_ACCOUNT_LIST':
                break;
            case 'SET_STRATEGY':
                break;
            case 'DELETE_STRATEGY':
                break;
            case 'GET_STRATEGY_LIST':
                job.message["count"] = 2;
                job.message["arr"] = {};
                job.message["arr"][0] = { "ip" : "1.1.1.1", "port" : 9900};
                job.message["arr"][1] = { "ip" : "2.2.2.2", "port" : 8800};
                break;
            case 'ADD_POSITION':
                break;
            case 'EDIT_POSITION':
                break;
            case 'CLOSE_POSITION':
                break;
            case 'CLOSE_POSITION_ALL':
                break;
            case 'GET_HISTORY':
                break;
            
            default:
                job = {"status" : "error", "message" : "WRONG_QUARRY"};
                break;
        }
    }
    else
        job = {"status" : "error", "message" : "EMPITY_QUARRY"};
    return job;
}




/*
xhr = new XMLHttpRequest();
xhr.open("POST", "http://127.0.0.1:9900/API/", true);
xhr.setRequestHeader('Content-Type', 'application/json');
xhr.onload = () => {
    if(xhr.status == 200)
    {
        var job = JSON.parse(xhr.responseText);
        console.log(job.status);
    }
};
xhr.send(JSON.stringify({'q' : 'GET_STRATEGY_LIST'}));
*/




/*
os.mkdir('DBOX', null, (err) => {
    if(!err)
        console.log("Folder Created !!!!");
    //else
        //console.log(err);
})

exchange.on('onMessage', (msg) =>
{
    console.log('Event: ', msg)
});

console.log('hi! The DBOX path is: ' + path.join(__dirname, 'DBOX'));
console.log(exchange.getExchangeName());
console.log(os.type() + " " + os.arch() + " " + os.freemem() + "/" + os.totalmem());


const goo = new URL('http://google.com');
goo.searchParams.append('active', 'true');
goo.searchParams.append('id', '1');

console.log(goo.href);
*/

