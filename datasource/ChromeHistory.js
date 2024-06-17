const {ItemInfo} = require('../models')
const initSqlJs = require("sql.js")
const fs = require("fs")
const path = require('path')
const datasource = require('./datasource')
const pinyin = require('tiny-pinyin')

/**
 * 查询最近 1W条历史记录，建立拼音索引
 * @type {string}
 */
const QUERY_HISTORY_SQL = "select * from urls order by last_visit_time desc limit 10000"

/**
 * Chrome历史记录查询数据源
 */
class ChromeHistory extends datasource.DataSource {

    constructor(platform) {
        super()
        this.platform = platform
    }

    async buildDestPath() {
        let destPath = path.join(process["resourcesPath"], "chrome_search_caches")
        try {
            return new Promise((resolve, reject) => {
                if (!fs.existsSync(destPath)) {
                    fs.mkdir(destPath, {recursive: true}, (err) => {
                        if (err) {
                            reject(err)
                        } else {
                            resolve(destPath)
                        }
                    })
                }
                resolve(destPath)
            })
        } catch (error) {
            console.error("buildDestPath|创建目的文件夹失败", error);
            return null;
        }
    }

    async loadInfos() {
        let chromeDataDir = ''
        const profiles = ['Default', 'Profile 3', 'Profile 2', 'Profile 1']
        if (this.platform === 'win32') {
            chromeDataDir = path.join(process.env['LOCALAPPDATA'], 'Google/Chrome/User Data')
        } else if (this.platform === 'darwin') {
            chromeDataDir = path.join(window.utools.getPath('appData'), 'Google/Chrome')
        } else if (this.platform === 'linux') {
            chromeDataDir = path.join(window.utools.getPath('appData'), 'google-chrome')
        }
        const profile = profiles.find(profile => fs.existsSync(path.join(chromeDataDir, profile, 'History')))
        let destPath = await this.buildDestPath()
        if (!profile || !destPath) return []
        const historyDBPath = path.join(chromeDataDir, profile, 'History')
        let copyFilePath = path.join(destPath, "History_Cache")
        // 拷贝History的SQLITE 文件
        fs.copyFileSync(historyDBPath, copyFilePath)
        let historyInfos = []
        try {
            let SQL = await initSqlJs();
            this.historyDB = new SQL.Database(fs.readFileSync(copyFilePath))
            this.historyDB.each(QUERY_HISTORY_SQL, (row) => {
                historyInfos.push(new ItemInfo(row.title, row.url, row.title, "web.png", this.buildSearKeys(row)))
            }, () => {
            })
            console.log("History 初始化成功,加载数据%d条", historyInfos.length)
        } catch (error) {
            console.error("Error initializing database:", error)
        }
        this.cacheInfos = historyInfos
    }

    async listItemInfos(keyword) {
        return super.listItemInfos(keyword)
    }

    buildSearKeys(row) {
        let searKeys = []
        if (row === null || !pinyin.isSupported()) {
            return searKeys;
        }
        searKeys.push(row.title)
        searKeys.push(pinyin.convertToPinyin(row.title).toLowerCase())
        return searKeys
    }

}

module.exports = {
    ChromeHistory: ChromeHistory
}
