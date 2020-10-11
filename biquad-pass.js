export const common = (_, cut, res) => {
  _.w0 = _.pi2 * cut / _.sampleRate
  _.sin_w0 = Math.sin(_.w0)
  _.cos_w0 = Math.cos(_.w0)
  _.alpha = _.sin_w0 / (2.0 * res)
}

export const lp1 = (_, cut) => {
  _.w0 = _.pi2 * cut / _.sampleRate

  //_.a0 = 1.0
  _.a1 = -Math.exp(-_.w0)
  _.a2 = 0.0
  _.b0 = 1.0 + _.a1
  _.b1 = _.b2 = 0.0
}

export const hp1 = (_, cut) => {
  _.w0 = _.pi2 * cut / _.sampleRate

  //_.a0 = 1.0
  _.a1 = -Math.exp(-_.w0)
  _.a2 = 0.0
  _.b0 = (1.0 - _.a1) / 2.0
  _.b1 = -_.b0
  _.b2 = 0.0
}

export const lp = (_, cut, res=1) => {
    _.w0 = _.pi2 * cut / _.sampleRate
  _.sin_w0 = Math.sin(_.w0)
  _.cos_w0 = Math.cos(_.w0)
  _.alpha = _.sin_w0 / (2.0 * res)


  _.b0 = (1.0 - _.cos_w0) / 2.0
  _.b1 = 1.0 - _.cos_w0
  // _.b2 = _.b0
  _.a0 = 1.0 + _.alpha
  _.a1 = -2.0 * _.cos_w0
  _.a2 = 1.0 - _.alpha

  _.b0 /= _.a0
  _.b1 /= _.a0
  _.b2 = _.b0
  // _.b2 /= _.a0
  _.a1 /= _.a0
  _.a2 /= _.a0
}

export const hp = (_, cut, res=1) => {
    _.w0 = _.pi2 * cut / _.sampleRate
  _.sin_w0 = Math.sin(_.w0)
  _.cos_w0 = Math.cos(_.w0)
  _.alpha = _.sin_w0 / (2.0 * res)


  _.b0 = (1.0 + _.cos_w0) / 2.0
  _.b1 = -(1.0 + _.cos_w0)
  // _.b2 = _.b0
  _.a0 = 1.0 + _.alpha
  _.a1 = -2.0 * _.cos_w0
  _.a2 = 1.0 - _.alpha

  _.b0 /= _.a0
  _.b1 /= _.a0
  _.b2 = _.b0
  // _.b2 /= _.a0
  _.a1 /= _.a0
  _.a2 /= _.a0
}

export const bp = (_, cut, res=1) => {
    _.w0 = _.pi2 * cut / _.sampleRate
  _.sin_w0 = Math.sin(_.w0)
  _.cos_w0 = Math.cos(_.w0)
  _.alpha = _.sin_w0 / (2.0 * res)


  _.b0 = _.sin_w0 / 2.0
  _.b1 = 0.0
  // _.b2 = -_.b0
  _.a0 = 1.0 + _.alpha
  _.a1 = -2.0 * _.cos_w0
  _.a2 = 1.0 - _.alpha

  _.b0 /= _.a0
  _.b1 /= _.a0
  _.b2 = -_.b0
  // _.b2 /= _.a0
  _.a1 /= _.a0
  _.a2 /= _.a0
}

export const bpp = (_, cut, res=1) => {
    _.w0 = _.pi2 * cut / _.sampleRate
  _.sin_w0 = Math.sin(_.w0)
  _.cos_w0 = Math.cos(_.w0)
  _.alpha = _.sin_w0 / (2.0 * res)


  _.b0 = _.alpha
  _.b1 = 0.0
  // _.b2 = -_.alpha
  _.a0 = 1.0 + _.alpha
  _.a1 = -2.0 * _.cos_w0
  _.a2 = 1.0 - _.alpha

  _.b0 /= _.a0
  _.b1 /= _.a0
  _.b2 = -_.b0
  // _.b2 /= _.a0
  _.a1 /= _.a0
  _.a2 /= _.a0
}

export const not = (_, cut, res=1) => {
    _.w0 = _.pi2 * cut / _.sampleRate
  _.sin_w0 = Math.sin(_.w0)
  _.cos_w0 = Math.cos(_.w0)
  _.alpha = _.sin_w0 / (2.0 * res)


  _.b0 = 1.0
  _.b1 = -2.0 * _.cos_w0
  // _.b2 = 1.0
  _.a0 = 1.0 + _.alpha
  // _.a1 = _.b1
  _.a2 = 1.0 - _.alpha

  _.b0 /= _.a0
  _.b1 /= _.a0
  _.b2 = _.b0
  // _.b2 /= _.a0
  _.a1 = _.b1
  // _.a1 /= _.a0
  _.a2 /= _.a0
}

export const ap = (_, cut, res=1) => {
    _.w0 = _.pi2 * cut / _.sampleRate
  _.sin_w0 = Math.sin(_.w0)
  _.cos_w0 = Math.cos(_.w0)
  _.alpha = _.sin_w0 / (2.0 * res)


  _.b0 = 1.0 - _.alpha
  _.b1 = -2.0 * _.cos_w0
  _.b2 = 1.0 + _.alpha
  _.a0 = _.b2
  // _.a1 = _.b1
  // _.a2 = _.b0

  _.b0 /= _.a0
  _.b1 /= _.a0
  _.b2 /= _.a0
  _.a1 = _.b1
  // _.a1 /= _.a0
  _.a2 = _.b0
  // _.a2 /= _.a0
}

export const pk = (_, cut, res=1, gain=1) => {
    _.w0 = _.pi2 * cut / _.sampleRate
  _.sin_w0 = Math.sin(_.w0)
  _.cos_w0 = Math.cos(_.w0)
  _.alpha = _.sin_w0 / (2.0 * res)


  _.a = Math.pow(10.0, gain / 40.0)
  _.b0 = 1.0 + _.alpha * _.a
  _.b1 = -2.0 * _.cos_w0
  _.b2 = 1.0 - _.alpha * _.a
  _.a0 = 1.0 + _.alpha / _.a
  // _.a1 = _.b1
  _.a2 = 1.0 - _.alpha / _.a

  _.b0 /= _.a0
  _.b1 /= _.a0
  _.b2 /= _.a0
  _.a1 = _.b1
  // _.a1 /= _.a0
  _.a2 /= _.a0
}

export const ls = (_, cut, res=1, gain=1) => {
    _.w0 = _.pi2 * cut / _.sampleRate
  _.sin_w0 = Math.sin(_.w0)
  _.cos_w0 = Math.cos(_.w0)
  _.alpha = _.sin_w0 / (2.0 * res)


  _.a= Math.pow(10.0, gain / 40.0)
  _.c = 2.0 * Math.sqrt(_.a) * _.alpha
  _.b0 =_.a* ((_.a + 1.0) - (_.a - 1.0) * _.cos_w0 + _.c)
  _.b1 = 2.0 *_.a* ((_.a - 1.0) - (_.a + 1.0) * _.cos_w0)
  _.b2 =_.a* ((_.a + 1.0) - (_.a - 1.0) * _.cos_w0 - _.c)
  _.a0 = (_.a + 1.0) + (_.a - 1.0) * _.cos_w0 + _.c
  _.a1 = -2.0 * ((_.a - 1.0) + (_.a + 1.0) * _.cos_w0)
  _.a2 = (_.a + 1.0) + (_.a - 1.0) * _.cos_w0 - _.c

  _.b0 /= _.a0
  _.b1 /= _.a0
  _.b2 /= _.a0
  _.a1 /= _.a0
  _.a2 /= _.a0
}

export const hs = (_, cut, res=1, gain=1) => {
    _.w0 = _.pi2 * cut / _.sampleRate
  _.sin_w0 = Math.sin(_.w0)
  _.cos_w0 = Math.cos(_.w0)
  _.alpha = _.sin_w0 / (2.0 * res)


  _.a= Math.pow(10.0, gain / 40.0)
  _.c = 2.0 * Math.sqrt(_.a) * _.alpha
  _.b0 =_.a* ((_.a + 1.0) + (_.a - 1.0) * _.cos_w0 + _.c)
  _.b1 = -2.0 *_.a* ((_.a - 1.0) + (_.a + 1.0) * _.cos_w0)
  _.b2 =_.a* ((_.a + 1.0) + (_.a - 1.0) * _.cos_w0 - _.c)
  _.a0 = (_.a + 1.0) - (_.a - 1.0) * _.cos_w0 + _.c
  _.a1 = 2.0 * ((_.a - 1.0) - (_.a + 1.0) * _.cos_w0)
  _.a2 = (_.a + 1.0) - (_.a - 1.0) * _.cos_w0 - _.c

  _.b0 /= _.a0
  _.b1 /= _.a0
  _.b2 /= _.a0
  _.a1 /= _.a0
  _.a2 /= _.a0
}
