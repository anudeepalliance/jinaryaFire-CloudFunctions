const globalVariables = require('globalVariables')

module.exports = {
    randomId: function (): String {
        let randomDocId = ""
        const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
        for (let i = 0; i < globalVariables.RANDOM_DOC_ID_LENGTH; i++) {
            randomDocId += characters.charAt(Math.floor(Math.random() * characters.length))
        }
        return randomDocId
    }
}