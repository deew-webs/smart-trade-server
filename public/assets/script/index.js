const deew = new DEEW();
var api = window.location.href.replace(window.location.hash, "") + 'API/';
var session = deew.GetCookieByName('__s');
toastr.options = __c_toastOntions;


//-- onload stuff  -->  (call other functions...)
document.body.onload = function f()
{
    funcOnLoaded();
    funcListAccount();
    document.getElementById('a-button-save').addEventListener('click', funcUpdateAccount);
    document.getElementById('s-button-save').addEventListener('click', funcUpdateStrategy);
}


//-- startup stuff  -->  (for authorise)
function funcOnLoaded()
{
    //-- session
    if(session == null)
    {
        session = md5(Date.now());
        document.cookie = '__s=' + session + '; path=/;';
    }

    let __json = {'q' : 'AUTHORISE_CHECK', 'session' : session};
    deew.PostURL(api, __json, (code, res) =>
    {
        if(code != 200 || res.ok == false)
            window.location.href = './VERIFY';
        else
            toastr["success"]("You're verifyed successfully!", "Authorise State");
    });
    
    //-- remove ad
    var inter = setInterval(() =>
    {
        if(document.getElementsByClassName('w-webflow-badge')[0])
            document.getElementsByClassName('w-webflow-badge')[0].remove();
    }, 1);

    setTimeout(() =>
    {
        clearInterval(inter);
    }, 10000);
    
    //-- charts
    new TradingView.widget(__c_tradingview);
    document.getElementById('a-tab-chart-1').insertAdjacentHTML('beforeend', __c_tradeTools);
    DoIT();
}


//-- edit or new account
function funcUpdateAccount()
{
    let name = document.getElementById('a-input-name').value;
    let broker = document.getElementById('a-drop-broker-txt').innerText;
    let main = document.getElementById('a-check-its-main').checked;
    let mine = document.getElementById('a-check-its-mine').checked;
    let active = document.getElementById('a-check-active').checked;
    let qty = document.getElementById('a-input-qty').value;
    let key = document.getElementById('a-input-key').value;
    let secret = document.getElementById('a-input-secret').value;

    let __json = {'q' : 'SET_ACCOUNT', 'name' : name, 'broker' : broker, 'main' : main, 'mine' : mine, 'active' : active, 'key' : key, 'qty' : qty, 'secret' : secret};
    deew.PostURL(api, __json, (code, res) =>
    {
        if(code == 200)
        {
            if(res.ok == true)
            {
                toastr["success"]("Account updated successfully!", "Account's");
                funcListAccount();
            }
            else
                toastr["error"](res.message, "Account's");
        }
        else
            toastr["error"]("Connection error ...!", "Account's");
    });
}


//-- edit or new account
function funcListAccount()
{
    let __json = {'q' : 'GET_ACCOUNT_LIST', 'session' : session};
    deew.PostURL(api, __json, (code, res) =>
    {
        if(code == 200)
        {
            if(res.ok == true)
            {
                document.getElementById('a-div-accounts').innerHTML = "";
                res.message.forEach((acc, i) =>
                {
                    let mee = __c_accountItem.replace('[ID]', 'a-item-'+i);
                    mee = mee.replace('[NAME]', acc.name);
                    document.getElementById('a-div-accounts').insertAdjacentHTML('beforeend', mee);
                    document.getElementById('a-item-'+i).onclick = () =>
                    {

                    }
                });
            }
            else
                toastr["error"](res.message, "Account's");
        }
        else
            toastr["error"]("Connection error ...!", "Account's");
    });
}


//-- edit or new strategy
function funcUpdateStrategy()
{
    
}