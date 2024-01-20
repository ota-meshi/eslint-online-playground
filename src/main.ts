import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";
import * as hash from "./utils/hash";

void main();

async function main() {
  const hashData = hash.getHashData();
  const app = createApp(App, { sources: await hash.toSources(hashData) });
  app.mount("#app");
}
