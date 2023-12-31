var grid;
var cols;
var rows;
var w = 12;
var agentX;
var agentY;
var curX, curY;

var numSteps = 0;
var traces = [];
var cost = 0;
var score = 0;
var block = 0;
var targetSteps = 0;
var isGameOver = false;

var countPress = 0;
var rescue = 0;
const timeDisplay = document.querySelector('#playtime');
var gameDuration = 1; //1 minutes
var totalMinutes = 60 * gameDuration; 
// var totalMinutes = 60 * 0.2;
var display = document.querySelector('#time');

const uid = document.getElementById("uid").value;
const episode = document.getElementById("session").value;
var maxEpisode = 0;
const episodeDisplay = document.getElementById('episode');

const dist = 2;
var listFoV = [];
var listYellow = [];
var minuteDie = 0;
var secondDie = 0;

var iframe = document.getElementById('frame-qualtrics');
var closeBtn = document.getElementById('close-button');


function showElement(ElementId) {
  document.getElementById(ElementId).style.display = 'block';
}

function hideElement(ElementId) {
  document.getElementById(ElementId).style.display = 'none';
}

function setup() {
  showElement("game-container");
  episodeDisplay.textContent = 'Episode: ' + episode;
  getMap();
  startTimer(totalMinutes, display);

  var initData = {"userid": uid, "episode":episode, "target":"", "target_pos":"",
  "num_step":0, "time_spent":"start", "trajectory":""};
  writeData(initData);

  var width = 93 * w + 1;
  var height = 50 * w + 1;
  var canvas = createCanvas(1117, 601); 
  canvas.parent('sketch-holder');
  cols = floor(width / w);
  rows = floor(height / w);
  grid = make2DArray(cols, rows);
  for (var i = 0; i < cols; i++) {
    for (var j = 0; j < rows; j++) {
      grid[i][j] = new Cell(i, j, w);
    }
  }
  
  async function getMap() {
    const response = await fetch('/map');
    const data = await response.json();
    generateGrid(data["map_data"]);
     
  }
}


function generateGrid(data) {
  size = Object.keys(data).length;
  for (let entry of Object.entries(data)) {
    var type = entry[1]['key'];
    var posX = Number(entry[1]['x']);
    var posY = Number(entry[1]['z']);
    grid[posX][posY].goal = type;
    if(type=="yellow victims"){
      listYellow.push([posX,posY]);
    }
  }
  agentX = 13;
  agentY = 38;
  traces.push("("+agentX+","+agentY+")");
}

function gameOver() {
  isGameOver = true;
  var data = {"userid": uid, "episode":episode, "target":"", "target_pos":"",
                "num_step":targetSteps, "time_spent":"stop", "trajectory":traces.join(";")};
  writeData(data);
  if (episode == maxEpisode) {
    showElement("finish-button");
  } else {
    showElement("next-button");
  }
}

function writeData(data){
  const dataOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  };
  fetch('/game_play', dataOptions);
}

function draw() {
  // background(200,200,200,127);
  background(173,216,230,127);
  for (var i = 0; i < cols; i++) {
    for (var j = 0; j < rows; j++) {

      if (i==0 || (i==cols-1 && grid[i][j].goal!='walls') ||
       (j==rows-1 && grid[i][j].goal!='walls') ||
       (j==0 && grid[i][j].goal!='walls')){
        grid[i][j].goal = 'borders';
      } 

      if (i == agentX && j == agentY) {
        grid[i][j].agent = true;
        grid[i][j].addAgent();
      }else{
        grid[i][j].agent = false;
      }

      if(isFoV(i,j,dist)){
        listFoV.push("("+i+","+j+")");
      }
      showFoV(i,j,dist);

      grid[i][j].show();
    }
  }

  if (!isGameOver) {
    // keycode 888 is key "X"
    if (keyIsDown(UP_ARROW) && keyIsDown(88)) {
      countPress = 0; 
      curX = agentX;
      if(agentY == 1){
        curY = agentY;
      }else{
        curY = agentY - 1;
      }
      checkBoundary(curX, curY);
    } else if (keyIsDown(DOWN_ARROW) && keyIsDown(88)) {
      countPress = 0;
      curX = agentX;
      if(agentY==49){
        curY = agentY;
      }else{
        curY = agentY + 1;
      }
      checkBoundary(curX, curY);
    }
    else if (keyIsDown(LEFT_ARROW) && keyIsDown(88)) {
      countPress = 0;
      curY = agentY;
      if(agentX == 0){
        curX = agentX;
      }else{
        curX = agentX - 1;
      }
      checkBoundary(curX, curY);
    } else if (keyIsDown(RIGHT_ARROW) && keyIsDown(88)) {
      countPress = 0;
      curY = agentY;
      if(agentX == 92){
        curX = agentX;
      }else{
        curX = agentX + 1;
      }
      checkBoundary(curX, curY);
    }
  }
}

function keyPressed() {
  if (!isGameOver) {
    if (keyCode === UP_ARROW) {
      countPress = 0; 
      curX = agentX;
      if (agentY == 1) {
        curY = agentY;
      } else {
        curY = agentY - 1;
      }
    } else if (keyCode === DOWN_ARROW) {
      countPress = 0;
      curX = agentX;
      if (agentY == 49) {
        curY = agentY;
      } else {
        curY = agentY + 1;
      }
    }
    if (keyCode === LEFT_ARROW) {
      countPress = 0;
      curY = agentY;
      if (agentX == 0) {
        curX = agentX;
      } else {
        curX = agentX - 1;
      }
    } else if (keyCode === RIGHT_ARROW) {
      countPress = 0;
      curY = agentY;
      if (agentX == 92) {
        curX = agentX;
      } else {
        curX = agentX + 1;
      }
    }
    if (keyCode === ENTER) {
      countPress += 1;
      var options = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      for (var i = 0; i < options.length; i++) {
        var tmpX = agentX + options[i][0];
        var tmpY = agentY + options[i][1];
        if (grid[tmpX][tmpY].goal == 'doors') {
          curX = tmpX;
          curY = tmpY;
          grid[curX][curY].goal = "";
          var targetPos = [curX, curY];
          var data = {"userid": uid, "episode":episode, "target":"door", "target_pos":targetPos.toString(),
                "num_step":targetSteps, "time_spent": display.textContent, "trajectory":traces.join(";")};
          writeData(data);
          targetSteps = 0;
          traces = [];
          break;
        }
        else if (grid[tmpX][tmpY].goal == 'green victims') {
          if (countPress == 5) {
            curX = tmpX;
            curY = tmpY;
            grid[curX][curY].goal = "";
            countPress = 0;
            rescue += 10;
            document.getElementById('goal').innerHTML = 'Points: ' + rescue.toString();
            var targetPos = [curX, curY];
            var data = {"userid": uid, "episode":episode, "target":"green_victim", "target_pos":targetPos.toString(),
                  "num_step":targetSteps, "time_spent": display.textContent, "trajectory":traces.join(";")};
            writeData(data);
            targetSteps = 0;
            traces = [];
            break;
            
          }
        }
        else if (grid[tmpX][tmpY].goal == 'yellow victims') {
          if (countPress == 10) {
            curX = tmpX;
            curY = tmpY;
            grid[curX][curY].goal = "";
            countPress = 0;
            rescue += 30;
            document.getElementById('goal').innerHTML = 'Points: ' + rescue.toString();
            var targetPos = [curX, curY];
            var data = {"userid": uid, "episode":episode, "target":"yellow_victim", "target_pos":targetPos.toString(),
                  "num_step":targetSteps, "time_spent": display.textContent, "trajectory":traces.join(";")};
            writeData(data);
            targetSteps = 0;
            traces = [];
            break;
            
          }
        }
      }
    }
  }
}

function keyReleased() {
  if(!isGameOver){
    checkBoundary(curX, curY);
  }
}

function checkBoundary(paraX, paraY) {
  if (grid[paraX][paraY].goal == 'walls') {
    paraX = agentX;
    paraY = agentY;
    block += 1;
  }
  else if (grid[paraX][paraY].goal == 'doors') {
    paraX = agentX;
    paraY = agentY;
  }
  else if (grid[paraX][paraY].goal == 'yellow victims') {
    paraX = agentX;
    paraY = agentY;
  }
  else if (grid[paraX][paraY].goal == 'green victims') {
    paraX = agentX;
    paraY = agentY;
  }
  else if (grid[paraX][paraY].goal == 'stairs') {
    paraX = agentX;
    paraY = agentY;
  }
  else if (grid[paraX][paraY].goal == 'borders') {
    paraX = agentX;
    paraY = agentY;
  }
  else {
    if(agentX!=paraX || agentY!=paraY){
      agentX = paraX;
      agentY = paraY;
      numSteps += 1;
      targetSteps += 1;
      traces.push("("+agentX+","+agentY+")");
      listFoV=[];
    }
  }
}

function showFoV(paraX, paraY, mDist){
  if(agentX>0 &&  agentX<92 && agentY>0 && agentY<49){
    var blockList = ['borders', 'walls', 'doors', 'stairs']
    var op1 = [[1, 0], [-1, 0], [0, 1], [0, -1]]; 
    var op2 = [[1, 0], [0, -1], [-1, 0], [0, 1], [1, 0]]; 
    var op = [[[0, 1], [0, 1], [1, 0], [1, 0]], [[0, 0], [0, 0], [0, 0], [0, 0]], [[0, -1], [0, -1], [-1, 0], [-1, 0]]];
    for(var i=0;i<op1.length;i++){
      for(var t=0;t<mDist;t++){
        if(agentX==1 ||  agentX == 91 || agentY==1 || agentY==48){
          if(t>0){
            break;
          }
        }
        if(blockList.includes(grid[agentX+op2[i][0]*(t+1)+op2[i+1][0]*t][agentY+op2[i][1]*(t+1)+op2[i+1][1]*t].goal) && 
        blockList.includes(grid[agentX+op2[i+1][0]*(t+1)+op2[i][0]*t][agentY+op2[i+1][1]*(t+1)+op2[i][1]*t].goal)){
          for(var k=1;k<mDist-t+1;k++){
            for(var h=1;h<mDist-t+1;h++){
              let idx = listFoV.indexOf("("+(agentX + op2[i][0]*(t+k)+ op2[i+1][0]*(t+h))+","+(agentY+ op2[i][1]*(t+k) + op2[i+1][1]*(t+h))+")")
              if (idx > -1) {
                listFoV.splice(idx, 1);
              }
            }
          }
        }
      }
      
      for(var j=0;j<op.length;j++){
        var tmpX = op1[i][0]+op[j][i][0];
        var tmpY = op1[i][1]+op[j][i][1];
        if(blockList.includes(grid[agentX+tmpX][agentY+tmpY].goal)){
          let idx = listFoV.indexOf("("+(agentX+tmpX*2)+","+(agentY+tmpY*2)+")")
          if (idx > -1) {
            listFoV.splice(idx, 1);
          }

          var tmpX3 = op1[i][0]*2+op[j][i][0];
          var tmpY3 = op1[i][1]*2+op[j][i][1];
          idx = listFoV.indexOf("("+(agentX+tmpX3)+","+(agentY+tmpY3)+")")
          if (idx > -1) {
            listFoV.splice(idx, 1);
          }
        }
      }
    }
    
    if (listFoV.indexOf("("+paraX+","+paraY+")") > -1){
      grid[paraX][paraY].revealed=true;
      grid[paraX][paraY].drawFoV();
    }else{
      grid[paraX][paraY].revealed=false;
    }
  }  
}

function isFoV(paraX, paraY, mDist){
  var mLeft = agentX - mDist;
  var mRight = agentX + mDist;
  var mUp = agentY - mDist;
  var mDown = agentY + mDist;
  if(agentY == 0){
    mUp = 0;
  }
  else if(agentY == 49){
    mDown = 49;
  }
  if(agentX == 0){
    mLeft = 0;
  }
  else if(agentX == 92){
    mRight = 92;
  }
  return (paraX >= mLeft && paraX <= mRight && paraY >= mUp && paraY <= mDown);
}

function make2DArray(cols, rows) {
  var arr = new Array(cols);
  for (var i = 0; i < arr.length; i++) {
    arr[i] = new Array(rows);
  }
  return arr;
}

function startTimer(duration, display) {
  var start = Date.now(),
    diff,
    minutes,
    seconds;
  var t;
  function timer() {
    diff = duration - (((Date.now() - start) / 1000) | 0);

    if (diff >= 0) {
      minutes = (diff / 60) | 0;
      seconds = (diff % 60) | 0;
      minutes = minutes < 10 ? "0" + minutes : minutes;
      seconds = seconds < 10 ? "0" + seconds : seconds;
      display.textContent = minutes + ":" + seconds;
    }

    if ((minutes != gameDuration && seconds==0) || seconds==30){
      var data = {"userid": uid, "episode":episode, "target":"", "target_pos":"",
                "num_step": targetSteps, "time_spent": display.textContent, "trajectory":traces.join(";")};
      (async () => {
        writeData(data);  
      })()                
      // writeData(data);
      targetSteps = 0;
      traces = [];
    }

    if (minutes == minuteDie && seconds == secondDie){
      for(var i in listYellow){
        var posX = listYellow[i][0];
        var posY = listYellow[i][1];
        grid[posX][posY].goal = "";
      }
    }

    if (minutes == 0 && seconds == 0) {
      console.log("Practice session is over");
      isGameOver = true;
      timeDisplay.textContent = "PRACTICE IS OVER !";
      clearInterval(t);
      gameOver();
    }
  };
  timer();
  t = setInterval(timer, 1000);
}