/**
 * 网页图标获取
 */

const data_path = require('./data_path')
const initSqlJs = require("sql.js")
const fs = require("fs")

let iconCaches = {}

const QUERY_HISTORY_SQL = `
select a.page_url as url , b.url as icon_url 
from icon_mapping a 
inner join favicons b 
on a.icon_id = b.id
where
`

async function findIcons(platform, urls) {
    let iconDB = getCache(platform)
    if (!iconDB) {
        let copyPath = await data_path.copyFileToDest(platform, "Favicons", "Favicons_Cache")
        let SQL = await initSqlJs()
        iconDB = new SQL.Database(fs.readFileSync(copyPath))
        putCache(platform, iconDB)
    }
    let sql = buildQueryIconSQL(urls)
    let resIcons = []
    iconDB.each(sql, (row) => {
        resIcons.push({url: row.url, iconUrl: row.icon_url})
    }, () => {})
    let resMap = {}
    urls.forEach(url => {
        let domain = extractDomain(url)
        let matchItem = resIcons.find(item => item.url.includes(domain))
        if (matchItem && matchItem.iconUrl) {
            resMap[url] = matchItem.iconUrl
        }
    })
    console.log("resMap" + JSON.stringify(resMap))
    return resMap
}


function getCache(platform) {
    let cache = iconCaches[platform]
    if (cache && cache.lastInitTime && (Math.abs(new Date().getTime() - cache.lastInitTime.getTime()) / 1000) <= 3) {
        return cache.value
    }
    return null
}

function putCache(platform, value) {
    iconCaches[platform] = {"lastInitTime": new Date(), "value": value}
}

function buildQueryIconSQL(urls) {
    if (!urls || urls.length <= 0) {
        return
    }
    let tail = ""
    urls.forEach(item => {
        tail += "(a.page_url like '%" + extractDomain(item) + "%') or "
    })
    return QUERY_HISTORY_SQL + tail.slice(0, -4) + "\n order by b.id desc"
}

function extractDomain(url) {
    // 使用URL构造函数解析URL
    const parsedUrl = new URL(url);
    // 获取主机名
    const hostname = parsedUrl.hostname;
    // 提取域名部分，这里我们取最后一个点之前的部分作为顶级域名
    const domainParts = hostname.split('.');
    // 通常顶级域名是最后一个点之后的部分，二级域名是倒数第二个点之后的部分
    return domainParts.slice(-2).join('.');
}

module.exports = {
    findIcons: findIcons
}