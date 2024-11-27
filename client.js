const net = require("node:net");

const client = new net.Socket();
client.setEncoding("utf8");
process.stdin.setEncoding("utf8");

const nickname = process.argv[2];

if (!nickname) {
  console.log("Por favor, forneça um nickname ao conectar. Exemplo: node client.js <nickname>");
  process.exit();
}

client.connect(8000, () => {
  console.log("Conectado ao servidor");
  client.write(`[NICKNAME]${nickname}`);
});

process.stdin.on("data", (data) => {
  client.write(data);
});

client.on("data", (data) => {
  console.log(data); // Exibe a mensagem do servidor
  timeout = 10000; // Reseta o timeout
});

client.on("end", () => {
  console.log("Você foi desconectado do servidor.");
  process.exit();
});

