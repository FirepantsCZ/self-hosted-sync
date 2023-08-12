"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var net = require("net");
var fs_1 = require("fs");
var fs_extra_1 = require("fs-extra");
var PORT = 3000;
var IP = '192.168.1.197';
var BACKLOG = 100;
var ServerMode;
(function (ServerMode) {
    ServerMode[ServerMode["idle"] = 0] = "idle";
    ServerMode[ServerMode["syncStart"] = 1] = "syncStart";
})(ServerMode || (ServerMode = {}));
var operatingMode = ServerMode.idle;
var connectedSockets = new Set();
function socketsBroadcast(data, except) {
    connectedSockets.forEach(function (socket) {
        if (socket !== except) {
            socket.write(data.toString());
        }
    });
}
console.log("starting server on ".concat(IP, ":").concat(PORT));
net.createServer()
    .listen(PORT, IP, BACKLOG)
    .on('connection', function (socket) {
    console.log("\nnew connection from ".concat(socket.remoteAddress, ":").concat(socket.remotePort));
    connectedSockets.add(socket);
    socket.on('data', function (buffer) {
        var request = JSON.parse(buffer.toString());
        console.log("recieved data:\n".concat(JSON.stringify(request, null, 2)));
        if (request.mode == "downlad") {
            console.log("download request");
            return;
        }
        if (request.mode == "upload") {
            var vaultData_1 = request.params;
            var noDataVault = { vaultName: "", items: [] };
            noDataVault.items = JSON.parse(JSON.stringify(vaultData_1.items));
            noDataVault.items = noDataVault.items.map(function (item) { item.data = ""; return item; });
            noDataVault.vaultName = vaultData_1.vaultName;
            console.log(JSON.stringify(vaultData_1, null, 2));
            (0, fs_extra_1.ensureFile)("vaults/".concat(request.params.vaultName, "/.map"));
            //var fileMap = readFileSync(`vaults/${request.params.vaultName}/.map`)
            (0, fs_1.writeFileSync)("vaults/".concat(request.params.vaultName, "/.map"), JSON.stringify(noDataVault));
            vaultData_1.items.forEach(function (item) {
                (0, fs_extra_1.ensureDirSync)("vaults/".concat(vaultData_1.vaultName, "/").concat(item.path));
                (0, fs_1.writeFileSync)("vaults/".concat(vaultData_1.vaultName, "/").concat(item.path, "/").concat(item.name), item.data.toString());
            });
            // now all connected clients reload
            var responseBuffer = { mode: "update", params: {} };
            responseBuffer.params = vaultData_1;
            socketsBroadcast(JSON.stringify(responseBuffer), undefined);
            return;
        }
    });
    socket.on('end', function () {
        console.log("client disconnected");
        connectedSockets.delete(socket);
    });
});
console.log("server started successfully");
