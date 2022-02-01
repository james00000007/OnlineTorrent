$("#uri").keydown(function (e) {
    if (e.keyCode == "13") {
        e.preventDefault();
        let sURL = $(this).val();
        printStatus(sURL);
    }
});

initPage();

function initPage() {
    loadMarkdown();
}

function printStatus(serverURI) {
    $("#torrent-list").empty();
    $.ajax({
        url: serverURI + "api/status",
        type: "GET",
        success: function (result) {
            if (result.Torrents == null) {
                log("服务器上没有种子: " + serverURI);
                $("#torrent-area").addClass("mdui-hidden");
            } else {
                result.Torrents.forEach(function (torr) {
                    $("#torrent-area").removeClass("mdui-hidden");
                    addTorrentToList(torr);
                });
            }
        },
        error: function (e) {
            log("获取不到服务器信息: " + serverURI);
        },
    });
}

function addTorrentToList(torr) {
    let li = $(`<li class="mdui-list-item mdui-ripple">${torr.Name}</li>`);
    li.click(function () {
        $("#torrent-list")
            .children()
            .each(function () {
                $(this).removeClass("mdui-list-item-active");
            });
        li.addClass("mdui-list-item-active");
        $("#showinfo")
            .unbind("click")
            .click(function () {
                $("#download-info").text(filesize(torr.ConnStatus.BytesRead));
                $("#upload-info").text(filesize(torr.ConnStatus.BytesWritten));
                $("#peer-info").text(`Total: ${torr.TotalPeers} | Pending: ${torr.PendingPeers} | Active: ${torr.ActivePeers}`);
                $("#open-drawer")[0].click();
                $("#torrent-info")[0].click();
            });
        $("#opentorrent")
            .unbind("click")
            .click(function () {
                let urlsuffix = "/?";
                urlsuffix += `uri=${uriEncode(torr.Magnet)}`;
                // let res = window.location.origin + urlsuffix;
                window.open(urlsuffix);
            });
        $("#deletetorrent")
            .unbind("click")
            .click(function () {
                let sURL = $("#uri").val();
                deleteTorrent(
                    torr.Hash,
                    sURL,
                    function (result) {
                        if (result.response == 200) {
                            log("请求删除成功: " + sURL);
                        } else {
                            log("请求删除失败[200]: " + sURL);
                        }
                    },
                    function (e) {
                        log("请求删除失败: " + sURL);
                    }
                );
                printStatus(sURL);
            });
    });
    $("#torrent-list").append(li);
}
