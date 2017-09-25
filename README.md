# Mosaic Picture

Simple webtask for pixelating pictures.

### How to use the endpoint

```bash
curl -X POST -H 'Content-Type: application/octet-stream' --data-binary '@/your/image/path.jpg' -o pixelated.jpg http://webtask.io/endpoing/100
```

Important that 100 is the number of pixels of each tile.

I could do the tiles relative to the size of the image, but maybe in another task.

### How it works

It receives an images in the body, wich node receives as several buffers chunks which we have to concatenate.

Then we load the images with Jimp, resize it to the tile size and we create a new image with the old size.

> we could have resize the image again to the original size but we don't get the tile effect because the library applies an algorithm for having a smoother result.

In the new image we have to copy the pixels of the resized image, but we have them in a 1-D array so for avoiding CPU cost I did some simple maths.

Finally, we send it as a response of the request!

### Workflow Integration

I did a little script to use this endpoint in the iPhone.

https://workflow.is/workflows/9586bb3b6eab410193ce2a3d628413d7

This probes that serverless is really usefull, without any hardware, complex configurations or huge deploys, I have a cool app in my iPhone.