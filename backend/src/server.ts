import { createApp } from "./app";
import { appConfig } from "./config";

const app = createApp();

app.listen(appConfig.port, () => {
  // eslint-disable-next-line no-console
  console.log(
    `🚀 Serveur démarré sur http://localhost:${appConfig.port} (admin via en-tête x-admin-secret)`
  );
});

