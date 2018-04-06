const { send } = require('micro')
const fetch = require('node-fetch')
const { redis } = require('../connectors')

const orbits = {
  'ISS': 'International Space Station',
  'LEO': 'Low Earth',
  'PO': 'Polar',
  'GTO': 'Geosynchronous Transfer'
}

module.exports = async (req, res) => {
  const url = `${process.env.DATA_URL}/launches?order=desc`
  const key = 'nextlaunch:anterior'

  let flights = JSON.parse(await redis.get(key))
  if (!flights) {
    const results = await fetch(url)
    flights = await results.json()
    await redis.set(key, JSON.stringify(flights))
    await redis.expire(key, 60)
  }

  send(res, 200, flights.map(flight => {
    const payloads = flight.rocket.second_stage.payloads || []
    const cores = flight.rocket.first_stage.cores || []
    const reused = cores.reduce((condition, core) => condition + (core.reused ? 1 : 0), 0)
    const landings = cores.filter(core => core.landing_vehicle)

    return {
      id: flight.flight_number,
      name: payloads.reduce((name, payload) => `${name}, ${payload.payload_id}`, '').substr(2),
      date: flight.launch_date_utc,
      video: flight.links.video_link || null,
      patch: flight.links.mission_patch || null,
      rocket: {
        id: flight.rocket.rocket_id,
        name: flight.rocket.rocket_name,
        condition: reused === 0 ? 'new' : reused === cores.length ? 'reused' : 'partially_reused',
        blocks: cores.reduce((blocks, core) => `${blocks}, ${core.block}`, '').substr(2),
        landing: landings.length ? landings.map(core => core.landing_vehicle) : false,
        cores: cores.length
      },
      payloads: {
        orbit: [...new Set(payloads.map(load => load.orbit))].reduce((orbit, load) => `${orbit}, ${orbits[load] || load}`, '').substr(2),
        customers: payloads.reduce((customers, load) => `${customers}, ${load.customers.join(', ')}`, '').substr(2)
      }
    }
  }))
}
