const DEEW = require('./deew.node');
const path = require('path');
const fs = require('fs');
const os = require('os');
const url = require('url');
const Events = require('events');
const http = require('http');
const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const ccxt = require ('ccxt');
const schedule = require('node-schedule');
const {	Worker } = require("worker_threads");

console.log('-------------------------------------------------------------------------');
const deew = new DEEW();
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
var mongo, accounts = [], positions = {}, pids = 0, accsUpdate = false;
var bin = new ccxt.binance({options:{'defaultType':'future'}});;


// mongo startup stuff ...
MongoClient.connect('mongodb://127.0.0.1:27017', async function (err, res)
{
    try
    {
        mongo = res.db("smart-trade-server");
        let configs_ = mongo.collection('configs');
    
        let res_1 = await configs_.findOne({'name':'password'});
        if(res_1 == null)
            await configs_.insertOne({'name':'password', 'value':'Pass$123'});
        
        let res_2 = await configs_.findOne({'name':'session'});
        if(res_2 == null)
            await configs_.insertOne({'name':'session', 'value':'some-session-come-here'});
        
        let res_3 = await configs_.findOne({'name':'main-account'});
        if(res_3 == null)
            await configs_.insertOne({'name':'main-account', 'value':'some-account-name'});
        
        UpdateAccounts();
        console.log('> mongo has connected!');
        openup();
    }
    catch (error)
    {
        console.log('> mongo err ' + err.code + ': ' + err.message);
    }
});

async function openup()
{
    let key = 'Lbq9CdM34GLqQZ79pWaXH4nZv4Vvyen6ZyGNpdnzhosUmCn6Lx8SVvHDRP2gTH8o';
    let sec = 'iaFnEeHkL7ShD7WEO80myeWYv6GZhtJgaDOQbcLEi0zrwp6bvVI8D39a7t991IpR';
    let acc = new ccxt.binance({options:{'defaultType':'future'}, apiKey: key, secret: sec});
    console.log((await acc.fetchBalance()).USDT.total);

    let ords = await acc.fetchOrders('BTCUSDT');
    ords.forEach(async o =>
    {
        if(o.status != 'closed' && o.status != 'canceled')
        {
            console.log(o);
            //await acc.cancelOrder(o.id, 'BTCUSDT');
        }
    });

    let poss = await acc.fetchPositions();
    poss.forEach(async p =>
    {
        if(p.info.entryPrice > 0)
        {
            console.log(p);
            //await acc.createMarketOrder(p.info.symbol, p.side == 'long' ? 'sell' : 'buy', p.contracts);
        }
    });

    let key2 = 'KMGKgdKXIEmwCNUZKB';
    let sec2 = 'BtEbnBVTL1QPHwHeo1InZgYrrLbjZeUgNIzs';
    let acc2 = new ccxt.bybit({options:{'defaultType':'future'}, apiKey: key2, secret: sec2});
    console.log((await acc2.fetchBalance()).USDT.total);
    //console.log(acc2.has);
    
    let key3 = '86d65e8a-6b83-424c-9e95-358a7aa60560';
    let sec3 = '6FDD545AE67B4C4431D8CE6C0226789F';
    let pass = '912#Test';
    let acc3 = new ccxt.okex({options:{'defaultType':'future'}, apiKey: key3, secret: sec3, password: pass});
    console.log((await acc3.fetchBalance()).USDT.total);

    //console.log(JSON.stringify(await bin.fetchOHLCV ('BTCUSDT', timeframe = '5m', limit = 300)));
    const job_trades = schedule.scheduleJob('* * * * * *', HandleTrades);
    const job = schedule.scheduleJob('* * * * * *', async () => 
    {
        //console.log(fetchOHLCV ('BTCUSDT', timeframe = '5m', limit = 300));
        //console.log((await bin.fetchTicker ('BTCUSDT')).close);
    });
} 


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
app.post('/API', async (req, res) =>
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
    while(mongo == null || mongo == undefined) {}
    let job = { "ok": false, "message": "GENERAL_ERROR" };
    let configs_ = mongo.collection('configs');
    let accounts_ = mongo.collection('accounts');
    let strategys_ = mongo.collection('strategys');
    let res, vals, ok, done = false;
    if (arg.q)
    {
        switch (arg.q)
        {
            case 'AUTHORISE_NEW':
                job = { "ok": false, "message": "WRONG_PASSWORD" };
                res = await configs_.findOne({'name':'password'});
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
                res = await configs_.findOne({'name':'session'});
                if(res && res.value == arg.session)
                    job = { "ok": true, "message": "AUTHORISE_TRUE" };
                break;

            case 'SET_OPTION':
                break;

            case 'GET_OPTION':
                break;

            case 'SET_ACCOUNT':
                job = { "ok": false, "message": "SET_ACCOUNT_ERROR" };
                res = await accounts_.findOne({'name':arg.name});
                vals = {
                    'name':arg.name,
                    'broker':arg.broker,
                    'mine':arg.mine,
                    'active':arg.active,
                    'qty':arg.qty,
                    'qty2':arg.qty2,
                    'key':arg.key,
                    'secret':arg.secret
                }
                ok = deew.IsNumeric(vals.qty) && vals.name.replace(' ', '').length >= 1 && vals.key.replace(' ', '').length >= 1 && vals.secret.replace(' ', '').length >= 1;

                if(ok)
                {
                    if(arg.main)
                        await configs_.updateOne({'name':'main-account'}, {$set:{'value':arg.name}});

                    if(res)
                        res = await accounts_.updateOne({'name':arg.name}, {$set:vals});
                    else
                        res = await accounts_.insertOne(vals);

                    if(res.acknowledged)
                        job = { "ok": true, "message": "SET_ACCOUNT_TRUE" };
                }
                else
                    job = { "ok": false, "message": "ERROR_WRONG_VALUE" };
                
                UpdateAccounts();
                break;

            case 'DELETE_ACCOUNT':
                res = await accounts_.deleteOne({'name':arg.name});
                if(res.acknowledged)
                    job = { "ok": true, "message": "DELETE_ACCOUNT_TRUE" };
                
                UpdateAccounts();
                break;

            case 'GET_ACCOUNT_LIST':
                job = { "ok": false, "message": "ERROR_ACCOUNTS_UPDATING" };
                if(accsUpdate)
                {
                    res = {};
                    res.main = (await configs_.findOne({'name':'main-account'})).value;
                    res.list = accounts;
                    
                    job = { "ok": true, "message": res };
                }
                break;

            case 'SET_STRATEGY':
                job = { "ok": false, "message": "SET_STRATEGY_ERROR" };
                res = await strategys_.findOne({'name':arg.name});
                vals = {...arg};
                delete vals.q;

                ok = deew.IsNumeric(vals.sp) && vals.name.replace(' ', '').length >= 1;
                if(vals.rf_check)
                    ok = ok && deew.IsNumeric(vals.rf) && vals.rf >= 1 && vals.rf <= 10;
                if(vals.rf_dynamic_check)
                    ok = ok && deew.IsNumeric(vals.rf_dynamic) && vals.rf_dynamic >= 1 && vals.rf_dynamic <= 10;
                if(vals.trailing_check)
                    ok = ok && deew.IsNumeric(vals.trailing) && vals.trailing >= 0.01 && vals.trailing <= 100;
                
                let sum_qty = 0;
                for (let i = 1; i <= 10; i++)
                {
                    if(vals['tp_c_'+i])
                    {
                        ok = ok && deew.IsNumeric(vals['tp_q_'+i]) && deew.IsNumeric(vals['tp_p_'+i]);
                        if(ok)
                            sum_qty += vals['tp_q_'+i];
                    }
                    else
                        break;
                }

                if(ok)
                {
                    if(sum_qty <= 100)
                    {
                        if(res)
                            res = await strategys_.updateOne({'name':arg.name}, {$set:vals});
                        else
                            res = await strategys_.insertOne(vals);
                        job = { "ok": true, "message": "SET_STRATEGY_TRUE" };
                    }
                    else
                        job = { "ok": false, "message": "ERROR_WRONG_QTY" };
                }
                else
                    job = { "ok": false, "message": "ERROR_WRONG_VALUE" };

                break;

            case 'DELETE_STRATEGY':
                res = await strategys_.deleteOne({'name':arg.name});
                if(res.acknowledged)
                    job = { "ok": true, "message": "DELETE_STRATEGY_TRUE" };
                break;

            case 'GET_STRATEGY_LIST':
                res = await strategys_.find({}).toArray();
                if(res)
                    job = { "ok": true, "message": res };
                break;

            case 'ADD_POSITION':
                let p = {};
                vals = {...arg};
                delete vals.q;

                res = (await configs_.findOne({'name':'main-account'})).value;
                p.vals = vals;
                p.accounts = [];
                p.fill = 0;
                p.total = 0;
                
                ok = deew.IsNumeric(p.vals.lev) && deew.IsNumeric(p.vals.qty);
                Object.keys(positions).forEach(async (f, i) =>
                {
                    let fe = positions[f];
                    if(fe.vals.symbol == fe.vals.symbol)
                    {
                        job = { "ok": false, "message": "ERROR_SYMBOL_DUPLICATE" };
                        ok = false;
                    }
                });

                if(!accsUpdate)
                {
                    job = { "ok": false, "message": "ERROR_ACCOUNTS_UPDATING" };
                    ok = false;
                }

                if(ok)
                {
                    accounts.forEach(async (acc, i) =>
                    {
                        try
                        {
                            acc.balance = (await acc.api.fetchBalance()).USDT.total;
                            let a = {...acc};
                            p.edited = Date.now();
                            p.tickerSp = false;
                            p.tickerTp = 1;

                            let flags = (p.vals.access == "All Account's") ||  (p.vals.access == "Main Account" && a.name == res.value) ||  (p.vals.access == "My Account's" && a.mine)
                            if(a.active && flags && ok)
                            {
                                    await a.api.setMarginMode('isolated', p.vals.symbol);
                                    await a.api.setLeverage(p.vals.lev, p.vals.symbol);
                                    
                                    let qtyUsd = a.qty2 == '$' ? a.qty : a.qty * a.balance / 100;
                                    let amount = qtyUsd / p.vals.entry * p.vals.lev;
                                    
                                    if(p.vals.en_limit)
                                        a.order = (await a.api.createLimitOrder(p.vals.symbol, p.vals.side == 'LONG' ? "buy" : "sell", amount, p.vals.entry)).id;
                                    else
                                        a.order = (await a.api.createMarketOrder(p.vals.symbol, p.vals.side == 'LONG' ? "buy" : "sell", amount, p.vals.entry)).id;

                                    p.total++;
                                    p.accounts.push(a);
                            }
                        }
                        catch (error)
                        {
                            console.log('> position err:', error.message);
                        }

                        if(i == accounts.length-1)
                        {
                            if(p.accounts.length > 0)
                                positions['p'+(pids++)] = p;
                            console.log('ADD_POSITION', positions);
                        }
                    });
                //while(!done){}

                    job = { "ok": true, "message": "ADD_POSITION_TRUE" };
                }
                break;

            case 'EDIT_POSITION':
                break;

            case 'GET_POSITION_LIST':
                job = { "ok": true, "message": positions };
                break;

            case 'CLOSE_POSITION':
                break;

            case 'CLOSE_POSITION_ALL':
                break;

            case 'GET_HISTORY':
                break;

            case 'GET_OHLCV':
                let ohlcv = (JSON.stringify(await bin.fetchOHLCV(arg.symbol, arg.timeframe, undefined, 300)));
                job = { "ok": true, "message": ohlcv };
                break;

            case 'GET_URL':
                job = { "ok": true, "message": await deew.LoadURL_Async(arg.url) };
                break;

            default:
                job = { "ok": false, "message": "WRONG_QUARRY" };
                break;
        }
    }
    else
        job = { "ok": false, "message": "EMPITY_QUARRY" };
    
    console.log(arg.q, job.ok);
    return job;
}


async function UpdateAccounts()
{
    accsUpdate = false;
    let accounts_ = mongo.collection('accounts');
    accs = await accounts_.find({}).toArray();

    accs.forEach(async (a, i) =>
    {
        try
        {
            if(a.broker == "Binance")
                a.api = new ccxt.binance({options:{'defaultType':'future'}, apiKey: a.key, secret: a.secret});
            if(a.broker == "Bybit")
                a.api = new ccxt.bybit({options:{'defaultType':'future'}, apiKey: a.key, secret: a.secret});
            if(a.broker == "OKEX")
                a.api = new ccxt.okex({options:{'defaultType':'future'}, apiKey: a.key, secret: a.secret, password: a.pass});
    
            a.balance = (await a.api.fetchBalance()).USDT.total;
        }
        catch (error) {}

        if(i == accs.length-1)
        {
            accounts = accs;
            accsUpdate = true;
        }
    });

}



async function HandleTrades()
{
    Object.keys(positions).forEach(async (f, i) =>
    {
        let fe = positions[f];
        let now = (await bin.fetchTicker (fe.vals.symbol)).close;
        let time = Date.now();
        console.log(fe.vals.symbol, now);

        if(time > fe.edited + 5000)
        {
            let itsLong = fe.vals.side == 'LONG';

            if(now < fe.vals.entry == itsLong)
            {
                if(!fe.tickerSp)
                {

                    fe.tickerSp = true;
                }
            }
            else
            {
                fe.tickerSp = false;
                for (let i = 1; i <= 10; i++)
                {
                    if(fe.vals['tp_p_'+i])
                    {

                    }
                    else
                        break;
                }
            }
        }
    });
}