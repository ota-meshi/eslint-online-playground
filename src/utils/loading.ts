export async function loadingWith<R>(fn: () => Promise<R> | R): Promise<R> {
  open();
  try {
    const result = await fn();
    return result;
  } finally {
    close();
  }
}

let dialog: HTMLDialogElement | null = null;

function open(): void {
  if (!dialog) {
    dialog = document.createElement("dialog");
    dialog.style.padding = "0";
    dialog.style.border = "none";
    dialog.style.backgroundColor = "transparent";
    dialog.style.overflow = "visible";
    dialog.addEventListener("cancel", (e) => e.preventDefault());
    const loading = document.createElement("div");
    loading.className = "loader";
    dialog.appendChild(loading);
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
