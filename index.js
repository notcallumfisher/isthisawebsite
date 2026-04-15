import { Server } from 'socket.io';
import express from 'express';
import { createServer } from 'node:http';

const port = process.env.PORT || 8080;
const app = express();
const server = createServer(app);
const io = new Server(server, {
	cors: {
		origin: '*'
	}
});
const maxClientsPerIPA = 999999999999999999999;
const target = 100;
let clients = [];

app.get('/', (req, res) => {
	res.status(200);
});

const update = () => {
	io.emit('u', {
		c: clients.length,
		t: target
	});
};

io.on('connection', socket => {
	let ipa = socket.handshake.headers['x-forwarded-for']?.split(',')[0].trim() || socket.handshake.address;
	// Check limit:
	let existing = clients.filter(c => c.ipa === ipa).length;
	if (existing >= maxClientsPerIPA) {
		socket.disconnect();
		return;
	}
	// Add client
	let client = { socket, ipa };
	clients.push(client);
	console.log(`Connected: ${ipa} | Total: ${clients.length}`);
	update();
	socket.on('disconnect', () => {
		clients = clients.filter(c => c !== client);
		update();
		console.log(`Disconnected: ${ipa} | Total: ${clients.length}`);
	});
});

server.listen(port, () => console.log(`live @ ${port}`));
