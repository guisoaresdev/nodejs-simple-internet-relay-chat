const net = require("node:net");

var sockets = [];
var port = 8000;
var clientId = 0;

function broadcast(from, message) {
  if (sockets.length === 0) {
    console.log(`[Broadcast] ${from}: ${message}`);
    process.stdout.write("Everyone left the chat");
    return;
  }

  sockets.forEach((socket) => {
    if (socket.nickname === from) {
      return;
    }
    socket.write(message);
  });
}

function removeSocket(socket) {
  const index = sockets.indexOf(socket);
  sockets.splice(index, 1);
}

const server = net
  .createServer(function (socket) {
    clientId++;

    let clientName = null;
    const clientUniqueId = `@${clientId}`; // ID único do cliente

    socket.write("Welcome to the telnet chat!\n");
    socket.write("Please set your nickname: [NICKNAME]<your_nickname>\n");

    socket.on("data", (data) => {
      const message = data.toString().trim();

      // Verifica se é a mensagem de nickname
      if (message.startsWith("[NICKNAME]")) {
        const nickname = message.replace("[NICKNAME]", "").trim();

        // Valida se o nickname já está em uso
        if (sockets.some((s) => s.nickname === nickname)) {
          socket.write("Error: Nickname already in use. Disconnecting...\n");
          socket.end();
          return;
        }

        // Define o nickname
        clientName = nickname;
        socket.nickname = nickname;
        socket.id = clientUniqueId;
        sockets.push(socket);

        console.log(`${clientName} (${clientUniqueId}) just joined the chat.`);
        broadcast(clientName, `${clientName} joined this chat.\n`);
        return;
      }

      // Verifica se o nickname foi definido antes de enviar mensagens
      if (!clientName) {
        socket.write("Error: You must set a nickname first. Use [NICKNAME]<your_nickname>\n");
        return;
      }

      if (message === "[TIMEOUT]") {
        const timeoutMessage = `${clientName} was disconnected due to inactivity.\n`;
        console.log(timeoutMessage);
        removeSocket(socket);
        broadcast(clientName, timeoutMessage);
        return;
      }

      const broadcastMessage = `${clientName} (${clientUniqueId})> ${message}\n`;
      broadcast(clientName, broadcastMessage);
      process.stdout.write(broadcastMessage);
    });

    socket.on("end", () => {
      if (clientName) {
        const message = `${clientName} (${clientUniqueId}) left the chat.\n`;
        process.stdout.write(message);
        removeSocket(socket);
        broadcast(clientName, message);
      }
    });

    socket.on("error", (err) => {
      console.log("Socket got a problem: ", err);
    });
  })
  .on("error", (err) => {
    console.log(err);
  });

server.listen(port, () => {
  console.log(`Server running at ${port}`);
});
