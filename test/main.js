var expect = require('chai').expect
var player = require('../index')

describe('web-player', function() {
  it('should be able to start mplayer', function() {
    var r = player.start()
    expect(r.status).to.equal('playing')
  })
  it('should be able to stop mplayer', function () {
    player.start()
    var r = player.stop()
    expect(r.status).to.equal('stopped')
  })
  it('should be able to start a di.fm playlist', function() {
    var p = player.start(player.di('hardcore'))
  })
})
