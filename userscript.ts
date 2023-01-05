// ==UserScript==
// @name            Bilibili Redirect
// @description     Redirect bilibili video src to local file
// @icon            https://www.bilibili.com/favicon.ico
//
// @author          Kr328
// @namespace       http://github.com/Kr328/bilibili-redirect
//
// @match           https://www.bilibili.com/bangumi/play/*
// @match           https://www.bilibili.com/video/*
//
// @grant           GM_addStyle
//
// @version         1.3
// ==/UserScript==

(() => {
    // language=CSS
    GM_addStyle(`
        .bilibili-redirect-base {
        }

        .bilibili-redirect-base div {
            display: flex;
            flex-direction: column;
        }

        .bilibili-redirect-base input {
            padding: 5px;
            margin-left: 10px;
            margin-right: 10px;
            border: 0;
            border-bottom: 1px solid #000000B2;
        }

        .bilibili-redirect-base button {
            padding: 5px;
            margin: 5px;
            border: none;
            color: #00a1d6FF;
        }

        .bilibili-redirect-base svg {
            margin: auto;
            display: block;
        }

        .bilibili-redirect-base .--br-clickable {
            background-color: transparent;
            transition: background-color 200ms linear;
        }

        .bilibili-redirect-base .--br-clickable:hover {
            background-color: #00000025;
            transition: background-color 200ms linear;
        }

        .bilibili-redirect-base .--br-hidden {
            display: none;
        }

        .bilibili-redirect-base .--br-spacing-row {
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
            padding-top: 5px;
            padding-bottom: 5px;
        }

        .bilibili-redirect-base .--br-popup-window {
            width: 400px;
            height: 100px;
            z-index: 100000;
            position: fixed;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border-radius: 10px;
            box-shadow: 0 10px 16px 0 #00000060;
            padding: 10px;
        }

        .bilibili-redirect-base .--br-input-container {
            flex: 1;
            justify-content: center;
        }
    `);

    function injectPopupWindow() {
        // language=HTML
        const toInject = `
            <div id="bilibili-redirect-root" class="--br-popup-window --br-hidden">
                <div class="--br-spacing-row">
                    <span style="font-size: 18px">使用本地源</span>
                    <span id="bilibili-redirect-close" class="--br-clickable">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px">
                            <path d="m12.45 37.65-2.1-2.1L21.9 24 10.35 12.45l2.1-2.1L24 21.9l11.55-11.55 2.1 2.1L26.1 24l11.55 11.55-2.1 2.1L24 26.1Z"/>
                        </svg>
                    </span>
                </div>
                <div class="--br-input-container">
                <input id="bilibili-redirect-file-picker" type="file" accept="video/mp4" />
                </div>
            </div>
        `;

        const wrap = document.createElement("div");

        wrap.classList.add("bilibili-redirect-base");
        wrap.innerHTML = toInject;

        document.body.appendChild(wrap);

        setTimeout(() => {
            const root = document.querySelector<HTMLDivElement>("#bilibili-redirect-root");

            const close = document.querySelector<HTMLSpanElement>("#bilibili-redirect-close");
            close.onclick = () => {
                root.classList.add("--br-hidden");
            };

            let destroyed = false;

            const picker = document.querySelector<HTMLInputElement>("#bilibili-redirect-file-picker");
            picker.onchange = () => {
                if (picker.files) {
                    const video = document.querySelector("video");
                    const player = unsafeWindow.player;

                    if (!destroyed) {
                        destroyed = true;

                        player.core().destroy();
                    }

                    player.core().seek = async (t) => {
                        video.currentTime = t;
                    }

                    video.src = URL.createObjectURL(picker.files[0]);

                    root.classList.add("--br-hidden");
                }
            };
        });
    }

    function resizeLegacyPanel() {
        const controlBox = document.querySelector<HTMLDivElement>(".bpx-player-ctrl-setting-box")
        if (controlBox == null) {
            return;
        }

        const panel = controlBox.querySelector<HTMLDivElement>(".bui-panel-wrap");
        if (panel == null) {
            return;
        }

        panel.style.height = "170px";
        panel.querySelectorAll<HTMLDivElement>(".bui-panel-item").forEach((elm) => {
            elm.style.height = "100%";
        });
    }

    function appendOption(containerSelector: string, cloneSelector: string): boolean {
        const container = document.querySelector<HTMLDivElement>(containerSelector)
        if (container == null) {
            return false;
        }

        const clone = document.querySelector<HTMLDivElement>(cloneSelector)
        if (clone == null) {
            console.error("src style not found.")

            return true;
        }

        const cloned: HTMLDivElement = clone.cloneNode(true) as HTMLDivElement;

        cloned.querySelector<HTMLSpanElement>("span").innerText = "使用本地源";
        cloned.onclick = () => {
            document.querySelector<HTMLDivElement>("#bilibili-redirect-root")
                .classList.remove("--br-hidden");
            document.querySelector<HTMLInputElement>("#bilibili-redirect-file-picker")
                .value = "";
        }

        container.appendChild(cloned);

        return true;
    }

    function poll() {
        const appended = appendOption(".squirtle-setting-panel-wrap", ".squirtle-single-select.squirtle-setting-more")
            || appendOption(".bpx-player-ctrl-setting-menu-left", ".bpx-player-ctrl-setting-more");

        if (!appended) {
            setTimeout(poll, 1000)

            return;
        }

        resizeLegacyPanel();
    }

    window.addEventListener("load", () => {
        setTimeout(() => {
            injectPopupWindow();

            poll();
        });
    });
})();