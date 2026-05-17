const fs = require('fs')
const path = require('path')

class Router {
    static register(app, botManager) {
        const endpointsDir = path.join(__dirname, '../endpoints')
        fs.readdirSync(endpointsDir).forEach(file => {
            if (file === 'BaseEndpoint.js') return
            const EndpointClass = require(path.join(endpointsDir, file))
            const handler = new EndpointClass(botManager)
            app[handler.method](handler.path, (req, res) => handler.handle(req, res))
            console.log(`[Router] Registered: ${handler.method.toUpperCase()} ${handler.path}`)
        })
    }
}

module.exports = Router
