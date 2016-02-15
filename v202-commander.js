var rates = [0.125, 0.25, 0.5, 0.75, 1]
var expos = [0.125, 0.25, 0.5, 0.75, 1]
var thrExpos = [
  function(thr) {
    var expoThr = Math.sqrt(thr) * 16.0
    return expoThr
  },

  function(thr) {
    return thr
  },

  function(thr) {
    var expoThr = thr * thr / 256.0
    return expoThr
  }
]

var settings = {
  rate: 1,
  expo: 1,
  thrExpo: 1
}

var Cylon = require('cylon')
var config = __dirname + '\\T16000M.json'

var cmd = {
  thr: 0,
  yaw: 127,
  pit: 127,
  rol: 127
}

var comName;
var SerialPort = require('serialport').SerialPort
var sp = require('serialport')
var serialPort
sp.list(function(err, ports) {
  comName = ports[0].comName
  var serialPort = new SerialPort(comName, { baudrate: 115200 })
  serialPort.on('open', function() {
    console.log('Serial Port Open')
    console.log('rate: ', rates[settings.rate])
    serialPort.on('data', function(data) {
      console.log('Serial: ' + data)
    })

    Cylon.robot({
      connections: {
        joystick: { adaptor: 'joystick' }
      },

      devices: {
        controller: { driver: 'joystick', config: config }
      },

      work: function(bot)
      {
        bot.controller.on('thr:move', function(pos) {
          var thr = 255 + (pos + 1) * -127.5 // 0 - 255
          // var expoThr = thr * thr / 255 // still 0 - 255, but easier for human control
          // var expoThr = Math.sqrt(thr) * 16.0
          var expoFunc = thrExpos[settings.thrExpo]
          var expoThr = expoFunc(thr)
          cmd.thr = parseInt(expoThr) // 0 - 255
        })

        bot.controller.on('yaw:move', function(pos) {
          cmd.yaw = parseInt(127.5 + pos * 127.5 * 0.5)
        })

        bot.controller.on('pit:move', function(pos) {
          cmd.pit = parseInt(127.5 - pos * 127.5 * rates[settings.rate])
        })

        bot.controller.on('rol:move', function(pos) {
          cmd.rol = parseInt(127.5 + pos * 127.5 * rates[settings.rate])
        })

        // rate control
        bot.controller.on('rateUp:press', function() {
          if (settings.rate < rates.length - 1)
            settings.rate++
          console.log('rate: ', rates[settings.rate])
        })

        bot.controller.on('rateDown:press', function() {
          if (settings.rate > 0)
           settings.rate--
          console.log('rate: ', rates[settings.rate])
        })

        // expo control
        bot.controller.on('expoUp:press', function() {
          if (settings.expo < expos.length - 1)
            settings.expo++
          console.log('expo: ', expos[settings.expo])
        })

        bot.controller.on('expoDown:press', function() {
          if (settings.expo > 0)
           settings.expo--
          console.log('expo: ', expos[settings.expo])
        })

        // thr expo control
        bot.controller.on('thrUp:press', function() {
          if (settings.thrExpo < thrExpos.length - 1)
            settings.thrExpo++
          console.log('thrExpo: ', thrExpos[settings.thrExpo])
        })

        bot.controller.on('thrDown:press', function() {
          if (settings.thrExpo > 0)
           settings.thrExpo--
          console.log('thrExpo: ', thrExpos[settings.thrExpo])
        })
      }
    }).start()

    setInterval(function() {
      var cmdStr = 'cmd:' +
        cmd.thr + ',' +
        cmd.yaw + ',' +
        cmd.rol + ',' +
        cmd.pit +
        "\r\n"
      // console.log(cmdStr)
      serialPort.write(cmdStr, function(err, res) {
        // console.log('err: ', err)
        // console.log('res: ', res)
      })
    }, 25)
  })
})
