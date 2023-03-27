import "./style.css";
import { compress, decompress } from "./utils/compress";
import { debounce } from "./utils/debounce";
import { mount } from "./demo";

const hashData = window.location.hash.slice(
  window.location.hash.indexOf("#") + 1
);
const queryParam = decompress(hashData);

const {
  code: codeQueryParam,
  fileName: fileNameQueryParam,
  config: configQueryParam,
  deps: depsQueryParam,
} = queryParam;

void mount({
  element: document.querySelector("#app")!,
  init: {
    code: codeQueryParam,
    fileName: fileNameQueryParam,
    config: configQueryParam,
    deps: depsQueryParam,
  },
  listeners: {
    onChange: debounce(
      (values: {
        code: string;
        fileName: string;
        config: string;
        deps: string;
      }) => {
        const query = compress(values);

        window.location.hash = query;

        if (window.parent) {
          window.parent.postMessage(query, "*");
        }
      },
      250
    ),
  },
});
