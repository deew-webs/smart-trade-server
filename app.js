const DEEW = require('./deew.node');
const db = require('./deew.mongo');
const Exchange = require('./deew.exchange');
const path = require('path');
const fs = require('fs');
const os = require('os');
const url = require('url');
const Events = require('events');
const http = require('http');
const express = require('express');
const MongoClient = require('mongodb').MongoClient;

console.log('-------------------------------------------------------------------------');
const deew = new DEEW();
const exchange = new Exchange();
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
var mongo;

// mongo startup stuff ...
MongoClient.connect('mongodb://127.0.0.1:27017', async function (err, res)
{
    if (err) throw ('mongo err ' + err.code + ': ' + err.message);
    mongo = res.db("smart-trade-server");
    let configs_ = mongo.collection('configs');

    let res_1 = await configs_.findOne({'name':'password'});
    if(res_1 == null)
        await configs_.insertOne({'name':'password', 'value':'Pass$123'});
    
    let res_2 = configs_.findOne({'name':'session'});
    if(res_2 == null)
        await configs_.insertOne({'name':'session', 'value':'some-session-come-here'});

    console.log('> mongo has connected!');
});


// check and response url calls ...
app.get('/*', (req, res) =>
{
    let link = new url.URL('http://' + req.get('host') + req.url);
    let thePath = path.join(__dirname, 'public', link.pathname == "/" ? 'index.html' : link.pathname);
    let ext = path.extname(thePath);
    if (ext == '')
    {
        thePath = thePath + "/index.html";
        ext = ".html";
    }
    let contentType = deew.ExtToContentType(ext);

    fs.readFile(thePath, (err, data) =>
    {
        if (!err)
        {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data);
        }
        else
        {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end("<h1>Error 404 :((</h1>");
        }
    });
});
app.listen(7002, () => console.log(`> node app listening on port 7002!`));



// check and response api calls ...
app.post('/API', async function (req, res)
{
    let link = new URL('http://' + req.get('host') + req.url);
    if (link.pathname == "/API" || link.pathname == "/API/")
    {
        let resp = await HandleAPI(req.body);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(resp));
    }
});


// handle api requests ...
async function HandleAPI(arg)
{
    let job = { "ok": true, "message": {} };
    let configs_ = mongo.collection('configs');
    let accounts_ = mongo.collection('accounts');
    if (arg.q)
    {
        switch (arg.q)
        {
            case 'AUTHORISE_NEW':
                job = { "ok": false, "message": "WRONG_PASSWORD" };
                let res = await configs_.findOne({'name':'password'});
                if(res && res.value == arg.password)
                {
                    res = await configs_.updateOne({'name':'session'}, {$set:{'value':arg.session}});
                    if(res.acknowledged)
                        job = { "ok": true, "message": "AUTHORISE_TRUE" };
                    else
                        job = { "ok": false, "message": "DATABASE_ERROR" };
                }
                break;

            case 'AUTHORISE_CHECK':
                job = { "ok": false, "message": "AUTHORISE_FALSE" };
                let res_2 = await configs_.findOne({'name':'session'});
                if(res_2 && res_2.value == arg.session)
                    job = { "ok": true, "message": "AUTHORISE_TRUE" };
                break;

            case 'SET_INFO':
                break;

            case 'GET_INFO':
                break;

            case 'SET_ACCOUNT':
                job = { "ok": false, "message": "SET_ACCOUNT_ERROR" };
                let res_5 = await accounts_.findOne({'name':arg.name});
                let vals_5 = {
                    'name':arg.name,
                    'broker':arg.broker,
                    'main':arg.main,
                    'mine':arg.mine,
                    'active':arg.active,
                    'qty':arg.qty,
                    'key':arg.key,
                    'secret':arg.secret
                }

                if(res_5)
                    res_5 = await accounts_.updateOne({'name':arg.name}, {$set:vals_5});
                else
                    res_5 = await accounts_.insertOne(vals_5);

                if(res_5.acknowledged)
                    job = { "ok": true, "message": "SET_ACCOUNT_TRUE" };
                break;

            case 'DELETE_ACCOUNT':
                break;

            case 'GET_ACCOUNT_LIST':
                let res_7 = await accounts_.find({}).toArray();
                if(res_7)
                    job = { "ok": true, "message": res_7 };
                break;

            case 'SET_STRATEGY':
                break;

            case 'DELETE_STRATEGY':
                break;

            case 'GET_STRATEGY_LIST':
                job.message["count"] = 2;
                job.message["arr"] = {};
                job.message["arr"][0] = { "ip": "1.1.1.1", "port": 9900 };
                job.message["arr"][1] = { "ip": "2.2.2.2", "port": 8800 };
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

            case 'GET_URL':
                break;

            default:
                job = { "ok": false, "message": "WRONG_QUARRY" };
                break;
        }
    }
    else
        job = { "ok": false, "message": "EMPITY_QUARRY" };
    
    console.log(job);
    return job;
}
