'use strict'
let express = require('express')
let cp = require('child_process')
let spawn = cp.spawn
let execSync = cp.execSync
let extend = require('util')._extend
let fs = require('fs');

let app = express()
app.use(require('morgan')('dev'))

var settings = {}

var player = null
function start (playlist) {
  if (player) { player.kill() }

  player = spawn('mplayer', ['-noconsolecontrols', '-playlist', playlist])
  return {status: 'playing'}
}

function stop () {
  if (player) {
    player.kill()
  }
  return {status: 'stopped'}
}

app.get('/play/:playlist', function (req, res) {
  let r = start(req.params.playlist)
  r.playlist = req.params.playlist
  res.json(r)
})

function di (channel) {
  return 'http://listen.di.fm/premium/' +
    channel +
    '.pls?listen_key=' +
    settings.di
}

app.get('/di/:channel', function (req, res) {
  let r = start(di(req.params.channel))
  r.channel = req.params.channel
  res.json(r)
})

app.get('/stop', function (req, res) {
  let r = stop()
  res.json(r)
})

function set () {
  return execSync('amixer set ' +
                  settings.control +
                  ' ' + [].join.call(arguments, ' '))
}

function volume (vol) {
  if (vol) {
    switch (vol) {
      case 'up':
        set('10%+')
        break
      case 'down':
        set('10%-')
        break
      default:
        set(vol + '%')
    }
  }
  return {volume: execSync('amixer get Master | egrep -o "[0-9]+%" | head -n 1').toString().trim()}
}

app.get('/volume', function (req, res) {
  res.json(volume())
})

app.get('/volume/:vol', function (req, res) {
  res.json(volume(req.params.vol))
})

function mute () {
  set('mute')
  return {status: 'muted'}
}
app.get('/mute', function (req, res) {
  res.json(mute())
})

function unmute () {
  set('unmute')
  return {status: 'unmuted'}
}
app.get('/unmute', function (req, res) {
  res.json(unmute())
})

function load(path) {
  try {
    let stats = fs.lstatSync(path);

    if (stats.isFile()) {
      try {
        var contents = fs.readFileSync(path, 'utf8')
        settings = extend(settings, JSON.parse(contents))
      } catch (err) { console.error("Error loading configuration: \n  " + err) }
    }
  } catch (err) { }

  settings.control = settings.control || 'Master'

  return settings
}

var main = function () {
  settings = require('minimist')(process.argv.slice(2))
  settings.conf = settings.f || settings.conf || './config.json'

  load(settings.conf)

  app.listen(settings.p || settings.port || 5050, function(){
    console.log("web-player listening on port %d in %s mode", this.address().port, app.settings.env);
  });
}

if (require.main === module) {
  main()
}

module.exports = {
  start, stop, di, app, main, volume, mute, unmute, load
}
