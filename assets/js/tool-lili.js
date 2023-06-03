const serverURL = ["https://sg1-server.darknight.tech:16101/", "https://cn2-server.darknight.tech:16101/", "https://pku.dnlab.net:16101/", "/"];

const videoExt = ["mp4", "ogg", "webm", "mkv", "mov", "3g2", "3gp", "m4v", "m2ts", "ogm", "ogv", "webm"];

const audioExt = ["mp3", "wav", "flac", "m3u", "aac", "ac3", "eac3", "opus", "vorbis"];

const imageExt = ["png", "jpg", "jpeg", "webp"];

const md = markdownit();

/**
 * @deprecated
 */
function uriEncode(strin) {
    return strin.replaceAll("?", "%3F").replaceAll("=", "%3D").replaceAll("&", "%26");
}

/**
 * @deprecated
 */
function uriDecode(strin) {
    return strin.replaceAll("%26", "&").replaceAll("%3D", "=").replaceAll("%3F", "?");
}

function getQueryVariable(variable) {
    let res = [];
    let query = window.location.search.substring(1);
    let vars = query.split("&");
    for (let i = 0; i < vars.length; i++) {
        let pair = vars[i].split("=");
        if (pair[0] == variable) {
            res.push(pair[1]);
        }
    }
    return res;
}

function loadMarkdown() {
    $("[mdtarget]").each(function () {
        let e = $(this);
        if (e.attr("mdsource") != undefined) {
            $.get(e.attr("mdsource"), function (result) {
                $(e.attr("mdtarget"))
                    .empty()
                    .append($(md.render(result)));
            });
        } else {
            $(e.attr("mdtarget"))
                .empty()
                .append($(md.render(e.text())));
        }
    });
}

function getExt(filename) {
    return filename.substring(filename.lastIndexOf(".") + 1);
}

function getName(filename) {
    return filename.substring(0, filename.lastIndexOf("."));
}

function isExt(filename, fileExt) {
    let ext = filename.substring(filename.lastIndexOf(".") + 1);
    return fileExt.indexOf(ext.toLowerCase()) != -1;
}

function filesize(s) {
    var res = "";
    if (s < 1000) {
        //如果小于1KB转化成B
        res = s.toPrecision(3) + "B";
    } else if (s < 1000 * 1000) {
        //如果小于1MB转化成KB
        res = (s / 1000).toPrecision(3) + "K";
    } else if (s < 1000 * 1000 * 1000) {
        //如果小于1GB转化成MB
        res = (s / (1000 * 1000)).toPrecision(3) + "M";
    } else {
        //其他转化成GB
        res = (s / (1000 * 1000 * 1000)).toPrecision(3) + "G";
    }
    return res;
}

function log(str) {
    let logEle = $("#log");
    let p = $("<p>" + str + "</p>");
    logEle.append(p);
    let logParent = logEle.parent();
    logParent.scrollTop(logParent[0].scrollHeight);
    // logEle.val(logEle.val() + str + "\n");
}

function uploadTorrent(file, sURL, success, error) {
    let formData = new FormData();
    formData.append("torrent", file);
    $.ajax({
        url: sURL + "api/add/torrent",
        type: "POST",
        data: formData,
        contentType: false,
        processData: false,
        success: success,
        error: error,
    });
}

function sendURI(uri, sURL, success, error) {
    $.ajax({
        type: "POST",
        dataType: "json",
        url: sURL + "api/add/uri",
        contentType: "application/json",
        data: JSON.stringify({
            Auth: {
                Secret: "canoziia",
            },
            URI: uri,
        }),
        success: success,
        error: error,
    });
}

function deleteTorrent(hash, sURL, success, error) {
    $.ajax({
        type: "POST",
        dataType: "json",
        url: `${sURL}api/torrent/${hash}/delete`,
        contentType: "application/json",
        data: JSON.stringify({
            Auth: {
                Secret: "canoziia",
            },
            DeleteFile: "yes",
        }),
        success: success,
        error: error,
    });
}

export { serverURL, videoExt, audioExt, imageExt, uriEncode, uriDecode, getQueryVariable, loadMarkdown, getExt, getName, isExt, filesize, log, uploadTorrent, sendURI, deleteTorrent };
