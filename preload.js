
const pingyin = require('tiny-pinyin')

const { ChromeBookmarks } = require('./datasource/ChromeBookmark')
const { ChomeHistory } = require('./datasource/ChromeHistory')
const fs = require("fs")

// function writeSomething() {
//     let value = Math.floor(Math.random() * 100) + 1
//     fs.writeFileSync("D:\\Codes\\utool_plugin\\analyze\\cache_file_2", value.toString(), "utf8")
//     console.log(value.toString())
// }


window.exports = {
    "chrome": {
        mode: "list",
        args: {
            // 进入插件应用时调用（可选）
            enter: (action, callbackSetList) => {
                try {
                    let infos = new ChromeBookmarks(process.platform).listItemInfos()
                    let histroysPromise = new ChomeHistory(process.platform).listItemInfos()
                    histroysPromise.then((response) => {
                        console.log('history length=' + (response).length)
                        callbackSetList([
                            {
                                title: "请输入关键字",
                                description: "请输入关键字"
                            },
                        ])
                    })
                } catch (error) {
                    console.error("Error initializing database:", error);
                }
                // 如果进入插件应用就要显示列表数据
            },
            // 子输入框内容变化时被调用 可选 (未设置则无搜索)
            search: (action, searchWord, callbackSetList) => {
                var word;
                if (pingyin.isSupported()) {
                    word = pingyin.convertToPinyin(searchWord, ",", true)
                }
                // 获取一些数据
                // 执行 callbackSetList 显示出来
                callbackSetList([
                    {
                        title: "这是标题",
                        description: "这是拼音:" + word,
                        icon: "", // 图标
                        url: "https://yuanliao.info",
                    },
                ])
            },
            // 用户选择列表中某个条目时被调用
            select: (action, itemData, callbackSetList) => {
                window.utools.hideMainWindow()
                const url = itemData.url
                require('electron').shell.openExternal(url)
                window.utools.outPlugin()
            },
            // 子输入框为空时的占位符，默认为字符串"搜索"
            placeholder: "搜索",
        },
    },
}