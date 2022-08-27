
// let metaData = {
//   information:"",
//   symbol:"",
//   lastRefresh:"",
//   outputSize:"",
//   timeZone:""
// }

let candleOhlcMappings = [];
let info =
{
  yMin: [],
  xMin: [],
  yMax: [],
  xMax: [],
  l: 0,
  h: 0,
  minDate: "",
  maxDate: "",
}

var w = window.innerWidth - 150;
var h = 400;
var canvas;
var ctx;
var centerPoint;
var boundaries;

//amount of grid lines to evenly distribute for each axis
var xLines = 8;
var yLines = 10;

function DoIT()
{
  canvas = document.getElementById("myCanvas");
  canvas.width = w;
  canvas.height = h;
  ctx = canvas.getContext("2d");
  centerPoint = [w / 2, h / 2];
  boundaries = [w - 50, h - 50];
  
  //DownAlphavantage();
  //DownBinance();
  //setInterval(DownBinance, 1000);

  canvas.addEventListener('mouseleave', function (evt) { UpdateChart(); });
  canvas.addEventListener('mousemove', function (evt) { MouseMove(evt); });
  $(".myDrag").draggable({containment: "parent", start: noop, drag: draged, stop: noop});
}

/*$(document).ready(function ()
{
  DoIT();
});*/




function getTimeslots(ohlc)
{
  let count = w / ohlc.length;
  return count;
}

let drawLine = (x, y, style = undefined, dashed = undefined) =>
{
  if(dashed)
    ctx.setLineDash([5, 10]);
  else
   ctx.setLineDash([0, 0]);
  
  ctx.beginPath();
  if (style)
    ctx.strokeStyle = style

  ctx.moveTo(x[0], x[1]);
  ctx.lineTo(y[0], y[1]);
  ctx.stroke();
}

// 0 time
// 1 open
// 2 high
// 3 low
// 4 close
//DRAW CANDLESTICKS
function drawCandles()
{
  let timeSlot = getTimeslots(ohlc);
  let idx = 0;

  for (var candle of ohlc)
  {
    //x = maxPx - ((price - minPrice)/(maxPrice-minPrice)*maxPx)
    let calculatePosition = (price) =>
    {
      let maxPx = info.yMax[1]
      let x = maxPx - ((price - lp) / (hp - lp) * maxPx);
      return x;
    }

    let open = candle[1]
    let low = candle[3]
    let close = candle[4]
    let high = candle[2]

    // y axis value for each price point
    let openPosition = Math.floor(calculatePosition(open));
    let lowPosition = Math.floor(calculatePosition(low));
    let highPosition = Math.floor(calculatePosition(high));
    let closePosition = Math.floor(calculatePosition(close));

    //pixel for candle center along x axis
    let currentStep = Math.floor(idx * timeSlot);

    if (openPosition > closePosition) //x,y,w,h
    {
      //deaw cube #089981
      let height = openPosition - closePosition;
      ctx.fillStyle = "#089981";
      ctx.fillRect(currentStep - 5, closePosition, 10, height);
      //deaw line
      drawLine([currentStep, lowPosition], [currentStep, highPosition], "#089981");
      //deaw border
      ctx.strokeStyle = "#089981"
      ctx.beginPath();
      ctx.rect(currentStep - 5, closePosition, 10, height);
      ctx.stroke();
    }
    else
    {
      //deaw cube #f23645
      let height = closePosition - openPosition;
      ctx.fillStyle = "#f23645";
      ctx.fillRect(currentStep - 5, openPosition, 10, height);
      //deaw line
      drawLine([currentStep, lowPosition], [currentStep, highPosition], "#f23645");
      //deaw border
      ctx.strokeStyle = "#f23645"
      ctx.beginPath();
      ctx.rect(currentStep - 5, openPosition, 10, height);
      ctx.stroke();
    }
    candleOhlcMappings.push({ idx: idx, step: currentStep, positions: { openPosition: openPosition, lowPosition: lowPosition, highPosition: highPosition, closePosition: closePosition } });
    idx++;
  }
}

// CALCULATE AMOUNT OF ROWS TO FIT IN GRID
function calculateSteps()
{
  //calculate horizontal lines across the Y axis
  let yDist = h / xLines;
  let yStep = yDist;
  let ySteps = [yStep];
  let yCount = 0;

  while (yCount != xLines)
  {
    yCount++
    yStep += yDist;
    ySteps.push(Math.floor(yStep));
  }

  //calculate vertical lines along the X axis
  let xDist = w / yLines;
  let xStep = xDist;
  let xSteps = [xStep];

  let xCount = 0;

  while (xCount < yLines)
  {
    xCount++;
    xStep += xDist;
    xSteps.push(Math.floor(xStep));
  }
  info.yMin = [0, 0]
  info.yMax = [0, ySteps[ySteps.length - 1]];
  info.xMin = [0, 0];
  info.xMax = [xSteps[xSteps.length - 1], 0];
  return [xSteps, ySteps];
}

//DRAW GRID
function createGrid()
{
  let drawHorizontal = (yPoints) =>
  {
    drawLine([0, 0], [w, 0]);
    for (var point of yPoints)
    {
      var diff = hp - lp;
      linePrice = hp - (diff * point / h);
      const ele = document.createElement("div");
      ele.setAttribute('class', 'myPrice');
      ele.setAttribute('style', 'width: 50px; height: 20px; text-align: center; position: absolute; top: ' + (point + 5) + 'px;');
      ele.innerText = Math.floor(linePrice);
      document.getElementById('myPrices').appendChild(ele);

      drawLine([0, point], [w, point], "#30343d")
    }
  }

  let drawVertical = (xPoints) =>
  {
    drawLine([0, 0], [0, h]);
    for (var point of xPoints)
      drawLine([point, h], [point, 0], "#30343d")
  }

  let steps = calculateSteps();

  drawVertical(steps[0])
  drawHorizontal(steps[1])
  return steps;
}

function getPosCompareCanvas(canvas, evt)
{
  var rect = canvas.getBoundingClientRect();
  return {
    x: evt.clientX - rect.left,
    y: evt.clientY - rect.top
  };
}




//------------------------- download (alphavantage) codes
var hp = 0;
var lp = Infinity;
var dataUri = null;
var dateRange = ["", ""];
var ohlc = [];
var volume = [];




//------------------------- download alphavantage
var itsWorking1 = false;
function DownAlphavantage()
{
  if(!itsWorking1)
  {
    itsWorking1 = true;
    $.ajax({
      url: 'https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=aapl&apikey=1EATG6FH0JYICSWH',
      dataType: 'json',
      contentType: "application/json",
      success: function (data)
      {
          // split the data set into ohlc and volume
        var i = 0;
        var dataArray = data['Time Series (Daily)'];
        for (var time in dataArray)
        {
          var stock_info = dataArray[time];

          var newOHLC = [
            time,
            Number(stock_info["1. open"]),
            Number(stock_info["2. high"]),
            Number(stock_info["3. low"]),
            Number(stock_info["4. close"])
          ];

          ohlc.push(newOHLC);
          volume.push([time, Number(stock_info["5. volume"])]);
          
          if (newOHLC[2] > hp) //found highest point
            hp = newOHLC[2];
          if (newOHLC[3] < lp) //found the lowest point
            lp = newOHLC[3];

          i += 1;
        }

        dateRange[0] = ohlc[0][0];
        dateRange[1] = ohlc[i-1][0];

        itsWorking1 = false;
        UpdateChart();
      }
    });
  }
}




//------------------------- download Binance
var itsWorking2 = false;
function DownBinance()
{
  if(!itsWorking2)
  {
    itsWorking2 = true;
    $.ajax({
      url: 'https://www.binance.com/fapi/v1/klines?symbol=BTCUSDT&interval=5m&limit=100',
      dataType: 'json',
      contentType: "application/json",
      success: function (d)
      {
        ohlc = [];
        volume = [];

        d.forEach(item =>
        {
          let newOHLC = [Number(item[0]), Number(item[1]), Number(item[2]), Number(item[3]), Number(item[4])];
          ohlc.push(newOHLC);
          volume.push([Number(item[0]), Number(item[5])]);
          
          if (newOHLC[2] > hp) //found highest point
            hp = newOHLC[2];
          if (newOHLC[3] < lp) //found the lowest point
            lp = newOHLC[3];
        });

        dateRange[0] = ohlc[0][0];
        dateRange[1] = ohlc[d.length-1][0];

        itsWorking2 = false;
        UpdateChart();
      }
    });
  }
}




//------------------------- update Chart codes
function UpdateChart()
{
  if(ohlc.length > 0)
  {
    ctx.fillStyle = "#151924";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "blue";

    //set max/min date
    createGrid();
    drawCandles();
    dataUri = canvas.toDataURL();
  }

  DownBinance();
}




//------------------------- mouse move codes
function MouseMove (evt)
{
  if(dataUri != null)
  {
    var mousePos = getPosCompareCanvas(canvas, evt);
    var message = 'مختصات ماوس: ' + mousePos.x + ',' + mousePos.y;
    //document.getElementById('pos').innerText = message;

    var img = new Image();
    img.src = dataUri;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    drawLine([0, mousePos.y], [w, mousePos.y], "white", true);
    drawLine([mousePos.x, 0], [mousePos.x, h], "white", true);
  }
};




//------------------------- drag codes
function noop() { }
function draged(data)
{
  if(dataUri != null)
  {
    dragPos = getPosCompareCanvas(canvas, data);  //get drag pos
    var diff = hp - lp;
    linePrice = hp - (diff * (dragPos.y + 50) / h);
    data.target.innerText = Math.floor(linePrice);

    var img = new Image();
    img.src = dataUri;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    color = 'orange';
    if(data.target.getAttribute('class').includes('d-c-Tp'))
      color = 'green';
    if(data.target.getAttribute('class').includes('d-c-Sp'))
      color = 'red';
    drawLine([0, dragPos.y], [w, dragPos.y], color, true);
  }
}