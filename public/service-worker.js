const FILES_TO_CACHE = [
  "./index.html",
  "./css/styles.css",
  "./js/idb.js",
  "./js/index.js",
  "./manifest.json",
];

const APP_PREFIX = 'BudgetSmart-';
const VERSION = 'version_01';
//set up as global const to help keep track of which cache to use
const CACHE_NAME = APP_PREFIX + VERSION;
const DATA_CACHE_NAME = "data-cache-" + VERSION;

//service workers run before window object is created (cant use window.eventlistener)
self.addEventListener('install', function(e) {
  //wait until installing phase is complete before moving to next
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      console.log('installing cache : ' + CACHE_NAME)
      //add all files in array to the cache
      return cache.addAll(FILES_TO_CACHE)
    })
  )
})

self.addEventListener('activate', function(e) {
  e.waitUntil(
    //.keys() returns an array of all cache names which we're naming "keyList"
    //"keyList" is a parameter that containes all cache names under <username>.github.oi
    caches.keys().then(function (keyList) {
      let cacheKeeplist = keyList.filter(function(key) {
        return key.indexOf(APP_PREFIX);
      });
      //push current cache to global variable
      cacheKeeplist.push(CACHE_NAME);
      //finish routine, resolves once all old versions are deleted
      return Promise.all(
        keyList.map(function (key, i) {
          if (cacheKeeplist.indexOf(key) === -1) {
            console.log('deleting cache : ' + keyList[i]);
            return caches.delete(keyList[i]);
          }
        })
      );
    })
  );
});

//Retrieve info from the cache
//listen for the fetch event
self.addEventListener('fetch', function(e) {
  // //log the URL of the requested resource
  // console.log('fetch request : ' + e.request.url)
// cache all get requests to /api routes
if (e.request.url.includes("/api/")) {
  e.respondWith(
    caches.open(DATA_CACHE_NAME).then(cache => {
      return fetch(e.request)
        .then(response => {
          // If the response was good, clone it and store it in the cache.
          if (response.status === 200) {
            cache.put(e.request.url, response.clone());
          }

          return response;
        })
        .catch(err => {
          // Network request failed, try to get it from the cache.
          return cache.match(e.request);
        });
    }).catch(err => console.log(err))
  );

  return;
}

e.respondWith(
  fetch(e.request).catch(function() {
    return caches.match(e.request).then(function(response) {
      if (response) {
        return response;
      } else if (e.request.headers.get("accept").includes("text/html")) {
        // return the cached home page for all requests for html pages
        return caches.match("/");
      }
    });
  })
);

  // //how to respond to the request 
  // e.respondWith(
  //   fetch(e.request).catch(function() {
  //   //check to see if the request is stored in the cache or not. 
  //   return caches.match(e.request).then(function(response) {
  //     if (response) {
  //       //log URL to console and return resource from cache
  //       console.log('responding with cache : ' + e.request.url)
  //       return response
  //       //otherwise the resource will be fetched from the network.
  //     } else {
  //       console.log('file is not cached, fetching : ' + e.request.url)
  //       return fetch(e.request)
  //     }
  //     // You can omit if/else for console.log & put one line below like this too.
  //     // return request || fetch(e.request)
  //   })
  // })
  // )
})