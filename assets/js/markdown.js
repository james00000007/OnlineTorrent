const markdownURL = decodeURIComponent(getQueryVariable("source")[0]);

if (markdownURL != typeof undefined) {
    $("#introduce-markdown").attr("mdsource", markdownURL);

    loadMarkdown();

    $("#introduce-area").removeClass("mdui-hidden");
}
