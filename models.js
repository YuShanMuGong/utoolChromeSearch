
class ItemInfo {
    constructor(title, url, description, icon , searchKeys) {
        this.title = title
        this.url = url
        this.description = description
        this.icon = icon
        this.searchKeys = searchKeys
    }
}

module.exports = {
    ItemInfo: ItemInfo
}