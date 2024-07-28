const {ItemInfo} = require('../models')
const datasource = require('./datasource')
const pinyin = require('tiny-pinyin')
const path = require('path')
const fs = require('fs')

const DEFAULT_ICON = "https://cdn.icon-icons.com/icons2/1674/PNG/512/bookmark_111017.png"

class ChromeBookmarks extends datasource.DataSource {

    constructor(platform) {
        super()
        this.platform = platform
    }

    async preLoadInfos() {
        let chromeDataDir = ''
        const profiles = ['Default', 'Profile 3', 'Profile 2', 'Profile 1']
        if (this.platform === 'win32') {
            chromeDataDir = path.join(process.env['LOCALAPPDATA'], 'Google/Chrome/User Data')
        } else if (this.platform === 'darwin') {
            chromeDataDir = path.join(window.utools.getPath('appData'), 'Google/Chrome')
        } else if (this.platform === 'linux') {
            chromeDataDir = path.join(window.utools.getPath('appData'), 'google-chrome')
        }
        const profile = profiles.find(profile => fs.existsSync(path.join(chromeDataDir, profile, 'Bookmarks')))
        if (!profile) return []
        const bookmarkPath = path.join(chromeDataDir, profile, 'Bookmarks')
        const newBookmarksData = []
        try {
            /**
             * todo 修改成异步的
             */
            const data = JSON.parse(fs.readFileSync(bookmarkPath, 'utf-8'))
            const getUrlData = (item) => {
                if (!item || !Array.isArray(item.children)) return
                item.children.forEach(c => {
                    if (c.type === 'url') {
                        newBookmarksData.push(new ItemInfo(c.name, c.url, "【来自书签】" + c.name.toLowerCase(), DEFAULT_ICON, this.buildSearKeys(c)))
                    } else if (c.type === 'folder') {
                        getUrlData(c)
                    }
                })
            }
            getUrlData(data.roots.bookmark_bar)
            getUrlData(data.roots.other)
            getUrlData(data.roots.synced)
        } catch (e) {
            console.error("读取书签失败", e)
        }
        this.cacheInfos = newBookmarksData
    }

    buildSearKeys(info) {
        let searKeys = []
        if (info === null || !pinyin.isSupported()) {
            return searKeys;
        }
        searKeys.push(info.name.toLowerCase())
        searKeys.push(pinyin.convertToPinyin(info.name).toLowerCase())
        return searKeys
    }

    findSourceName() {
        return "chromeBookmark"
    }

}


module.exports = {
    ChromeBookmarks: ChromeBookmarks
}