import * as net from 'net'
import { readFileSync, writeFileSync } from 'fs'

interface VaultCollection {
    [index: string]: object
}


const PORT = 3000
const IP = '192.168.1.197'
const BACKLOG = 100

console.log(`starting server on ${IP}:${PORT}`)
net.createServer()
    .listen(PORT, IP, BACKLOG)
    .on('connection', socket => {
	console.log(`\nnew connection from ${socket.remoteAddress}:${socket.remotePort}`)
	socket.on('data', buffer => {
	    const request = buffer.toString()
	    console.log(`recieved data:\n${request}`)
 
	    //writeFileSync("vaults", request)

	    // socket.write('this is a response from server')

	    //var storedVaults = JSON.parse(readFileSync("vaults").toString())
	    //console.log(`${storedVaults.testvault.a}`)

	    socket.end()
	})
	socket.on('end', () => {
	    console.log("client disconnected")
	})
    }
    )
console.log(`server started successfully`)
