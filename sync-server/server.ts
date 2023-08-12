import * as net from 'net'
import { readFileSync, writeFileSync, mkdir} from 'fs'
import { ensureDirSync, ensureFile } from 'fs-extra';

interface VaultData {
    vaultName: String;
    items: Array<{
	path: String;
	name: String;
	data: String;
    }>;
}

interface Request {
    mode: String;
    params: {
	vaultName: String
    };
}


const PORT = 3000
const IP = '192.168.1.197'
const BACKLOG = 100

enum ServerMode {
    idle,
    syncStart
}

var operatingMode = ServerMode.idle

var connectedSockets = new Set<net.Socket>();

function socketsBroadcast(data: String, except?: net.Socket) {
    connectedSockets.forEach(socket => {
	if(socket !== except){
	    socket.write(data.toString())
	}
    })
}

console.log(`starting server on ${IP}:${PORT}`)
net.createServer()
    .listen(PORT, IP, BACKLOG)
    .on('connection', socket => {
	console.log(`\nnew connection from ${socket.remoteAddress}:${socket.remotePort}`)
	connectedSockets.add(socket)
	socket.on('data', buffer => {
	    const request = JSON.parse(buffer.toString())
	    console.log(`recieved data:\n${JSON.stringify(request, null, 2)}`)
	    if(request.mode == "downlad"){
		console.log("download request")

		return
	    }

	    if(request.mode == "upload"){
		const vaultData: VaultData = request.params

		var noDataVault: {vaultName: String, items: Array<{data: String}>} = {vaultName: "", items: []}
		noDataVault.items = JSON.parse(JSON.stringify(vaultData.items))
		noDataVault.items = noDataVault.items.map(item => {item.data=""; return item})
		noDataVault.vaultName = vaultData.vaultName
		//console.log(JSON.stringify(vaultData, null, 2))
		

		ensureFile(`vaults/${request.params.vaultName}/.map`)
		//var fileMap = readFileSync(`vaults/${request.params.vaultName}/.map`)
		writeFileSync(`vaults/${request.params.vaultName}/.map`, JSON.stringify(noDataVault))
 

		vaultData.items.forEach(item => {
		    ensureDirSync(`vaults/${vaultData.vaultName}/${item.path}`)
		    writeFileSync(`vaults/${vaultData.vaultName}/${item.path}/${item.name}`, item.data.toString())
		})

		// now all connected clients reload
		
		var responseBuffer = {mode: "update", params: {}}
		responseBuffer.params = vaultData
		
		socketsBroadcast(JSON.stringify(responseBuffer), undefined) // CHANGE THIS UNDEFINED TO socket

		return
	    }

	})
	socket.on('end', () => {
	    console.log("client disconnected")
	    connectedSockets.delete(socket)
	})
    }
    )
console.log(`server started successfully`)
