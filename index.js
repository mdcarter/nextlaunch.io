const { router, get } = require('microrouter')
const { config } = require('dotenv')
config({ path: './.env' })

module.exports = router(
  get('/api/upcoming', require('./routes/upcoming')),
  get('/api/anterior', require('./routes/anterior'))
)
