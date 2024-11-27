const net = require("node:net");

const sockets = [];
const port = 8000;
const timeoutInterval = 120000; // 2 minutos em milissegundos
let clientId = 0;

function broadcast(from, message) {
  if (sockets.length === 0) {
    console.log(`[Broadcast] ${from}: ${message}`);
    return;
  }

  sockets.forEach((socket) => {
    if (socket.nickname === from) return;
    socket.write(message);
  });
}

function removeSocket(socket) {
  const index = sockets.indexOf(socket);
  if (index !== -1) sockets.splice(index, 1);
}

const server = net
  .createServer((socket) => {
    clientId++;
    const clientUniqueId = `@${clientId}`;
    let clientName = null;

    socket.lastActive = Date.now(); // Inicializa a última atividade com a hora atual

    socket.write("Welcome to the telnet chat!\n");

    socket.on("data", (data) => {
      const message = data.toString().trim();

      socket.lastActive = Date.now(); // Atualiza a última atividade

      if (message.startsWith("[NICKNAME]")) {
        const nickname = message.replace("[NICKNAME]", "").trim();

        if (sockets.some((s) => s.nickname === nickname)) {
          socket.write("Error: Nickname already in use. Disconnecting...\n");
          socket.end();
          return;
        }

        clientName = nickname;
        socket.nickname = nickname;
        socket.id = clientUniqueId;
        sockets.push(socket);

        console.log(`${clientName} (${clientUniqueId}) just joined the chat.`);
        broadcast(clientName, `${clientName} joined this chat.\n`);
        return;
      }

      if (!clientName) {
        socket.write(
          "Error: You must set a nickname first. Use [NICKNAME]<your_nickname>\n",
        );
        return;
      }

      const broadcastMessage = `${clientName} (${clientUniqueId})> ${message}\n`;
      broadcast(clientName, broadcastMessage);
      process.stdout.write(broadcastMessage);
    });

    socket.on("end", () => {
      if (clientName) {
        const message = `${clientName} (${clientUniqueId}) left the chat.\n`;
        console.log(message);
        removeSocket(socket);
        broadcast(clientName, message);
      }
    });

    socket.on("error", (err) => {
      if (socket.intentionallyDisconnected && err.code === "ECONNRESET") {
        return;
      }

      if (err.code === "ECONNRESET") {
        console.log(
          `A client (${socket.nickname || "Unknown"}) disconnected abruptly.`,
        );
      } else {
        console.error(`Socket error: ${err.message}`, err);
      }
      removeSocket(socket);
    });

    socket.on("close", () => {
      if (socket.intentionallyDisconnected) {
        return;
      }
      console.log(
        `Connection with ${socket.nickname || "Unknown"} was closed.`,
      );
      removeSocket(socket);
    });
  })
  .on("error", (err) => {
    console.log(err);
  });

// Checa inatividade a cada 30 segundos
setInterval(() => {
  const now = Date.now();
  sockets.forEach((socket) => {
    if (now - socket.lastActive > timeoutInterval) {
      const clientName = socket.nickname || "Unknown";
      console.log(`${clientName} was disconnected due to inactivity.`);
      socket.write("You were disconnected due to inactivity.\n");
      socket.intentionallyDisconnected = true; // Marca a desconexão como intencional
      socket.end();
      removeSocket(socket);
      broadcast(
        clientName,
        `${clientName} was disconnected due to inactivity.\n`,
      );
    }
  });
}, 30000);

server.listen(port, () => {
  console.log(`Server running at ${port}`);
});
