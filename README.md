## Whatsapp API

This repo uses [Baileys-MD](https://github.com/adiwajshing/Baileys/tree/multi-device) to create a [Socket.IO](https://socket.io) api.
This project will store the data in a sqlite database, the data can be retrieved by various Socket.IO "endpoints"

### Run it in Docker

```bash
docker run --init \
	-e TOKEN=secret_password \
	-v $PWD/data:/app/data \
	-p 3000:3000 \
	netfloex/whatsapp
```

```yaml
version: "3"

services:
	api:
		image: netfloex/whatsapp
		container_name: whatsapp-api
        volumes:
            - ./data:/app/data
        environment:
            TOKEN: secret_password
        ports:
            - 3000:3000
```

### Creating A Client

Install `socket.io-client`

```bash
yarn add socket.io-client
```

If you're using typescript I recommend downloading the SocketIO types from [here](src/typings/SocketIO.ts)

```ts
import { ClientToServer, ServerToClient } from "@typings/SocketIO";
import { io, Socket } from "socket.io-client";

const socket: Socket<ServerToClient, ClientToServer> = io(
	"http://localhost:3000",
	{
		auth: {
			token: "secret_password",
		},
	},
);

socket.emit("chats", async (chats) => {
	console.log(chats[0].name);
	socket.emit(
		"messages.for",
		{ chatId: chats[0].id, length: 10 },
		(messages) => {
			console.log(messages);
		},
	);
});

socket.on("connect_error", console.error);
```
