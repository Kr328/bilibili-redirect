declare global {
    function GM_addStyle(style: string): undefined

    let unsafeWindow: GlobalWindow;

    interface PlayerCore {
        destroy(): undefined

        seek: (time: number) => Promise<void>
    }

    interface Player {
        core(): PlayerCore
    }

    interface GlobalWindow extends Window {
        player: Player
    }

    interface ResponseFile {
        name: string;
    }

    interface ResponseFileList {
        files: Array<ResponseFile>;
    }
}

export {};
