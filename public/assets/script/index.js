function doTab(tab, item)
{
    var arr = document.getElementsByClassName('tab-' + tab)[0].getElementsByClassName('item');
    for(var i=0; i<arr.length; i++)
    {
        arr[i].setAttribute('class', arr[i].getAttribute('class').replace('active', ''));
        if(arr[i].getAttribute('data-tab') == item)
            arr[i].setAttribute('class', arr[i].getAttribute('class') + ' active');
    }

    var arr = document.getElementsByClassName('segment-' + tab);
    for(var i=0; i<arr.length; i++)
    {
        arr[i].setAttribute('class', arr[i].getAttribute('class').replace('active', ''));
        if(arr[i].getAttribute('data-tab') == item)
            arr[i].setAttribute('class', arr[i].getAttribute('class') + ' active');
    }
}