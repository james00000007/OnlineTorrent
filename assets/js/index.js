import * as tools from "./tool-kawaii.js";
import * as webtorrent from "./client-kawaii.js";

const serverURL = tools.serverURL;

const loopTime = 2000;

const progressBarSplits = 200;

// const defaultEnableWebseed = true;
const defaultEnableWebseed = false;

var printInfo;
var progressBarAllDone = false;

$("#uri").keydown(function (e) {
    if (e.keyCode == "13") {
        e.preventDefault();
        let uri = $(this).val();
        sendURIToAll(uri);
    }
});

$("#upload-select").click(function (e) {
    $("#upload-torrent").click();
});

$("#upload-torrent").change(function (e) {
    $("#upload-filename").text($("#upload-torrent")[0].files[0].name);
});

$("#upload-submit").click(function (e) {
    if ($("#upload-torrent")[0].files[0] == undefined) {
        tools.log("还没选择要上传的文件!");
        return;
    }
    uploadTorrentToAll($("#upload-torrent")[0].files[0]);
});

$("#share-button").click(function (e) {
    let urlsuffix = "/?";
    webtorrent.client.torrents.forEach(function (t) {
        // urlsuffix += `uri=${encodeURIComponent(t.magnetURI)}&`;
        urlsuffix += `uri=${encodeURIComponent("magnet:?xt=" + t.xt)}&`;
    });
    urlsuffix = urlsuffix.substring(0, urlsuffix.length - 1);
    let res = window.location.origin + urlsuffix;
    $("#share-url").val(res);
});

$("#share-url").click(function (e) {
    // $("#share-url").select();
    // document.execCommand("copy");
    navigator.clipboard.writeText(document.getElementById("share-url").value);
    mdui.snackbar({
        message: "已复制到剪贴板",
        position: "right-bottom",
    });
});

initPage();

function initPage() {
    tools.loadMarkdown();
    loadShareURL();
    setProgressBar();
    loadServiceWorker();
    loadBangumiMoe();
}

function loadBangumiMoe() {
    let xhr = new XMLHttpRequest();
    xhr.open("GET", "https://kawaiiapi.projectk.org/api/v1/bangumi.moe/api/torrent/latest");
    xhr.send();
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4 && xhr.status == 200) {
            let json = JSON.parse(xhr.responseText);
            let torrents = json.torrents;
            for (let i = 0; i < torrents.length; i++) {
                let torrent = torrents[i];
                let div = document.createElement("div");
                div.setAttribute("class", "mdui-list-item mdui-ripple");
                let div2 = document.createElement("div");
                div2.setAttribute("class", "mdui-list-item-content");
                let div3 = document.createElement("div");
                div3.setAttribute("class", "mdui-list-item-title");
                div3.setAttribute("magnetURI", torrent.magnet);
                div3.innerText = torrent.size + " " + torrent.content.length + "文件 | " + torrent.title;
                div2.appendChild(div3);
                div.appendChild(div2);
                document.getElementById("bangumi-list").appendChild(div);
                div.addEventListener("click", function () {
                    sendURIToAll(this.children[1].children[0].getAttribute("magnetURI"));
                });
            }
        }
        document.getElementById("bangumi-area").classList.remove("mdui-hidden");
    };
}

function loadServiceWorker() {
    navigator.serviceWorker.register("/sw.min.js", { scope: "/" }).then((reg) => {
        const worker = reg.active || reg.waiting || reg.installing;
        function checkState(worker) {
            return worker.state === "activated" && webtorrent.client.createServer({ controller: reg });
        }
        if (!checkState(worker)) {
            worker.addEventListener("statechange", ({ target }) => checkState(target));
        }
    });
}

// 检测url并加载链接
function loadShareURL() {
    let mList = tools.getQueryVariable("uri");
    if (mList.length == 0) {
        return;
    }
    mList.forEach(function (strin) {
        sendURIToAll(decodeURIComponent(strin));
    });
}

function onTorrent(torrent) {
    tools.log("已获取种子信息");
    tools.log("种子名: " + torrent.name);
    tools.log(
        "哈希值: " +
            torrent.infoHash +
            " " +
            //  '<a href="' + torrent.magnetURI + '" target="_blank">[磁力链接]</a> ' +
            '<a href="' +
            torrent.torrentFileBlobURL +
            '" target="_blank" download="' +
            torrent.name +
            '.torrent">[下载 .torrent]</a>'
    );

    // 优先下载首尾，获取播放时长
    let priority = 10;
    torrent.files.forEach(function (file) {
        torrent.select(file._endPiece, file._endPiece, priority);
        torrent.select(file._startPiece, file._startPiece, priority);
    });

    function enableWebseed() {
        webtorrent.webseedPrefix.forEach((prefix) => {
            let webseedURL;
            if (torrent.files.length == 1 && torrent.files[0].name == torrent.files[0].path) {
                // 如果这是一个单文件种子, 不带文件夹
                webseedURL = prefix + encodeURIComponent(torrent.files[0].name);
            } else {
                // 文件夹种子
                webseedURL = prefix;
            }
            torrent.addWebSeed(webseedURL);
        });
        tools.log("已启用webseed");
    }

    $("#enable-webseed").unbind("click").click(enableWebseed);
    $("#disable-webseed")
        .unbind("click")
        .click(function (e) {
            for (let i = torrent.wires.length - 1; i >= 0; i--) {
                if (torrent.wires[i].type == "webSeed") {
                    torrent.wires[i].destroy();
                }
            }
            tools.log("已禁用webseed");
        });

    // 自动启用webseed
    if (defaultEnableWebseed) {
        // 30秒后启用webseed, 防止流量爆炸
        setTimeout(enableWebseed, 30000);
    }

    // Render all files into to the page
    torrent.files.forEach(function (file) {
        if (tools.isExt(file.name, tools.videoExt)) {
            let li = addList(file, function () {
                $("#video")[0].oncanplay = function () {
                    $("#video").css("aspect-ratio", "");
                };
                // file.renderTo("#video");
                file.streamTo($("#video")[0]);
                $("#video-area").removeClass("mdui-hidden");
                $("#video-title").text(file.name);
                $(document).attr("title", file.name);
            });
            // 自动播放
            if ($("#video-area").hasClass("mdui-hidden")) {
                // 两秒后点击
                setTimeout(function () {
                    li.click();
                }, 2000);
            }
        } else if (tools.isExt(file.name, tools.imageExt)) {
            addList(file, function () {
                $("#other-file").empty();
                $("#other-area").removeClass("mdui-hidden");
                let img = document.createElement("img");
                file.streamTo(img);
                document.getElementById("other-file").appendChild(img);
            });
        } else if (tools.isExt(file.name, tools.audioExt)) {
            addList(file, function () {
                $("#other-file").empty();
                $("#other-area").removeClass("mdui-hidden");
                // 未检查
                let audio = document.createElement("audio");
                audio.setAttribute("controls", "controls");
                file.streamTo(audio);
                document.getElementById("other-file").appendChild(audio);
            });
        } else {
            tools.log(`不支持播放${file.name}, 左侧面板点击 √ 可下载`);
        }
    });
}

function setProgressBar() {
    for (let i = 0; i < progressBarSplits; i++) {
        let d = document.createElement("div");
        d.setAttribute("class", "progress-item");
        document.getElementById("progress-bar").appendChild(d);
    }
}

function updateProgressBar(file) {
    let bar = document.getElementById("progress-bar");
    let startPiece = file._startPiece;
    let endPiece = file._endPiece;
    let piecePerSegment = (endPiece + 1 - startPiece) / progressBarSplits;
    // let pieceNumber = startPiece;
    for (let i = 0; i < progressBarSplits; i++) {
        let segment = bar.children.item(i);
        if (segment.classList.contains("progress-color-complete")) {
            continue;
        }
        let hasNotReady = false;
        let hasReady = false;
        for (let pieceNumber = Math.floor(startPiece + piecePerSegment * i); pieceNumber < startPiece + piecePerSegment * (i + 1); pieceNumber++) {
            if (file._torrent.pieces[pieceNumber] == null) {
                // 说明已经下载完
                hasReady = true;
            } else {
                hasNotReady = true;
            }
            if (hasReady && hasNotReady) {
                break;
            }
        }
        if (hasReady && hasNotReady) {
            // 下到一半
            segment.setAttribute("class", "progress-item progress-color-half");
            // pieceNumber = Math.ceil(startPiece + piecePerSegment * (i + 1));
        } else if (hasReady) {
            // 下完了
            segment.setAttribute("class", "progress-item progress-color-complete");
        } else if (!hasNotReady && !hasReady) {
            // 这种是不可能的
        }
    }
    if (file.done) {
        progressBarAllDone = true;
    }
}

function resetProgressBar() {
    let bar = document.getElementById("progress-bar");
    for (let i = 0; i < bar.children.length; i++) {
        bar.children.item(i).setAttribute("class", "progress-item");
    }
}

function addList(file, clickfunc) {
    $("#file-list-area").removeClass("mdui-hidden");
    let li = $(`<li class="mdui-list-item mdui-ripple">` + file.name + `</li>`);
    li.click(function () {
        clearInterval(printInfo);
        resetProgressBar();
        printInfo = setInterval(function () {
            $("#download-info").text(webtorrent.getDownloadInfo(file));
            $("#upload-info").text(webtorrent.getUploadInfo(file));
            $("#peer-info").text(webtorrent.getPeerInfo(file));
            $("#progress-info").text(webtorrent.getProgressInfo(file));
            if (!progressBarAllDone) {
                updateProgressBar(file);
            }
        }, loopTime);
        $("#delete-torrent")
            .unbind("click")
            .click(function () {
                deleteTorrentInAll(webtorrent.getFileTorrentHash(file));
            });
        $("#peer-info")
            .parent()
            .unbind("click")
            .click(function () {
                let peerip = $("#peer-ip");
                peerip.empty();
                file._torrent.wires.forEach(function (wire) {
                    if (wire.type == "webrtc") {
                        let li = $(`<li class="mdui-menu-item">
                            <a class="mdui-ripple" style="overflow-x: auto">${wire.remoteAddress}</a>
                        </li>`);
                        peerip.append(li);
                    }
                });
                file._torrent.urlList.forEach(function (peerurl) {
                    let li = $(`<li class="mdui-menu-item">
                        <a class="mdui-ripple" style="overflow-x: auto">${peerurl}</a>
                    </li>`);
                    peerip.append(li);
                });
            });
        $("#download-file").attr({ href: file.streamURL });
        clickfunc();
    });
    $("#file-list").append(li);
    return li;
}

function uploadTorrentToAll(file) {
    tools.log("开始上传文件");
    let okflag = 0;
    for (let i = 0; i < serverURL.length; i++) {
        tools.uploadTorrent(
            file,
            serverURL[i],
            function (result) {
                // if (result.response == 200) {
                if (result.info) {
                    if (okflag == 0) {
                        okflag = 1;
                        tools.log("torrent 上传成功");
                        webtorrent.startMagnet(result.magnetURI, onTorrent);
                    }
                } else {
                    tools.log("torrent 上传失败[200]: " + serverURL[i]);
                }
            },
            function (e) {
                if (okflag == 0) {
                    tools.log("torrent 上传失败: " + serverURL[i]);
                }
            }
        );
    }
}

function sendURIToAll(uri) {
    tools.log("开始发送请求");
    let okflag = 0;
    for (let i = 0; i < serverURL.length; i++) {
        tools.sendURI(
            uri,
            serverURL[i],
            function (result) {
                // if (result.response == 200) {
                if (result.info) {
                    if (okflag == 0) {
                        okflag = 1;
                        tools.log("请求发送成功");
                        tools.log("已添加种子，磁力链接为: " + '<a href="' + result.magnetURI + '" target="_blank">[磁力链接]</a> ');
                        webtorrent.startMagnet(result.magnetURI, onTorrent);
                    }
                    webtorrent.webseedPrefix.push(serverURL[i] + "webseed/");
                } else {
                    tools.log("请求发送失败[200]: " + serverURL[i]);
                }
            },
            function (e) {
                if (okflag == 0) {
                    tools.log("请求发送失败: " + serverURL[i]);
                }
            }
        );
    }
    setTimeout(() => {
        if (okflag == 0) {
            webtorrent.startMagnet(uri, onTorrent);
        }
    }, 5000);
}

function deleteTorrentInAll(hash) {
    tools.log("请求删除种子");
    for (let i = 0; i < serverURL.length; i++) {
        tools.deleteTorrent(
            hash,
            serverURL[i],
            function (result) {
                if (result) {
                    tools.log("请求删除成功: " + serverURL[i]);
                } else {
                    tools.log("请求删除失败[200]: " + serverURL[i]);
                }
            },
            function (e) {
                tools.log("请求删除失败: " + serverURL[i]);
            }
        );
    }
}
