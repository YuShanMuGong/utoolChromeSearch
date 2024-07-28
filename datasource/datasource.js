const pinyin = require("tiny-pinyin");

/**
 * 数据源基类
 */
class DataSource {

    constructor() {
    }

    /**
     * 预加载数据
     * @returns {Promise<void>}
     */
    async preLoadInfos() {

    }

    /**
     * 数据源名称
     */
    findSourceName() {

    }

    /**
     * 通过关键词检索数据
     * @param keyword 关键词
     * @returns {Promise<*>} 返回值是一个 Promise
     */
    async listItemInfos(keyword) {
        console.log("searchWord = " + keyword)
        if (this.cacheInfos == null) {
            await this.preLoadInfos()
        }
        //如果是一个空的搜索词，截取前100个元素返回
        if (keyword.trim().length === 0) {
            console.log("返回前100条数据")
            if (this.cacheInfos.length <= 100) {
                return this.cacheInfos
            } else {
                return this.cacheInfos.slice(0, 100)
            }
        }
        let keywordPinyin = null
        if (pinyin.isSupported()) {
            keywordPinyin = pinyin.convertToPinyin(keyword).toLowerCase()
        }
        return this.cacheInfos.filter(info => info.searchKeys != null)
            .filter(info => {
                // 遍历可搜索的key 关键字匹配 或者 关键字的拼音匹配，那么就算匹配上了
                return info.searchKeys
                    .filter(key => key.includes(keyword) || key.includes(keywordPinyin))
                    .length > 0
            })
    }

}

module.exports = {
    DataSource: DataSource
}