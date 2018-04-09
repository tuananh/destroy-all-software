const fs = require("fs");
const Promise = require("bluebird");
const transform = require("camaro");
const got = require("got");

(async () => {
  const feedUrl = "https://www.destroyallsoftware.com/screencasts/feed";
  const { body: feedData } = await got(feedUrl);
  const { urls } = transform(feedData, { urls: ["//item/link", "."] });

  // example download url
  // /screencasts/catalog/first-attempt-at-database-library/download?resolution=4k
  console.log(`downloading ${urls.length} files`);

  Promise.map(urls, downloadIndividualEpisode, { concurrency: 2 })
    .then(() => {
      console.log("all done");
    })
    .catch(function(err) {
      console.log("error in map");
    });
})();

function downloadIndividualEpisode(url) {
  return new Promise((resolve, reject) => {
    const parts = url.split("/");
    const fileName = parts.pop() + ".mp4";
    // 4k and 1080p are available
    const downloadUrl = url + "/download?resolution=1080p";
    console.log("downloading", fileName);

    got
      .stream(downloadUrl)
      .pipe(fs.createWriteStream("downloaded/" + fileName))
      .on('finish', function () {
        console.log("on finish", url);
        resolve()
      })
      // on end is probably not necessary
      .on("end", function() {
        console.log("on end", url);
        resolve();
      })
      .on("error", function(err) {
        console.log("on error ", err);
        // resolve anyway
        reject();
      });
  });
}
