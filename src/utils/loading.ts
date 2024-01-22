export async function loadingWith<R>(fn: () => Promise<R> | R): Promise<R> {
  open();
  try {
    const result = await fn();
    return result;
  } finally {
    close();
  }
}
export async function messageWith<R>(
  message: string,
  fn: () => Promise<R> | R,
): Promise<R> {
  if (messageElement) {
    messageElement.textContent = message;
  }
  try {
    const result = await fn();
    // debug
    // await new Promise((resolve) => {
    //   window.resolve = resolve;
    // });
    return result;
  } finally {
    if (messageElement?.textContent === message) {
      messageElement.textContent = "";
    }
  }
}

let dialog: HTMLDialogElement | null = null;
let messageElement: HTMLDivElement | null = null;

function open(): void {
  if (!dialog) {
    dialog = document.createElement("dialog");
    dialog.style.padding = "0";
    dialog.style.border = "none";
    dialog.style.backgroundColor = "transparent";
    dialog.style.overflow = "visible";
    dialog.style.outline = "none";
    dialog.style.marginTop = "40dvh";
    dialog.addEventListener("cancel", (e) => e.preventDefault());
    const wrapper = document.createElement("div");
    wrapper.style.display = "flex";
    wrapper.style.flexDirection = "column";
    wrapper.style.alignItems = "center";
    dialog.appendChild(wrapper);
    const loading = document.createElement("div");
    loading.className = "loader";
    wrapper.appendChild(loading);
    messageElement = document.createElement("div");
    messageElement.style.textAlign = "center";
    messageElement.style.backgroundColor = "#fff9";
    messageElement.style.whiteSpace = "pre-wrap";
    wrapper.appendChild(messageElement);
    document.body.appendChild(dialog);

    const style = document.createElement("style");
    document.head.appendChild(style);
    style.innerHTML = `/* Copied from https://css-loaders.com/spinner/ */
.loader {
    width: 50px;
    aspect-ratio: 1;
    display: grid;
    border: 4px solid #0000;
    border-radius: 50%;
    border-right-color: #25b09b;
    animation: l15 1s infinite linear;
}
.loader::before,
.loader::after {
    content: "";
    grid-area: 1/1;
    margin: 2px;
    border: inherit;
    border-radius: 50%;
    animation: l15 2s infinite;
}
.loader::after {
    margin: 8px;
    animation-duration: 3s;
}
@keyframes l15 {
    100% {
      transform: rotate(1turn);
    }
}`;
  }
  dialog.showModal();
}

function close(): void {
  dialog?.close();
}
