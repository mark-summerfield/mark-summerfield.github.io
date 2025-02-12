/*
    Copyright © 2013-14 Qtrac Ltd. All rights reserved.
*/
"use strict";

var COLORS = [
    "#7F0000", // Red
    "#007F00", // Green
    "#00007F", // Blue
    "#007F7F", // Cyan
    "#7F007F", // Magenta
    "#7F7F00", // Yellow
    "#A0A0A4", // Gray
    "#A52A2A", // Brown
    ];
var columns = 9;
var rows = 9
var maxColors = 4;
var score = 0;
var highScore = 0;
var tiles = [];
var boardSize = 360;
var tileSize = boardSize / Math.max(columns, rows);


function newGame() {
    score = 0;
    updateScore();
    var colors = getRandomColors();
    tiles = [];
    for (var x = 0; x < columns; ++x) {
        tiles.push([]);
        for (var y = 0; y < rows; ++y) {
            tiles[x].push(colors[random(colors.length)]);
        }
    }
    draw();
}

function handleClick(x, y) {
    x = Math.floor(x / tileSize);
    y = Math.floor(y / tileSize);
    if (x < 0 || x >= columns || y < 0 || y >= rows || !tiles)
        return;
    var color = tiles[x][y];
    if (!color || !isLegal(x, y, color))
        return;
    dimAdjoining(x, y, color);
}

function random(limit) { // Returns a number [0, limit)
    return Math.floor(Math.random() * limit);
}

function getRandomColors() {
    var colors = [];
    for (var i = 0; i < COLORS.length; ++i)
        colors.push(COLORS[i]);
    while (colors.length > maxColors)
        colors.splice(random(colors.length), 1);
    return colors;
}

function updateScore(info) {
    var message = document.getElementById("message");
    message.innerHTML = (info ? info + " " : "") + score +
            (highScore ? "/" + highScore : "");
}

function draw() {
    var canvas = document.getElementById("canvas");
    var context = canvas.getContext("2d");
    var offset = 4;
    context.save();
    context.clearRect(0, 0, canvas.width, canvas.height);
    for (var x = 0; x < columns; ++x) {
        for (var y = 0; y < rows; ++y) {
            var color = tiles[x][y];
            if (color) {
                var lighter = colorLuminance(color, 0.5);
                var darker = colorLuminance(color, -0.5);
                var x0 = x * tileSize;
                var y0 = y * tileSize;
                var x1 = x0 + tileSize;
                var y1 = y0 + tileSize;

                drawSegment(context, lighter, [[x0, y0], // top
                    [x0 + offset, y0 + offset], [x1 - offset, y0 + offset],
                    [x1, y0]]);
                drawSegment(context, lighter, [[x0, y0], [x0, y1], // left
                    [x0 + offset, y1 - offset],
                    [x0 + offset, y0 + offset]]);
                drawSegment(context, darker, // right
                    [[x1 - offset, y0 + offset], [x1, y0], [x1, y1],
                    [x1 - offset, y1 - offset]]);
                drawSegment(context, darker, [[x0, y1], // bottom
                        [x0 + offset, y1 - offset],
                        [x1 - offset, y1 - offset], [x1, y1]]);
                var gradient = context.createLinearGradient(x0, y0,
                        x1, y1); // middle
                gradient.addColorStop(0, lighter);
                gradient.addColorStop(1, darker);
                var midSize = tileSize - (2 * offset);
                context.fillStyle = gradient;
                context.fillRect(x0 + offset, y0 + offset, midSize,
                        midSize)
            }
        }
    }
    context.restore();
}

function drawSegment(context, color, coords) {
    context.fillStyle = color;
    context.beginPath();
    context.moveTo(coords[0][0], coords[0][1]);
    for (var i = 1; i < coords.length; ++i)
        context.lineTo(coords[i][0], coords[i][1]);
    context.closePath();
    context.fill();
}

function isLegal(x, y, color) {
    /* A legal click is on a colored tile that is adjacent to
    another tile of the same color. */
    if (x > 0 && tiles[x - 1][y] == color)
        return true;
    if (x + 1 < columns && tiles[x + 1][y] == color)
        return true;
    if (y > 0 && tiles[x][y - 1] == color)
        return true;
    if (y + 1 < rows && tiles[x][y + 1] == color)
        return true;
    return false;
}

function dimAdjoining(x, y, color) {
    var adjoining = {};
    populateAdjoining(x, y, color, adjoining);
    var count = 0;
    for (var key in adjoining) {
        var point = pointForKey(key);
        tiles[point.x][point.y] = "#F0F0F0";
        ++count;
    }
    score += Math.pow(count, (maxColors - 2));
    updateScore();
    draw();
    window.setTimeout(function() {deleteAdjoining(adjoining);}, 666);
}

function populateAdjoining(x, y, color, adjoining) {
    if (x < 0 || x >= columns || y < 0 || y >= rows)
        return; // Fallen off an edge
    var key = keyForPoint(x, y);
    if (adjoining.hasOwnProperty(key) || tiles[x][y] != color)
        return; // Already done or nothing there or color doesn't match
    adjoining[key] = null;
    populateAdjoining(x - 1, y, color, adjoining);
    populateAdjoining(x + 1, y, color, adjoining);
    populateAdjoining(x, y - 1, color, adjoining);
    populateAdjoining(x, y + 1, color, adjoining);
}

function keyForPoint(x, y) {
    return x + "," + y;
}

function pointForKey(key) {
    var parts = key.split(",");
    return {x: +parts[0], y: +parts[1]};
}

function deleteAdjoining(adjoining) {
    for (var key in adjoining) {
        var point = pointForKey(key);
        tiles[point.x][point.y] = null;
    }
    draw();
    window.setTimeout(closeUp, 666);
}

function closeUp() {
    moveTiles();
    draw();
    checkGameOver();
}

function moveTiles() {
    var xrange = rippleRange(columns);
    var yrange = rippleRange(rows);
    var moved = true;
    while (moved) {
        moved = false;
        for (var i = 0; i < columns; ++i) {
            for (var j = 0; j < rows; ++j) {
                var x = xrange[i];
                var y = yrange[j];
                if (tiles[x][y]) {
                    if (moveIfPossible(x, y)) {
                        moved = true;
                        break;
                    }
                }
            }
        }
    }
}

function rippleRange(limit) {
    var middle = Math.floor(limit / 2);
    var numbers = [middle];
    var low = middle - 1;
    var high = middle + 1;
    while (numbers.length < limit) {
        if (low != middle && low >= 0) {
            numbers.push(low);
        }
        --low;
        if (high != middle && high < limit) {
            numbers.push(high);
        }
        ++high;
    }
    return numbers;
}

function moveIfPossible(x, y) {
    var emptyNeighbours = getEmptyNeighbours(x, y);
    if (emptyNeighbours.length) {
        var result = nearestToMiddle(x, y, emptyNeighbours);
        if (result.move) {
            tiles[result.x][result.y] = tiles[x][y];
            tiles[x][y] = null;
            return true;
        }
    }
    return false;
}

function getEmptyNeighbours(x, y) {
    var unique = {};
    var pairs = [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]];
    for (var i = 0; i < pairs.length; ++i) {
        var nx = pairs[i][0];
        var ny = pairs[i][1];
        if (0 <= nx && nx < columns && 0 <= ny && ny < rows &&
            !tiles[nx][ny])
            unique[keyForPoint(nx, ny)] = null;
    }
    var neighbours = [];
    for (var key in unique)
        neighbours.push(pointForKey(key));
    return neighbours;
}

function nearestToMiddle(x, y, emptyNeighbours) {
    var color = tiles[x][y];
    var midX = Math.floor(columns / 2);
    var midY = Math.floor(rows / 2);
    var distance = hypotenuse(midX - x, midY - y);
    var candidates = [];
    for (var i = 0; i < emptyNeighbours.length; ++i) {
        var emptyNeighbour = emptyNeighbours[i];
        var nx = emptyNeighbour.x;
        var ny = emptyNeighbour.y;
        if (isSquare(nx, ny)) {
            var newDistance = hypotenuse(midX - nx, midY - ny);
            if (isLegal(nx, ny, color))
                newDistance -= 0.1; // Make same colors slightly attractive
            candidates.push({distance: newDistance, x: nx, y: ny});
        }
    }
    // JS sort isn't smart like Python, so you must be explicit!
    candidates.sort(function(a, b){return a.distance - b.distance;});
    var result = {move: false, x: x, y: y};
    if (candidates.length > 0 && distance > candidates[0].distance)
        result = {move: true, x: candidates[0].x, y: candidates[0].y};
    return result;
}

function hypotenuse(x, y) {
    return Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
}

function isSquare(x, y) {
    if (x > 0 && tiles[x - 1][y])
        return true;
    if (x + 1 < columns && tiles[x + 1][y])
        return true;
    if (y > 0 && tiles[x][y - 1])
        return true;
    if (y + 1 < rows && tiles[x][y + 1])
        return true;
    return false;
}

function checkGameOver() {
    var result = checkTiles();
    if (result.userWon) {
        if (highScore < score)
            highScore = score;
        updateScore("You Won \u263A");
    }
    else if (!result.canMove)
        updateScore("Game Over \u2639");
}

function checkTiles() {
    var result = {userWon: true, canMove: false};
    var colors = {}
    for (var x = 0; x < columns; ++x) {
        for (var y = 0; y < rows; ++y) {
            var color = tiles[x][y];
            if (color) {
                if (color in colors)
                    colors[color] += 1;
                else
                    colors[color] = 1;
                result.userWon = false;
                if (isLegal(x, y, color))
                    result.canMove = true;
            }
        }
    }
    for (color in colors)
        if (colors[color] == 1) {
            result.canMove = false;
            break;
        }
    return result;
}

// From: http://www.sitepoint.com/javascript-generate-lighter-darker-color/
// hex is a hex color string, e.g., "#ff0077"; lum is the change in
// luminosity in the range 0.0 to 1.0 for brighter or 0.0 to -1.0 for
// darker.
function colorLuminance(hex, lum) {
    // validate hex string
    var hex = String(hex).replace(/[^0-9a-f]/gi, "");
    if (hex.length < 6) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    var lum = lum || 0;
    // convert to decimal and change luminosity
    var rgb = "#", c, i;
    for (i = 0; i < 3; i++) {
            c = parseInt(hex.substr(i*2,2), 16);
            c = Math.round(Math.min(Math.max(0, c + (c * lum)), 255))
                .toString(16);
            rgb += ("00" + c).substr(c.length);
    }
    return rgb;
}
