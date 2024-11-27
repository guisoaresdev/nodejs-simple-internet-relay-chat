const net = require("node:net");

let timeout = 15000; // Tempo de inatividade antes de desconectar
const client = new net.Socket();
client.setEncoding("utf8");
process.stdin.setEncoding("utf8");

const nickname = process.argv[2]; // Define o nickname via argumento da linha de comando

if (!nickname) {
  console.log("Por favor, forneça um nickname ao conectar. Exemplo: node client.js <nickname>");
  process.exit();
}

client.connect(8000, () => {
  console.log("Conectado ao servidor");
  client.write(`[NICKNAME]${nickname}`); // Envia o nickname ao servidor
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

client.setTimeout(timeout, () => {
  console.log("Você foi desconectado por inatividade.");
  client.write("[TIMEOUT]\n");
  client.end();
  process.exit();
});
