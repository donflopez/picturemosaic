const Jimp = require('jimp');
const R = require('ramda');

// string => [string]
const getPaths = R.split('/');

// string => number
const getTileSizeFromUrl = R.compose(parseInt, R.defaultTo(150), R.last, getPaths);

// Impure callback function
const getImageFromData = R.curry((imgData, chunk) => {
  imgData.data.push(chunk);
  imgData.length += chunk.length;
});

// {[Buffer], number} => Buffer
const getImageBuffer = (imgData) => Buffer.concat(imgData.data, imgData.length);

// ({number, number}, number) => {number, number}
const getTileDimensions = (imgData, tileSize) => ({
  tileW: ~~(imgData.width / tileSize),
  tileH: ~~(imgData.height / tileSize)
});

// Impure function that copy several values from bitmap2 to bitmap1
const copyPixel = (px1, px2, bitmap1, bitmap2) => {
  bitmap1.data[px1] = bitmap2.data[px2];
  bitmap1.data[px1 + 1] = bitmap2.data[px2 + 1];
  bitmap1.data[px1 + 2] = bitmap2.data[px2 + 2];
  bitmap1.data[px1 + 3] = bitmap2.data[px2 + 3];
};

module.exports = function(context, req, res) {
  const TILE_SIZE = getTileSizeFromUrl(req.url);

  const imgData = { data: [], length: 0 };

  req.on('data', getImageFromData(imgData));

  req.on('end', () => {
    Jimp.read(getImageBuffer(imgData), (err, oldImage) => {
      if (err) throw err;
      
      const width = oldImage.bitmap.width;
      const height = oldImage.bitmap.height;
      const tile = getTileDimensions(oldImage.bitmap, TILE_SIZE);

      oldImage.resize(tile.tileW, tile.tileH);

      new Jimp(width, height, (err, newImage) => {
        newImage.scan(
          0,
          0,
          newImage.bitmap.width,
          newImage.bitmap.height,
          (x, y, idx) => {
            /**
             * We're manipulating the image as a unidimensional array of colors vectors
             * [ r, g, b, a, r, g, b, a] <= this is an image of 2 pixels
             * we have to extrapolate the pixels of our reduced image into the new one with the original size.
             * This is the math for that.
             * y of the new image divide by the tilesize multiplied by the resized width give us the start of
             * our old image row, to get the correct pixel in that row, we add the new x position divided by the tilesize
             * and multiplied by 4 (the number of elements in a pixel).
             * */
            const baseIdx =
              (~~(y / TILE_SIZE) * oldImage.bitmap.width * 4) +
              (~~(x / TILE_SIZE) * 4);

            copyPixel(idx, baseIdx, newImage.bitmap, oldImage.bitmap);
          }
        );

        res.writeHead(200, {
          'Content-Type': 'image/' + newImage.getExtension()
        });

        newImage.getBuffer(newImage.getMIME(), (err, buffer) => {
          res.end(buffer, 'binary');
        });
      });
    }).catch(err => {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end(err);
    });
    
  });
};
