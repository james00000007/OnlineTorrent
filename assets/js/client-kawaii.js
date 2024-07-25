// @latest属于高风险策略
import WebTorrent from "https://cdn.jsdelivr.net/npm/webtorrent@2.4.12/dist/webtorrent.min.js";
import * as tools from "./tool-kawaii.js";
const trackerURL = ["wss://tracker.dnlab.net:16443", "wss://tracker.projectk.org", "wss://tracker.btorrent.xyz", "wss://tracker.openwebtorrent.com"];

let webseedPrefix = [];

const client = new WebTorrent({
    tracker: {
        rtcConfig: {
            iceServers: [
                {
                    urls: ["stun:stun.miwifi.com:3478", "stun:stun.l.google.com:19302", "stun:global.stun.twilio.com:3478"],
                },
            ],
        },
    },
});

function startMagnet(magnet, onTorrent) {
    client.add(
        magnet,
        {
            announce: trackerURL,
        },
        onTorrent
    );
    // client.add(magnet, onTorrent);
}

function getDownloadInfo(file) {
    return `${tools.filesize(file._torrent.downloadSpeed)}/S (${tools.filesize(file._torrent.downloaded)})`;
}

function getUploadInfo(file) {
    return `${tools.filesize(file._torrent.uploadSpeed)}/S (${tools.filesize(file._torrent.uploaded)})`;
}

function getPeerInfo(file) {
    return file._torrent.wires.length;
}

function getProgressInfo(file) {
    return file.progress.toPrecision(2);
}

function getFileTorrentHash(file) {
    return file._torrent.infoHash;
}

export { trackerURL, webseedPrefix, client, startMagnet, getDownloadInfo, getUploadInfo, getPeerInfo, getProgressInfo, getFileTorrentHash };
