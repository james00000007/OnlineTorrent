const trackerURL = ["wss://tracker.lili.ac", "wss://tracker.btorrent.xyz", "wss://tracker.openwebtorrent.com"];

let webseedPrefix = [];

const webseedSuffix = "";

const client = new WebTorrent();

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
    return `${filesize(file._torrent.downloadSpeed)}/S (${filesize(file._torrent.downloaded)})`;
}

function getUploadInfo(file) {
    return `${filesize(file._torrent.uploadSpeed)}/S (${filesize(file._torrent.uploaded)})`;
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
