const pingyin = require('tiny-pinyin')

const {ChromeBookmarks} = require('./datasource/ChromeBookmark')
const {ChromeHistory} = require('./datasource/ChromeHistory')

let dataSources = []
let lastInitTime = null

/**
 * 进入插件时候进行的初始化动作
 * @param platform 平台类型
 */
async function enterInit(platform) {
    // 如果dataSource之前没初始化过 或者 初始化已经超过3秒，则重新初始化
    if (dataSources.length <= 0 || (lastInitTime != null && (Math.abs(new Date().getTime() - lastInitTime.getTime()) / 1000)) > 3) {
        dataSources = []
        dataSources.push(new ChromeBookmarks(platform))
        lastInitTime = new Date()
        // dataSources.push(new ChromeHistory(platform))
        return Promise.all(dataSources.map(item => item.loadInfos()))
    } else {
        console.log("已经初始化，直接返回")
    }
}

async function searchKeyword(searchWord) {
    let resPromise = Promise.all(dataSources.flatMap(item => item.listItemInfos(searchWord)))
    return (await resPromise).flat(Infinity)
}

window.exports = {
    "chrome": {
        mode: "list", args: {
            // 进入插件应用时调用（可选）
            enter: (action, callbackSetList) => {
                try {
                    enterInit(process.platform).then((_) => {
                        searchKeyword('Java').then(innerRes => callbackSetList(innerRes))
                        // console.log('history length=' + (response).length)
                        //
                        // callbackSetList([{
                        //     title: "请输入关键字", description: "请输入关键字"
                        // }])
                    })
                } catch (error) {
                    callbackSetList([{
                        title: "初始化失败", description: "初始化失败，请重试"
                    },])
                }
                // 如果进入插件应用就要显示列表数据
            }, // 子输入框内容变化时被调用 可选 (未设置则无搜索)
            search: (action, searchWord, callbackSetList) => {
                searchKeyword(searchWord).then(innerRes => {
                    console.log('innerRes=' + JSON.stringify(innerRes))
                    callbackSetList(innerRes)
                })
            }, // 用户选择列表中某个条目时被调用
            select: (action, itemData, callbackSetList) => {
                window.utools.hideMainWindow()
                const url = itemData.url
                require('electron').shell.openExternal(url)
                window.utools.outPlugin()
            }, // 子输入框为空时的占位符，默认为字符串"搜索"
            placeholder: "搜索",
        },
    },
}