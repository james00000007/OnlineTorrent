import * as tools from "./tool-lili.js";

const markdownURL = decodeURIComponent(tools.getQueryVariable("source")[0]);

if (markdownURL != typeof undefined) {
    $("#introduce-markdown").attr("mdsource", markdownURL);

    tools.loadMarkdown();

    $("#introduce-area").removeClass("mdui-hidden");
}
