// ==UserScript==
// @name          	Bilibili Redirect
// @description     Redirect bilibili video src to local file
// @icon            https://www.bilibili.com/favicon.ico
//
// @author			Kr328
// @namespace       http://github.com/Kr328/bilibili-redirect
//
// @match           https://www.bilibili.com/bangumi/play/*
// @match           https://www.bilibili.com/video/*
//
// @grant           GM_addStyle
//
// @version         1.0
// ==/UserScript==

(function () {
    'use strict';

    const defaultServerURL = "%%%SERVER_URL%%%";

    // language=CSS
    GM_addStyle(`
        .bilibili-redirect-popup {
            width: 400px;
            height: 80vh;
            
            z-index: 10000;
            position: fixed;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            
            background: white;
            border-radius: 10px;
            box-shadow: 0 10px 16px 0 rgba(0, 0, 0, 0.35);
            
            padding: 10px;
            display: flex;
            flex-direction: column;
        }

        .bilibili-redirect-popup-hidden {
            display: none;
        }

        .bilibili-redirect-popup div {
            display: flex;
        }

        .bilibili-redirect-popup .clickable {
            background-color: transparent;
            transition: background-color 200ms linear;
        }
        
        .bilibili-redirect-popup .clickable:hover {
            background-color: rgba(0, 0, 0, 0.1);
            transition: background-color 200ms linear;
        }

        .bilibili-redirect-popup .control-row {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 10px;
        }

        .bilibili-redirect-popup .files-list {
            flex-direction: column;
            overflow: scroll;
            padding: 8px;
        }
        
        .bilibili-redirect-popup #bilibili-redirect-url {
            flex: 1;
            padding: 5px;
            margin-left: 10px;
            margin-right: 10px;
            border: 0;
            border-bottom: 1px solid rgba(0, 0, 0, 0.70);
        }

        .bilibili-redirect-popup #bilibili-redirect-refresh {
            padding: 5px;
            margin: 5px;
            border: none;
            color: #00a1d6;
        }
        
        .bilibili-redirect-popup #bilibili-redirect-close {
            margin-right: 5px;
            width: 24px;
            height: 24px;
        }
        
        .bilibili-redirect-popup .files-list .item {
            display: block;
            padding: 10px;
            margin: 0 0 5px 0;
            border: 1px solid rgba(0, 0, 0, 0.4);
            border-radius: 5px;
            font-size: 14px;
            word-break: break-word;
        }
    `)

    function injectPopupWindow() {
        const dialog = document.createElement("div");
        dialog.id = "bilibili-redirect-dialog"
        dialog.classList.add("bilibili-redirect-popup");
        dialog.classList.add("bilibili-redirect-popup-hidden");

        // language=HTML
        dialog.innerHTML = `
            <div class="control-row">
                <span style="font-size: 18px">使用本地源</span>
                <svg id="bilibili-redirect-close" class="clickable" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path d="m12.45 37.65-2.1-2.1L21.9 24 10.35 12.45l2.1-2.1L24 21.9l11.55-11.55 2.1 2.1L26.1 24l11.55 11.55-2.1 2.1L24 26.1Z"/></svg>
            </div>
            <div class="control-row">
                <span style="font-size: 14px">服务端地址</span>
                <input id="bilibili-redirect-url" type="text"/>
                <button id="bilibili-redirect-refresh" class="clickable">刷新</button>
            </div>
            <div id="bilibili-redirect-files-list" class="files-list"></div>
        `

        document.body.appendChild(dialog);

        setTimeout(() => {
            let refreshing = false;
            let destroyed = false;

            const close = document.querySelector("#bilibili-redirect-close")
            close.addEventListener("click", () => {
                dialog.classList.add("bilibili-redirect-popup-hidden");
            })

            const url = document.querySelector("#bilibili-redirect-url")
            if (!(url instanceof HTMLInputElement)) {
                return;
            }

            url.value = defaultServerURL

            const refresh = document.querySelector("#bilibili-redirect-refresh")
            if (!(refresh instanceof HTMLButtonElement)) {
                return;
            }

            const fileList = document.querySelector("#bilibili-redirect-files-list");
            if (!(fileList instanceof HTMLDivElement)) {
                return;
            }

            refresh.addEventListener("click", () => {
                if (!refreshing) {
                    refreshing = true;

                    const baseUrl = url.value;

                    (async () => {
                        fileList.innerHTML = ""

                        try {
                            const resp = await fetch(baseUrl, {
                                headers: {
                                    "Accept": "application/json",
                                }
                            });
                            const files = JSON.parse(await resp.text());

                            files.files.forEach((file) => {
                                const elm = document.createElement("span")
                                elm.innerText = file.name
                                elm.classList.add("item")
                                elm.classList.add("clickable")
                                elm.addEventListener("click", () => {
                                    const video = document.querySelector("video");
                                    const player = unsafeWindow.player;

                                    if (!destroyed) {
                                        destroyed = true;

                                        player.core().destroy();
                                    }

                                    player.core().seek = async function (t) {
                                        video.currentTime = t
                                    }

                                    video.src = baseUrl + "/" + encodeURIComponent(file.name);

                                    dialog.classList.add("bilibili-redirect-popup-hidden")
                                })
                                fileList.appendChild(elm)
                            });
                        } catch (e) {
                            fileList.innerHTML = "<storage>Unable to fetch list: " + e + "</storage>"
                        } finally {
                            refreshing = false
                        }
                    })();
                }
            });

            if (url.value !== "") {
                refresh.dispatchEvent(new Event("click"))
            }
        })
    }

    function tryPatch(listSelector, moreSelector) {
        const wrap = document.querySelector(listSelector);
        if (wrap == null) {
            return false;
        }

        const moreNode = wrap.querySelector(moreSelector)
        if (moreNode == null) {
            console.error("more settings not found");

            return true;
        }

        const replaceNode = moreNode.cloneNode(true)
        if (!(replaceNode instanceof Element)) {
            console.error("invalid cloned object");

            return true;
        }

        replaceNode.querySelector("span").innerText = "使用本地源";
        replaceNode.addEventListener("click", (e) => {
            document.querySelector("#bilibili-redirect-dialog").classList.remove("bilibili-redirect-popup-hidden")
        });

        wrap.appendChild(replaceNode);

        return true;
    }

    function pollPatch() {
        if (
            !tryPatch(".squirtle-setting-panel-wrap", ".squirtle-single-select.squirtle-setting-more") &&
            !tryPatch(".bpx-player-ctrl-setting-menu-left", ".bpx-player-ctrl-setting-more")
        ) {
            setTimeout(pollPatch, 1000);

            return;
        }

        const controlBox = document.querySelector(".bpx-player-ctrl-setting-box")
        if (controlBox != null) {
            const panel = controlBox.querySelector(".bui-panel-wrap");
            if (panel != null) {
                panel.style.height = "170px";

                panel.querySelectorAll(".bui-panel-item").forEach((elm) => {
                    elm.style.height = "100%";
                })
            }
        }
    }

    window.addEventListener("load", () => {
        injectPopupWindow();

        pollPatch();
    });
})();
