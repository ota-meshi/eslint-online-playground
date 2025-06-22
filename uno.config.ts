import { defineConfig } from "unocss";
import presetIcons from "@unocss/preset-icons";
export default defineConfig({
  presets: [
    presetIcons({
      cdn: "https://esm.sh/",
    }),
  ],
});
