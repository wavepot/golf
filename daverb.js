/*
author: Khoin
github: https://github.com/khoin
repo: https://github.com/khoin/DattorroReverbNode

(modified slightly to process samples one by one instead of chunks)

In jurisdictions that recognize copyright laws, this software is to
be released into the public domain.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
THE AUTHOR(S) SHALL NOT BE LIABLE FOR ANYTHING, ARISING FROM, OR IN
CONNECTION WITH THE SOFTWARE OR THE DISTRIBUTION OF THE SOFTWARE.
*/

let sampleRate = 44100

export default class DattorroReverb {
  static TapDelays = [
    0.004771345, 0.003595309, 0.012734787, 0.009307483,
    0.022579886, 0.149625349, 0.060481839, 0.124995800,
    0.030509727, 0.141695508, 0.089244313, 0.106280031
  ]

  static Taps = [
    0.008937872, 0.099929438, 0.064278754, 0.067067639, 0.066866033, 0.006283391, 0.035818689,
    0.011861161, 0.121870905, 0.041262054, 0.08981553 , 0.070931756, 0.011256342, 0.004065724
  ]

  static get parameterDescriptors() {
    return [
      ["preDelay",        0,      0, sampleRate - 1, "k-rate"],
      ["bandwidth",       0.9999, 0, 1, "k-rate"],
      ["inputDiffusion1", 0.75,   0, 1, "k-rate"],
      ["inputDiffusion2", 0.625,  0, 1, "k-rate"],
      ["decay",           0.5,    0, 1, "k-rate"],
      ["decayDiffusion1", 0.7,    0, 0.999999, "k-rate"],
      ["decayDiffusion2", 0.5,    0, 0.999999, "k-rate"],
      ["damping",         0.005,  0, 1, "k-rate"],
      ["excursionRate",   0.5,    0, 2, "k-rate"],
      ["excursionDepth",  0.7,    0, 2, "k-rate"],
      ["wet",             0.3,    0, 1, "k-rate"],
      ["dry",             0.6,    0, 1, "k-rate"]
    ].map(x => new Object({
      name: x[0],
      defaultValue: x[1],
      minValue: x[2],
      maxValue: x[3],
      automationRate: x[4]
    }));
  }

  constructor(_) {
    this._ = _
    this._Delays = _.Delays
    this._taps = _.taps

    sampleRate = _.sr

    _.taps = this.constructor.Taps.map(x => Math.round(x * _.sr))

    // this._Delays    = [];
    // this._pDLength  = sampleRate //+ (128 - sampleRate%128); // Pre-delay is always one-second long, rounded to the nearest 128-chunk
    // this._preDelay  = new Float32Array(this._pDLength);
    // this._pDWrite   = 0;
    // this._lp1       = 0.0;
    // this._lp2       = 0.0;
    // this._lp3       = 0.0;
    // this._excPhase  = 0.0;

    this.constructor.TapDelays.forEach((x, i) => this.makeDelay(x, i));

    // this._taps = Int16Array.from([
    //   0.008937872, 0.099929438, 0.064278754, 0.067067639, 0.066866033, 0.006283391, 0.035818689,
    //   0.011861161, 0.121870905, 0.041262054, 0.08981553 , 0.070931756, 0.011256342, 0.004065724
    // ], x => Math.round(x * sampleRate));

    this.constructor.parameterDescriptors.forEach(p => {
      _.parameters[p.name] = p.defaultValue
      // TODO: add min-max
    })
  }

  makeDelay(length, index) {
    // len, array, write, read, mask
    let _ = this._

    let len = Math.round(length * _.sr);
    let nextPow2 = 2**Math.ceil(Math.log2((len)));

    _.Delays[index].len = len - 1
    _.Delays[index].mask = nextPow2 - 1
  }

  writeDelay(index, data) {
    return this._Delays[index].array[this._Delays[index].len] = data;
  }

  readDelay(index) {
    return this._Delays[index].array[this._Delays[index].read];
  }

  readDelayAt(index, i) {
    let d = this._Delays[index];
    return d.array[(d.read + i)&d.mask];
  }

  // cubic interpolation
  // O. Niemitalo: https://www.musicdsp.org/en/latest/Other/49-cubic-interpollation.html
  readDelayCAt(index, i) {
    let _ = this._.cubic
    let d = this._Delays[index]

    _.frac = i-~~i
    _.int  = ~~i + d.read - 1
    // d.mask = d[3];

    _.x0 = d.array[_.int++ & d.mask]
    _.x1 = d.array[_.int++ & d.mask]
    _.x2 = d.array[_.int++ & d.mask]
    _.x3 = d.array[_.int   & d.mask]

    _.a = (3*(_.x1 - _.x2) -    _.x0 + _.x3) / 2
    _.b =  2* _.x2 + _.x0  - (5*_.x1 + _.x3) / 2
    _.c =    (_.x2 - _.x0) / 2

    return (((_.a * _.frac) + _.b) * _.frac + _.c) * _.frac + _.x1
  }

  // First input will be downmixed to mono if number of channels is not 2
  // Outputs Stereo.
  process(x0, parameters) { // TODO: inline function calls
    const _ = this._

    Object.assign(
      _.parameters.local,
      _.parameters.default,
      parameters
    )
    // parameters = { ...this.defaultValues, ...parameters }
    const
        pd   = _.parameters.local.preDelay          ,
        bw   = _.parameters.local.bandwidth           ,
        fi   = _.parameters.local.inputDiffusion1     ,
        si   = _.parameters.local.inputDiffusion2     ,
        dc   = _.parameters.local.decay               ,
        ft   = _.parameters.local.decayDiffusion1     ,
        st   = _.parameters.local.decayDiffusion2     ,
        dp   = 1 - _.parameters.local.damping         ,
        ex   = _.parameters.local.excursionRate   / sampleRate        ,
        ed   = _.parameters.local.excursionDepth  * sampleRate / 1000 ,
        we   = _.parameters.local.wet             * 0.6               , // lo & ro both mult. by 0.6 anyways
        dr   = _.parameters.local.dry                 ;


    _.preDelay[_.pDWrite] = x0*.5

    // // write to predelay and dry output
    // if (inputs[0].length == 2) {
    //   for (let i = 127; i >= 0; i--) {
    //     this._preDelay[this._pDWrite+i] = (inputs[0][0][i] + inputs[0][1][i]) * 0.5;

    //     outputs[0][0][i] = inputs[0][0][i]*dr;
    //     outputs[0][1][i] = inputs[0][1][i]*dr;
    //   }
    // } else if (inputs[0].length > 0) {
    //   this._preDelay.set(
    //     inputs[0][0],
    //     this._pDWrite
    //   );
    //   for (let i = 127; i >= 0; i--)
    //     outputs[0][0][i] = outputs[0][1][i] = inputs[0][0][i]*dr;
    // } else {
    //   this._preDelay.set(
    //     new Float32Array(128),
    //     this._pDWrite
    //   );
    // }

    // let i = 0|0;
    // while (i < 128) {

    _.lp1 += bw * (_.preDelay[(_.pDLength + _.pDWrite - pd/* + i*/)%_.pDLength] - _.lp1);

    // pre-tank
    _.pre = this.writeDelay(0, _.lp1  - fi * this.readDelay(0) );
    _.pre = this.writeDelay(1, fi * (_.pre - this.readDelay(1)) +      this.readDelay(0) );
    _.pre = this.writeDelay(2, fi *  _.pre + this.readDelay(1)  - si * this.readDelay(2) );
    _.pre = this.writeDelay(3, si * (_.pre - this.readDelay(3)) +      this.readDelay(2) );

    _.split = si * _.pre + this.readDelay(3);

    // excursions
    // could be optimized?
    _.exc   = ed * (1 + Math.cos(_.excPhase*6.2800));
    _.exc2  = ed * (1 + Math.sin(_.excPhase*6.2847));

    // left loop
    _.temp = this.writeDelay(4, _.split + dc * this.readDelay(11)            + ft * this.readDelayCAt(4, _.exc) ); // tank diffuse 1
             this.writeDelay(5,                this.readDelayCAt(4, _.exc)   - ft * _.temp                      ); // long delay 1
    _.lp2 += dp * (this.readDelay(5) - _.lp2)                                                                    ; // damp 1
    _.temp = this.writeDelay(6,           dc * _.lp2                         - st * this.readDelay(6)           ); // tank diffuse 2
             this.writeDelay(7,                this.readDelay(6)             + st * _.temp                      ); // long delay 2
    // right loop
    _.temp = this.writeDelay(8, _.split + dc * this.readDelay(7)             + ft * this.readDelayCAt(8, _.exc2)); // tank diffuse 3
             this.writeDelay(9,                this.readDelayCAt(8, _.exc2)  - ft * _.temp                      ); // long delay 3
    _.lp3 += dp * (this.readDelay(9) - _.lp3)                                                                    ; // damp 2
    _.temp = this.writeDelay(10,          dc * _.lp3                         - st * this.readDelay(10)          ); // tank diffuse 4
             this.writeDelay(11,               this.readDelay(10)            + st * _.temp                      ); // long delay 4

    _.lo =
      this.readDelayAt( 9, _.taps[0])
    + this.readDelayAt( 9, _.taps[1])
    - this.readDelayAt(10, _.taps[2])
    + this.readDelayAt(11, _.taps[3])
    - this.readDelayAt( 5, _.taps[4])
    - this.readDelayAt( 6, _.taps[5])
    - this.readDelayAt( 7, _.taps[6]);

    _.ro =
      this.readDelayAt( 5, _.taps[7])
    + this.readDelayAt( 5, _.taps[8])
    - this.readDelayAt( 6, _.taps[9])
    + this.readDelayAt( 7, _.taps[10])
    - this.readDelayAt( 9, _.taps[11])
    - this.readDelayAt(10, _.taps[12])
    - this.readDelayAt(11, _.taps[13]);

    _.out = x0*dr + (_.lo+_.ro)*we*.5
    // outputs[0][0][i] += lo * we;
    // outputs[0][1][i] += ro * we;

    _.excPhase += ex;

    // i++;

    for (let j = 0, d = _.Delays[0]; j < 12; d = _.Delays[++j]) {
      d.len  = (d.len  + 1) & d.mask;
      d.read = (d.read + 1) & d.mask;
    }
    // }

    // Update preDelay index
    _.pDWrite = (_.pDWrite + 1) % _.pDLength;

    return _.out;
  }
}
