import http from "node:http";
import { loadRosterFromSteam } from "./adapters/steam-save.js";

const port = Number(process.env.PORT || 3210);

const server = http.createServer(async (req, res) => {
  res.setHeader("content-type", "application/json; charset=utf-8");
  if (req.url === "/healthz") return res.end(JSON.stringify({ ok: true }));

  if (req.url === "/api/steam/roster") {
    try {
      return res.end(JSON.stringify(await loadRosterFromSteam()));
    } catch (error) {
      res.statusCode = 500;
      return res.end(JSON.stringify({ ok: false, error: error.message }));
    }
  }

  res.end(JSON.stringify({
    service: "darkest-dungeon-manager",
    endpoints: ["/healthz", "/api/steam/roster"]
  }));
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Darkest Dungeon Manager listening on http://127.0.0.1:${port}`);
});
