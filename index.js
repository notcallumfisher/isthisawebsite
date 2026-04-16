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
const maxClientsPerIPA = 1;
let climbingTarget = 2;
const getTarget = () => {
	let now = new Date();
	let month = now.getMonth();
	let day = now.getDate();
	if (month === 3 && day === 1) return 0;
	if (month === 9) return 666;
	return climbingTarget;
};
let clients = [];

app.get('/', (req, res) => {
	res.send('isthisawebsite.com');
});

let successTimer;

const update = () => {
	let count = clients.length;
	if (count === 0) climbingTarget = 2;
	let target = getTarget();
	if (count === target && target !== 0 && target !== 666) {
		if (!successTimer) {
			let delay = (1 + (target * 0.1)) * 1000;
			successTimer = setTimeout(() => {
				climbingTarget = target + 1;
				successTimer = null;
				update();
			}, delay);
		}
	} else {
		if (successTimer) {
			clearTimeout(successTimer);
			successTimer = null;
		}
	}
	io.emit('u', { c: count, t: target });
}

io.on('connection', socket => {
	let ipa = socket.handshake.headers['x-forwarded-for']?.split(',')[0].trim() || socket.handshake.address;
	let existing = clients.filter(c => c.ipa === ipa).length;
	if (existing >= maxClientsPerIPA) {
		socket.disconnect();
		return;
	}
	let client = { socket, ipa };
	clients.push(client);
	console.log(`Connected: ${ipa} | Total: ${clients.length}`);
	update();
	socket.on('disconnect', () => {
		clients = clients.filter(c => c !== client);
		console.log(`Disconnected: ${ipa} | Total: ${clients.length}`);
		update();
	});
});

server.listen(port, () => console.log(`live @ ${port}`));
