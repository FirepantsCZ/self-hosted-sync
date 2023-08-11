"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var net = require("net");
var PORT = 3000;
var IP = '192.168.1.197';
var BACKLOG = 100;
console.log("starting server on ".concat(IP, ":").concat(PORT));
net.createServer()
    .listen(PORT, IP, BACKLOG)
    .on('connection', function (socket) {
    console.log("\nnew connection from ".concat(socket.remoteAddress, ":").concat(socket.remotePort));
    socket.on('data', function (buffer) {
        var request = buffer.toString();
        console.log("recieved data:\n".concat(request));
        //writeFileSync("vaults", request)
        // socket.write('this is a response from server')
        //var storedVaults = JSON.parse(readFileSync("vaults").toString())
        //console.log(`${storedVaults.testvault.a}`)
        socket.end();
    });
    socket.on('end', function () {
        console.log("client disconnected");
    });
});
console.log("server started successfully");
