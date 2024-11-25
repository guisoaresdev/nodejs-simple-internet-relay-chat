const net = require("node:net");

const client = new net.Socket();
client.setEncoding("utf8");
process.stdin.setEncoding("utf8");

client.connect(8000, () => {
  "Conectado ao servidor";
});

process.stdin.on("data", (data) => {
  client.write(data);
});

client.on("data", (data) => {
  console.log(data);
});
