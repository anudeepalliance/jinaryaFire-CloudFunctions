module.exports = {
    therandom28DocId : function (): String {
        let randomDocId = "someId"
        const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
        for (let i = 0; i < 28; i++) {
            randomDocId += characters.charAt(Math.floor(Math.random() * characters.length))
        }
        return randomDocId
    }
}