const {ItemInfo} = require('../models')
const initSqlJs = require("sql.js")
const fs = require("fs")
const datasource = require('./datasource')
const pinyin = require('tiny-pinyin')
const data_path = require('../utils/data_path')

/**
 * 查询最近 1W条历史记录，建立拼音索引
 * @type {string}
 */
const QUERY_HISTORY_SQL = `
select * from (
 select * from urls group by title
)
order by last_visit_time desc limit 10000
`

const DEFAULT_ICON = "https://pic.616pic.com/ys_b_img/00/57/95/byFBGPDb5a.jpg"

/**
 * Chrome历史记录查询数据源
 */
class ChromeHistory extends datasource.DataSource {

    constructor(platform) {
        super()
        this.platform = platform
    }

    async preLoadInfos() {
        let copyFilePath = await data_path.copyFileToDest(this.platform , "History" , "History_Cache")
        let historyInfos = []
        try {
            let SQL = await initSqlJs();
            this.historyDB = new SQL.Database(fs.readFileSync(copyFilePath))
            this.historyDB.each(QUERY_HISTORY_SQL, (row) => {
                historyInfos.push(new ItemInfo(row.title, row.url, "【历史记录】" + row.title, DEFAULT_ICON, this.buildSearKeys(row)))
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

    findSourceName() {
        return "chromeHistory"
    }

}

module.exports = {
    ChromeHistory: ChromeHistory
}
