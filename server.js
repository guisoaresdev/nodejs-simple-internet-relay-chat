const net = require("node:net");

var sockets = [];
var port = 8000;
var guestId = 0;

function broadcast(from, message) {
  if (sockets.length === 0) {
    console.log(`[Broadcast] ${from}: ${message}`);
    process.stdout.write("Everyone left the chat");
    return;
  }

  sockets.forEach((socket, index, array) => {
    if (socket.nickname == from) {
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
    guestId++;

    socket.nickname = "Guest " + guestId;
    var clientName = socket.nickname;

    sockets.push(socket);

    console.log(clientName + " just joined the chat.");

    socket.write("Welcome to the telnet chat!\n");

    broadcast(clientName, clientName + " joined this chat.\n");

    socket.on("data", (data) => {
      var message = clientName + "> " + data.toString();

      broadcast(clientName, message);

      /* Log it into server */
      process.stdout.write(message);
    });

    socket.on("end", () => {
      var message = clientName + " left the chat.\n";
      process.stdout.write(message);
      removeSocket(socket);
      broadcast(clientName, message);
    });

    socket.on("error", (err) => {
      console.log("Socket got a problem: ", err);
    });
  })
  .on("error", (err) => {
    console.log(err);
  });

server.listen(8000, () => {
  console.log("Server running at 8000");
});
