import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";
import * as href from "./utils/href";
import "virtual:uno.css";

void main();

async function main() {
  const queryAndHashData = href.getQueryAndHashData();
  const app = createApp(App, {
    sources: await href.toSources(queryAndHashData),
  });
  app.mount("#app");
}
