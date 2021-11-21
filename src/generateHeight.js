import { ImprovedNoise } from './noise.js';


export default function (width, height, mountainVariation) {

  var size = width * height,
    data = new Float32Array(size),
    perlin = new ImprovedNoise(),
    quality = 1,
    z = mountainVariation;

  for (var j = 0; j < 4; j++) {

    for (var i = 0; i < size; i++) {

      var x = i % width, y = (i / width);
      data[i] += Math.abs(perlin.noise(x / quality, y / quality, z) * quality * 1.75);

    }

    quality *= 5;

  }

  return data;

}