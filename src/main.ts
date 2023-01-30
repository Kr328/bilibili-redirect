import './style.less';
import closeSvg from './close.svg';
import {unsafeWindow} from "vite-plugin-monkey/dist/client";

(() => {
    const injectHtml = `
        <div id="bilibili-redirect-root" class="--br-popup-window --br-hidden">
            <div class="--br-spacing-row">
                <span style="font-size: 18px">使用本地源</span>
                <img src="${closeSvg}" id="bilibili-redirect-close" class="--br-clickable" style="width: 24px;height: 24px" alt="关闭"/>
            </div>
            <div class="--br-input-container">
                <input id="bilibili-redirect-file-picker" type="file" accept="video/mp4" />
            </div>
        </div>
    `;

    class Injector {
        private injected: boolean = false;
        private destroyed: boolean = false;

        public inject(): boolean {
            if (this.injected) {
                return true;
            }

            let added = this.addOption(
                ".squirtle-setting-panel-wrap",
                ".squirtle-single-select.squirtle-setting-more",
            ) || this.addOption(
                ".bpx-player-ctrl-setting-menu-left",
                ".bpx-player-ctrl-setting-more",
            );

            if (added) {
                this.injected = true;

                this.injectPopupWindow();
                this.resizeLegacyPanel();
            }

            return added;
        }

        private injectPopupWindow() {
            const wrap = document.createElement("div");

            wrap.classList.add("bilibili-redirect-base");
            wrap.innerHTML = injectHtml;

            document.body.appendChild(wrap);

            setTimeout(() => {
                const root = wrap.querySelector<HTMLDivElement>("#bilibili-redirect-root")!;

                const close = wrap.querySelector<HTMLSpanElement>("#bilibili-redirect-close")!;
                close.onclick = () => {
                    root.classList.add("--br-hidden");
                };

                const picker = wrap.querySelector<HTMLInputElement>("#bilibili-redirect-file-picker")!;
                picker.onchange = () => {
                    if (picker.files) {
                        const video = document.querySelector("video");
                        if (video) {
                            const player = unsafeWindow.player;

                            if (!this.destroyed) {
                                this.destroyed = true;

                                player.core().destroy();
                            }

                            player.core().seek = async (t: number) => {
                                try {
                                    video.currentTime = t;
                                } catch (e) {
                                    console.warn(e)
                                }
                            };

                            video.src = URL.createObjectURL(picker.files[0]);

                            root.classList.add("--br-hidden");
                        }
                    }
                };
            });
        }

        private resizeLegacyPanel() {
            const controlBox = document.querySelector<HTMLDivElement>(".bpx-player-ctrl-setting-box");
            if (controlBox == null) {
                return;
            }

            const panel = controlBox.querySelector<HTMLDivElement>(".bui-panel-wrap");
            if (panel == null) {
                return;
            }

            panel.style.height = "170px";
            panel.querySelectorAll<HTMLDivElement>("div.bui-panel-item").forEach((elm) => {
                elm.style.height = "100%";
            });
        }

        private addOption(containerSelector: string, cloneSelector: string): boolean {
            const container = document.querySelector<HTMLDivElement>(containerSelector);
            if (container == null) {
                return false;
            }

            const clone = document.querySelector<HTMLDivElement>(cloneSelector);
            if (clone == null) {
                console.error("src style not found.");

                return true;
            }

            const cloned: HTMLDivElement = clone.cloneNode(true) as HTMLDivElement;

            cloned.querySelector<HTMLSpanElement>("span")!.innerText = "使用本地源";
            cloned.onclick = () => {
                document.querySelector<HTMLDivElement>("#bilibili-redirect-root")!
                    .classList.remove("--br-hidden");
                document.querySelector<HTMLInputElement>("#bilibili-redirect-file-picker")!
                    .value = "";
            };

            container.appendChild(cloned);

            return true;
        }
    }

    const injector = new Injector();

    let retry = 0;
    const poller = setInterval(() => {
        if (injector.inject() || (retry++ > 20)) {
            clearInterval(poller);
        }
    }, 500);
})();
