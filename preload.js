
const {ChromeBookmarks} = require('./datasource/ChromeBookmark')
const {ChromeHistory} = require('./datasource/ChromeHistory')
const icon = require('./utils/icon')

/**
 * 数据源Map
 * 类似 {"Bookmarks":ChromeBookmarks,"History":ChromeHistory}
 * @type {{}}
 */
let dataSources = []
let lastInitTime = null

/**
 * 进入插件时候进行的初始化动作
 * @param platform 平台类型
 */
async function enterInit(platform) {
    // 如果dataSource之前没初始化过 或者 初始化已经超过3秒，则重新初始化
    if (dataSources.length <= 0 || (lastInitTime != null && (Math.abs(new Date().getTime() - lastInitTime.getTime()) / 1000)) > 3) {
        let newSources = []
        newSources.push(new ChromeBookmarks(platform))
        newSources.push(new ChromeHistory(platform))
        return Promise.all(newSources.map(item => item.preLoadInfos()))
            .then(_ => {
                lastInitTime = new Date()
                dataSources = newSources
                return newSources
            })
    } else {
        console.log("已经初始化，直接返回")
        return Promise.resolve(dataSources)
    }
}

function searchInfo(searchWord, successCallBack, errorCallBack, specifiedSources) {
    try {
        enterInit(process.platform)
            .then(sources => {
                let searchSource
                if (specifiedSources && specifiedSources.length > 0) {
                    console.log("specifiedSource search " + JSON.stringify(specifiedSources))
                    searchSource = sources.filter(item => specifiedSources.includes(item.findSourceName()))
                } else {
                    searchSource = sources
                }
                return Promise.all(searchSource.map(item => item.listItemInfos(searchWord)))
            })
            .then(lists => lists.flatMap(it => it))
            .then(innerRes => {
                if (innerRes && innerRes.length > 100) {
                    innerRes = innerRes.slice(0, 100)
                }
                icon.findIcons(process.platform, innerRes.map(item => item.url))
                    .then(urlWithIconMap => {
                        innerRes.forEach(item => {
                            let iconUrl = urlWithIconMap[item.url]
                            if (iconUrl) {
                                item.icon = iconUrl
                            }
                        })
                        successCallBack(innerRes)
                    })
                    .catch(_ => {
                        successCallBack(innerRes)
                    })
            })
    } catch (error) {
        console.error("searchInfo失败", error)
        errorCallBack(error)
    }
}

window.exports = {
    "chrome": {
        mode: "list", args: {
            // 进入插件应用时调用（可选）
            enter: (action, callbackSetList) => {
                searchInfo('', function (innerRes) {
                    console.log("搜索结果" + JSON.stringify(innerRes))
                    callbackSetList(innerRes)
                }, function (_) {
                    callbackSetList([{
                        title: "搜索失败", description: "搜索失败，请重试"
                    },])
                }, ["chromeHistory"])
            },

            // 子输入框内容变化时被调用 可选 (未设置则无搜索)
            search: (action, searchWord, callbackSetList) => {
                if (searchWord.length === 0) {
                    return
                }
                searchInfo(searchWord, function (innerRes) {
                    console.log("搜索结果" + JSON.stringify(innerRes))
                    callbackSetList(innerRes)
                }, function (_) {
                    callbackSetList([{
                        title: "搜索失败", description: "搜索失败，请重试"
                    },])
                }, [])
            },

            // 用户选择列表中某个条目时被调用
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