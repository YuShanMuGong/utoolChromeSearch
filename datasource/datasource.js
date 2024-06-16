const pinyin = require("tiny-pinyin");

class DataSource {

    async loadInfos() {

    }

    async listItemInfos(keyword) {
        if (this.cacheInfos == null) {
            await this.loadInfos()
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