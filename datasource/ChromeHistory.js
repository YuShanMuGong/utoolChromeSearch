
const { ItemInfo } = require('../models')
const initSqlJs = require("sql.js")
const fs = require("fs")
const path = require('path')
const datasource = require('./datasource')
const pinyin = require('tiny-pinyin')

const QUERY_HISTORY_SQL = "select * from urls order by last_visit_time desc limit 5000"


class ChomeHistory extends datasource.DataSource {

    constructor(platform) {
        super()
        this.platform = platform
    }

    async listItemInfos() {
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
        if (!profile) return []
        const historyDBPath = path.join(chromeDataDir, profile, 'History')

        fs.copyFileSync(historyDBPath, 'D:\\Codes\\utool_plugin\\cache\\History_Cache')

        let histroyInfos = []
        try {
            let SQL = await initSqlJs();
            let histroyDB = new SQL.Database(fs.readFileSync('D:\\Codes\\utool_plugin\\cache\\History_Cache'))
            histroyDB.each(QUERY_HISTORY_SQL, (row) => {
                histroyInfos.push(new ItemInfo(
                    row.title,
                    row.url,
                    row.title,
                    this.buildSearKeys(row)
                ))
            }, () => { })
        } catch (error) {
            console.error("Error initializing database:", error);
        }
        return histroyInfos
    }

    buildSearKeys(row) {
        let searKeys = []
        if (row === null || !pinyin.isSupported()) {
            return searKeys;
        }
        searKeys.push(pinyin.convertToPinyin(row.title)
            .toLowerCase())
        return searKeys
    }

}

module.exports = {
    ChomeHistory: ChomeHistory
}