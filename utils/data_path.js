/**
 * 路径相关的工具
 */

const path = require('path')
const fs = require("fs")

async function getDestPathPromise() {
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

function getChromePath(platform) {
    if (platform === 'win32') {
        return path.join(process.env['LOCALAPPDATA'], 'Google/Chrome/User Data')
    } else if (platform === 'darwin') {
        return path.join(window.utools.getPath('appData'), 'Google/Chrome')
    } else if (platform === 'linux') {
        return path.join(window.utools.getPath('appData'), 'google-chrome')
    }
}

async function copyFileToDest(platform, originFileName, targetFileName) {
    let chromeDataDir = getChromePath(platform)
    const profiles = ['Default', 'Profile 3', 'Profile 2', 'Profile 1']
    const profile = profiles.find(profile => fs.existsSync(path.join(chromeDataDir, profile, originFileName)))
    let destPath = await getDestPathPromise()
    if (!profile || !destPath) {
        return null
    }
    const originPath = path.join(chromeDataDir, profile, originFileName)
    let copyFilePath = path.join(destPath, targetFileName)
    fs.copyFileSync(originPath, copyFilePath)
    return copyFilePath
}

// async function copyHistoryFile(platform) {
//     let chromeDataDir = getChromePath(platform)
//     const profiles = ['Default', 'Profile 3', 'Profile 2', 'Profile 1']
//     const profile = profiles.find(profile => fs.existsSync(path.join(chromeDataDir, profile, 'History')))
//     let destPath = await data_path.DestPathPromise
//     if (!profile || !destPath) {
//         return null
//     }
//     const historyDBPath = path.join(chromeDataDir, profile, 'History')
//     let copyFilePath = path.join(destPath, "History_Cache")
//     // 拷贝History的SQLITE 文件
//     fs.copyFileSync(historyDBPath, copyFilePath)
//     return copyFilePath
// }

module.exports = {
    copyFileToDest : copyFileToDest
}