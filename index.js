const scraper = require('webscrape').default()
const parse = require('date-fns/parse')
const distance = require('date-fns/distance_in_words')

module.exports = async (req, res) => {
  const result = await scraper.get('https://spacexnow.com/upcoming.php')
  const target = result.$('.missioncell').first()

  return {
    title: target.find('.missionTitle').text(),
    next: parse(target.find('.infoLeft').eq(3).text()),
    distance: distance(new Date(), parse(target.find('.infoLeft').eq(3).text()), { includeSeconds: true })
  }
}
